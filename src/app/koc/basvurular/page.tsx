import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ClipboardCheckIcon,
  ExternalLinkIcon,
  MailIcon,
  MessageCircleIcon,
  UserPlusIcon,
} from "lucide-react";

import {
  countCoachApplicationsByStatus,
  listCoachApplications,
} from "@/db/queries/cms";
import { formatInt } from "@/lib/format";
import { getViewer } from "@/lib/session";
import { buildWaLink, waTemplates } from "@/lib/whatsapp";
import {
  coachApplicationStatusSchema,
  type CoachApplicationStatus,
} from "@/lib/validation";
import { ApplicationStatusSelect } from "@/components/app/application-status-select";
import { SectionHeading } from "@/components/brand/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Koç Başvuruları" };

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const FILTERS: { key: "tümü" | CoachApplicationStatus; label: string }[] = [
  { key: "tümü", label: "Tümü" },
  { key: "yeni", label: "Yeni" },
  { key: "inceleniyor", label: "İnceleniyor" },
  { key: "gorusme", label: "Görüşme" },
  { key: "kabul", label: "Kabul" },
  { key: "ret", label: "Ret" },
];

const STATUS_BADGE: Record<CoachApplicationStatus, string> = {
  yeni: "bg-gold/15 text-gold-foreground dark:text-gold",
  inceleniyor: "bg-info/10 text-info",
  gorusme: "bg-primary/10 text-primary",
  kabul: "bg-success/10 text-success",
  ret: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<CoachApplicationStatus, string> = {
  yeni: "Yeni",
  inceleniyor: "İnceleniyor",
  gorusme: "Görüşme",
  kabul: "Kabul",
  ret: "Ret",
};

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** "Koça çevir" — yönetimdeki koç ekleme formunu önceden doldurur. */
function convertToCoachHref(app: { name: string; email: string | null }) {
  const params = new URLSearchParams({ yeniKoc: "1", ad: app.name });
  if (app.email) params.set("email", app.email);
  return `/koc/yonetim?${params.toString()}`;
}

export default async function BasvurularPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Koç başvuruları YALNIZ yöneticiye görünür (koçlar /koc'a yönlenir).
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  if (viewer.role !== "admin") redirect("/koc");

  const sp = await searchParams;
  const parsedStatus = coachApplicationStatusSchema.safeParse(sp.durum);
  const activeFilter: "tümü" | CoachApplicationStatus = parsedStatus.success
    ? parsedStatus.data
    : "tümü";

  const [rows, counts] = await Promise.all([
    listCoachApplications(activeFilter === "tümü" ? undefined : activeFilter),
    countCoachApplicationsByStatus(),
  ]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Yönetim"
          title="Koç başvuruları"
          description="Siteden gelen koç başvuruları — yalnız yöneticiler görür. Durumu güncelle, görüşmeye çağır, uygun olanı koça çevir."
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
                  ? "/koc/basvurular"
                  : `/koc/basvurular?durum=${encodeURIComponent(f.key)}`
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
          <ClipboardCheckIcon className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">
            {activeFilter === "tümü"
              ? "Henüz başvuru yok."
              : `"${FILTERS.find((f) => f.key === activeFilter)?.label}" durumunda başvuru yok.`}
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Siteye gelen koç başvuruları burada listelenir (/koc-basvuru formu).
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((app) => (
            <li
              key={app.id}
              className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{app.name}</span>
                    {app.subjects && (
                      <Badge variant="outline">{app.subjects}</Badge>
                    )}
                    <Badge className={STATUS_BADGE[app.status]}>
                      {STATUS_LABEL[app.status]}
                    </Badge>
                  </div>
                  <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground tabular-nums">
                    {dateFmt.format(app.createdAt)}
                    {app.source ? ` · ${app.source}` : ""}
                    {" · "}
                    <a href={`tel:0${app.phone}`} className="hover:text-primary">
                      0{app.phone}
                    </a>
                    {app.email && (
                      <a
                        href={`mailto:${app.email}`}
                        className="inline-flex items-center gap-1 hover:text-primary"
                      >
                        <MailIcon className="size-3" />
                        {app.email}
                      </a>
                    )}
                  </span>
                </div>
                <ApplicationStatusSelect
                  applicationId={app.id}
                  status={app.status}
                />
              </div>

              {app.experience && (
                <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm leading-relaxed text-pretty">
                  <span className="font-medium text-foreground">Deneyim: </span>
                  {app.experience}
                </p>
              )}
              {app.message && (
                <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm leading-relaxed text-pretty">
                  {app.message}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <a
                      href={buildWaLink(
                        app.phone,
                        waTemplates.basvuruGorusme({
                          studentName: firstName(app.name),
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
                {app.link && (
                  <Button
                    variant="ghost"
                    size="sm"
                    render={
                      <a
                        href={app.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    <ExternalLinkIcon data-icon="inline-start" />
                    CV / Profil
                  </Button>
                )}
                {app.status !== "ret" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    render={<Link href={convertToCoachHref(app)} />}
                  >
                    <UserPlusIcon data-icon="inline-start" />
                    Koça çevir
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
