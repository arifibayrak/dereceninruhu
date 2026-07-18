import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDaysIcon, HistoryIcon } from "lucide-react";

import { listAllSessions } from "@/db/queries/sessions";
import { formatInt } from "@/lib/format";
import { SectionHeading } from "@/components/brand/section-heading";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CoachSessionRow } from "@/db/queries/sessions";

export const metadata: Metadata = { title: "Görüşmeler" };

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

function SessionRow({ s }: { s: CoachSessionRow }) {
  const meta = STATUS_META[s.status];
  const at = s.heldAt ?? s.scheduledAt;
  const note = s.summary?.trim() || s.studentVisibleNote?.trim() || null;
  return (
    <li className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/koc/ogrenciler/${s.studentId}?tab=gorusmeler`}
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
  const { upcoming, recent } = await listAllSessions();

  return (
    <>
      <SectionHeading
        eyebrow="Koçluk döngüsü"
        title="Görüşmeler"
        description="Tüm öğrencilerin planlı ve geçmiş görüşmeleri. Yeni görüşme planlamak için öğrencinin kokpitine gir."
      />

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
