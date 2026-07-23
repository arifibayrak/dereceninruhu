import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarClockIcon, ExternalLinkIcon, VideoIcon } from "lucide-react";

import { getEnrollmentDetailByUserId } from "@/db/queries/enrollment";
import {
  listSessionsForEnrollment,
  type EnrollmentSessionRow,
} from "@/db/queries/sessions";
import { getCurrentUser, type Role } from "@/lib/session";
import { parseCalLink } from "@/lib/cal";
import { CoachCalBooking } from "@/components/app/coach-cal-booking";
import { NoEnrollmentCard } from "@/components/app/no-enrollment";
import { PlanCallsConfirm } from "@/components/app/plan-calls-confirm";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Görüşmeler" };

export const dynamic = "force-dynamic";

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

function SessionRow({ s }: { s: EnrollmentSessionRow }) {
  const meta = STATUS_META[s.status];
  const at = s.heldAt ?? s.scheduledAt;
  return (
    <li className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium">
          {at ? dtFmt.format(at) : "Tarih belirsiz"}
        </span>
        {s.studentVisibleNote && (
          <span className="truncate text-xs text-muted-foreground">
            {s.studentVisibleNote}
          </span>
        )}
      </div>
      {s.meetingUrl && s.status === "scheduled" ? (
        <a
          href={s.meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <VideoIcon className="size-4" />
          Katıl
        </a>
      ) : (
        <Badge className={meta.className}>{meta.label}</Badge>
      )}
    </li>
  );
}

export default async function OgrenciGorusmelerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const role = (user as { role?: Role }).role ?? "student";

  const detail = await getEnrollmentDetailByUserId(user.id);
  if (!detail) {
    return <NoEnrollmentCard isCoach={role === "coach" || role === "admin"} />;
  }
  const { enrollment } = detail;

  const { upcoming, past } = await listSessionsForEnrollment(enrollment.id);
  const cal = parseCalLink(enrollment.coachCalBookingUrl);
  const planned = enrollment.callsScheduledAt != null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-semibold">Görüşmeler</h1>
        <p className="text-sm text-muted-foreground">
          Koçunla görüşmelerini buradan planla — bu haftanın ya da bu ayın
          saatlerini seç, gerektiğinde yeniden planla.
        </p>
      </div>

      {cal ? (
        <Card>
          <CardHeader>
            <CardTitle>Görüşme saatini seç</CardTitle>
            <CardDescription>
              {enrollment.coachName
                ? `${enrollment.coachName} ile görüşme takvimi`
                : "Koçunun görüşme takvimi"}{" "}
              — uygun bir saat seç. Başka saat lazımsa aynı takvimden yeniden
              planlayabilirsin.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {cal.calLink ? (
              <CoachCalBooking calLink={cal.calLink} url={cal.url} />
            ) : (
              <a
                href={cal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <ExternalLinkIcon className="size-4" />
                Görüşme takvimini aç
              </a>
            )}
            <PlanCallsConfirm planned={planned} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
            <CalendarClockIcon className="size-4 shrink-0" />
            Koçun görüşme takvimini yakında paylaşacak. Hazır olduğunda buradan
            randevu alabileceksin.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Görüşmelerim</CardTitle>
          <CardDescription>Yaklaşan ve geçmiş görüşmelerin.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Yaklaşan
            </span>
            {upcoming.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
                <CalendarClockIcon className="size-4 shrink-0" />
                Planlanmış görüşme yok.
              </div>
            ) : (
              <ul className="flex flex-col divide-y">
                {upcoming.map((s) => (
                  <SessionRow key={s.id} s={s} />
                ))}
              </ul>
            )}
          </div>

          {past.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Geçmiş
              </span>
              <ul className="flex flex-col divide-y">
                {past.slice(0, 10).map((s) => (
                  <SessionRow key={s.id} s={s} />
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
