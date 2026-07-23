import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDaysIcon,
  HistoryIcon,
  MessageCircleIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { listAllSessions, listUnplannedStudents } from "@/db/queries/sessions";
import { getViewer } from "@/lib/session";
import { formatInt } from "@/lib/format";
import { absoluteUrl } from "@/lib/seo";
import { buildWaLink, waTemplates } from "@/lib/whatsapp";
import { SectionHeading } from "@/components/brand/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CoachSessionRow } from "@/db/queries/sessions";

export const metadata: Metadata = { title: "Görüşmeler" };

const GORUSME_URL = absoluteUrl("/ogrenci/gorusmeler");

const dtFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const STATUS_META = {
  scheduled: { label: "Planlandı", className: "bg-info/10 text-info" },
  held: { label: "Yapıldı", className: "bg-success/10 text-success" },
  missed: { label: "Gelmedi", className: "bg-warning/10 text-warning" },
  cancelled: { label: "İptal", className: "bg-muted text-muted-foreground" },
} as const;

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

function SessionRow({ s }: { s: CoachSessionRow }) {
  const meta = STATUS_META[s.status];
  const at = s.heldAt ?? s.scheduledAt;
  const note = s.summary?.trim() || s.studentVisibleNote?.trim() || null;
  return (
    <li className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/koc/ogrenciler/${s.studentId}/gorusmeler`}
            className="truncate text-sm font-medium hover:text-primary"
          >
            {s.studentName}
          </Link>
          <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
            {s.examCode}
          </Badge>
        </div>
        <span className="truncate text-xs text-muted-foreground">
          {at ? dtFmt.format(at) : "Tarih belirsiz"}
          {note ? ` · ${note}` : ""}
        </span>
      </div>
      <Badge className={meta.className}>{meta.label}</Badge>
    </li>
  );
}

export default async function KocGorusmelerPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");

  const db = getDb();
  const [{ upcoming, recent }, unplanned, self] = await Promise.all([
    listAllSessions(),
    listUnplannedStudents(viewer),
    viewer.role === "coach"
      ? db.query.users.findFirst({
          where: eq(users.id, viewer.id),
          columns: { calBookingUrl: true },
        })
      : Promise.resolve(null),
  ]);

  const needsOwnCalLink = viewer.role === "coach" && !self?.calBookingUrl;

  return (
    <>
      <SectionHeading
        eyebrow="Koçluk döngüsü"
        title="Görüşmeler"
        description="Tüm öğrencilerin planlı ve geçmiş görüşmeleri. Yeni görüşme planlamak için öğrencinin kokpitine gir."
      />

      {needsOwnCalLink ? (
        <div className="flex items-start gap-3 rounded-xl bg-warning/10 p-4 text-sm text-warning">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          <p>
            <strong className="font-medium">Görüşme takvimin eksik.</strong>{" "}
            Öğrencilerin uygulamadan randevu alamıyor.{" "}
            <Link href="/koc/profil" className="underline underline-offset-4">
              Profilinden Cal linkini ekle
            </Link>
            .
          </p>
        </div>
      ) : (
        unplanned.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Görüşmesini planlamayanlar · {formatInt(unplanned.length)}
              </CardTitle>
              <CardDescription>
                Takvimin hazır ama henüz randevu almamış aktif öğrenciler — bir
                hatırlatma gönder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col divide-y">
                {unplanned.map((s) => (
                  <li
                    key={s.studentId}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <Link
                      href={`/koc/ogrenciler/${s.studentId}/gorusmeler`}
                      className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm font-medium hover:text-primary"
                    >
                      <span className="truncate">{s.studentName}</span>
                      <Badge
                        variant="outline"
                        className="h-4 px-1.5 text-[10px]"
                      >
                        {s.examCode}
                      </Badge>
                    </Link>
                    {s.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        render={
                          <a
                            href={buildWaLink(
                              s.phone,
                              `${waTemplates.gorusmePlanla({
                                studentName: firstName(s.studentName),
                              })}\n${GORUSME_URL}`,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        }
                      >
                        <MessageCircleIcon data-icon="inline-start" />
                        Hatırlat
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Yaklaşan · {formatInt(upcoming.length)}</CardTitle>
            <CardDescription>Tarihe göre sıralı planlı görüşmeler.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
                <CalendarDaysIcon className="size-4 shrink-0" />
                Planlanmış görüşme yok.
              </div>
            ) : (
              <ul className="flex flex-col divide-y">
                {upcoming.map((s) => (
                  <SessionRow key={s.sessionId} s={s} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geçmiş</CardTitle>
            <CardDescription>Son görüşmeler — yeniden eskiye.</CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
                <HistoryIcon className="size-4 shrink-0" />
                Henüz görüşme geçmişi yok.
              </div>
            ) : (
              <ul className="flex flex-col divide-y">
                {recent.map((s) => (
                  <SessionRow key={s.sessionId} s={s} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
