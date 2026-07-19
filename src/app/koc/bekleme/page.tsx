import type { Metadata } from "next";
import Link from "next/link";
import { ClockIcon, MessageCircleIcon, UserPlusIcon } from "lucide-react";

import { countWaitlistByStatus, listWaitlist } from "@/db/queries/cms";
import { formatInt } from "@/lib/format";
import { buildWaLink, waTemplates } from "@/lib/whatsapp";
import { waitlistStatusSchema, type WaitlistStatus } from "@/lib/validation";
import { WaitlistStatusSelect } from "@/components/app/waitlist-status-select";
import { SectionHeading } from "@/components/brand/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Bekleme Listesi" };

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const FILTERS: { key: "tümü" | WaitlistStatus; label: string }[] = [
  { key: "tümü", label: "Tümü" },
  { key: "bekliyor", label: "Bekliyor" },
  { key: "davet_edildi", label: "Davet edildi" },
  { key: "kayit", label: "Kayıt" },
  { key: "ayrildi", label: "Ayrıldı" },
];

const STATUS_BADGE: Record<WaitlistStatus, string> = {
  bekliyor: "bg-gold/15 text-gold-foreground dark:text-gold",
  davet_edildi: "bg-info/10 text-info",
  kayit: "bg-success/10 text-success",
  ayrildi: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<WaitlistStatus, string> = {
  bekliyor: "Bekliyor",
  davet_edildi: "Davet edildi",
  kayit: "Kayıt",
  ayrildi: "Ayrıldı",
};

/** wa.me linkinde ilk isim yeterli. */
function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** "Kayda çevir" — yeni öğrenci formunu bilgilerle önceden doldurur. */
function convertHref(entry: {
  name: string;
  phone: string;
  exam: string | null;
}) {
  const params = new URLSearchParams({ ad: entry.name, telefon: entry.phone });
  if (entry.exam === "KPSS" || entry.exam === "YKS" || entry.exam === "LGS") {
    params.set("sinav", entry.exam);
  }
  return `/koc/ogrenciler/yeni?${params.toString()}`;
}

export default async function BeklemePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const parsedStatus = waitlistStatusSchema.safeParse(sp.durum);
  const activeFilter: "tümü" | WaitlistStatus = parsedStatus.success
    ? parsedStatus.data
    : "tümü";

  const [rows, counts] = await Promise.all([
    listWaitlist(activeFilter === "tümü" ? undefined : activeFilter),
    countWaitlistByStatus(),
  ]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  // Sıra pozisyonu — yalnız 'bekliyor' için (en eskiden yeniye = FIFO).
  const positions = new Map<number, number>();
  let p = 0;
  for (const r of rows) {
    if (r.status === "bekliyor") positions.set(r.id, ++p);
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Pazarlama"
          title="Bekleme listesi"
          description="Dönem dolduğunda gelen talepler — sıradaki backlog. Durumu güncelle, WhatsApp'tan davet et, kayda çevir."
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
              href={
                f.key === "tümü"
                  ? "/koc/bekleme"
                  : `/koc/bekleme?durum=${encodeURIComponent(f.key)}`
              }
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
          <ClockIcon className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">
            {activeFilter === "tümü"
              ? "Henüz bekleme kaydı yok."
              : `"${FILTERS.find((f) => f.key === activeFilter)?.label}" durumunda kayıt yok.`}
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Siteye gelen bekleme talepleri burada listelenir
            (/bekleme-listesi formu).
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((entry) => {
            const pos = positions.get(entry.id);
            return (
              <li
                key={entry.id}
                className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {pos != null && (
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary tabular-nums">
                          {pos}
                        </span>
                      )}
                      <span className="text-sm font-semibold">{entry.name}</span>
                      {entry.exam && (
                        <Badge variant="outline">{entry.exam}</Badge>
                      )}
                      <Badge className={STATUS_BADGE[entry.status]}>
                        {STATUS_LABEL[entry.status]}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {dateFmt.format(entry.createdAt)}
                      {entry.source ? ` · ${entry.source}` : ""}
                      {" · "}
                      <a
                        href={`tel:0${entry.phone}`}
                        className="hover:text-primary"
                      >
                        0{entry.phone}
                      </a>
                    </span>
                  </div>
                  <WaitlistStatusSelect
                    entryId={entry.id}
                    status={entry.status}
                  />
                </div>

                {entry.message && (
                  <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm leading-relaxed text-pretty">
                    {entry.message}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    render={
                      <a
                        href={buildWaLink(
                          entry.phone,
                          waTemplates.beklemeDavet({
                            studentName: firstName(entry.name),
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
                  {entry.status !== "kayit" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      render={<Link href={convertHref(entry)} />}
                    >
                      <UserPlusIcon data-icon="inline-start" />
                      Kayda çevir
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
