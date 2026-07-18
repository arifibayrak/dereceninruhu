import type { Metadata } from "next";
import Link from "next/link";
import { InboxIcon, MessageCircleIcon, UserPlusIcon } from "lucide-react";

import { countLeadsByStatus, listLeads } from "@/db/queries/cms";
import { formatInt } from "@/lib/format";
import { buildWaLink, waTemplates } from "@/lib/whatsapp";
import { leadStatusSchema, type LeadStatus } from "@/lib/validation";
import { LeadStatusSelect } from "@/components/app/lead-status-select";
import { SectionHeading } from "@/components/brand/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Leadler" };

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const FILTERS: { key: "tümü" | LeadStatus; label: string }[] = [
  { key: "tümü", label: "Tümü" },
  { key: "yeni", label: "Yeni" },
  { key: "görüşüldü", label: "Görüşüldü" },
  { key: "kayıt", label: "Kayıt" },
  { key: "kayıp", label: "Kayıp" },
];

const STATUS_BADGE: Record<LeadStatus, string> = {
  yeni: "bg-gold/15 text-gold-foreground dark:text-gold",
  görüşüldü: "bg-info/10 text-info",
  kayıt: "bg-success/10 text-success",
  kayıp: "bg-muted text-muted-foreground",
};

/** wa.me linkinde ilk isim yeterli. */
function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** "Öğrenciye çevir" — yeni öğrenci formunu lead bilgisiyle önceden doldurur. */
function convertHref(lead: { name: string; phone: string; exam: string | null }) {
  const params = new URLSearchParams({ ad: lead.name, telefon: lead.phone });
  if (lead.exam === "KPSS" || lead.exam === "YKS" || lead.exam === "LGS") {
    params.set("sinav", lead.exam);
  }
  return `/koc/ogrenciler/yeni?${params.toString()}`;
}

export default async function LeadlerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const parsedStatus = leadStatusSchema.safeParse(sp.durum);
  const activeFilter: "tümü" | LeadStatus = parsedStatus.success
    ? parsedStatus.data
    : "tümü";

  const [rows, counts] = await Promise.all([
    listLeads(activeFilter === "tümü" ? undefined : activeFilter),
    countLeadsByStatus(),
  ]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Pazarlama"
          title="Lead havuzu"
          description="Siteden gelen ön görüşme talepleri — durumu güncelle, WhatsApp'tan ulaş, kayda çevir."
        />
      </div>

      {/* Durum filtreleri */}
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => {
          const count = f.key === "tümü" ? total : counts[f.key];
          const active = activeFilter === f.key;
          return (
            <Link
              key={f.key}
              href={f.key === "tümü" ? "/koc/leadler" : `/koc/leadler?durum=${encodeURIComponent(f.key)}`}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {f.label}
              <span className="rounded-full bg-background/70 px-1.5 text-xs tabular-nums ring-1 ring-foreground/10">
                {formatInt(count)}
              </span>
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-10 text-center ring-1 ring-foreground/10">
          <InboxIcon className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">
            {activeFilter === "tümü"
              ? "Henüz lead yok."
              : `"${FILTERS.find((f) => f.key === activeFilter)?.label}" durumunda lead yok.`}
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Siteye gelen ön görüşme talepleri burada listelenir
            (/iletisim formu).
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((lead) => (
            <li
              key={lead.id}
              className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{lead.name}</span>
                    {lead.exam && <Badge variant="outline">{lead.exam}</Badge>}
                    <Badge className={STATUS_BADGE[lead.status]}>
                      {lead.status.charAt(0).toLocaleUpperCase("tr-TR") +
                        lead.status.slice(1)}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {dateFmt.format(lead.createdAt)}
                    {lead.source ? ` · ${lead.source}` : ""}
                    {" · "}
                    <a href={`tel:0${lead.phone}`} className="hover:text-primary">
                      0{lead.phone}
                    </a>
                  </span>
                </div>
                <LeadStatusSelect leadId={lead.id} status={lead.status} />
              </div>

              {lead.message && (
                <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm leading-relaxed text-pretty">
                  {lead.message}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <a
                      href={buildWaLink(
                        lead.phone,
                        waTemplates.leadIlkTemas({
                          studentName: firstName(lead.name),
                        }),
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  <MessageCircleIcon data-icon="inline-start" />
                  WhatsApp
                </Button>
                {lead.status !== "kayıt" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    render={<Link href={convertHref(lead)} />}
                  >
                    <UserPlusIcon data-icon="inline-start" />
                    Öğrenciye çevir
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
