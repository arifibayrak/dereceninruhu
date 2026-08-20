import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GraduationCapIcon, VideoIcon } from "lucide-react";

import { getEnrollmentDetailByUserId } from "@/db/queries/enrollment";
import {
  getPackageOverview,
  type PrivateLessonRow,
} from "@/db/queries/paketler";
import {
  formatLessonMinutes,
  LESSON_STATUS_LABELS,
  PACKAGE_KIND_LABELS,
} from "@/lib/ozel-ders";
import { getCurrentUser, type Role } from "@/lib/session";
import { NoEnrollmentCard } from "@/components/app/no-enrollment";
import { StatTile } from "@/components/brand/stat-tile";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Özel Ders" };

export const dynamic = "force-dynamic";

const dtFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  weekday: "short",
  day: "numeric",
  month: "short",
});

const STATUS_CLASS: Record<PrivateLessonRow["status"], string> = {
  scheduled: "bg-info/10 text-info",
  held: "bg-success/10 text-success",
  missed: "bg-warning/10 text-warning",
  cancelled: "bg-muted text-muted-foreground",
};

function LessonRow({ l }: { l: PrivateLessonRow }) {
  const at = l.heldAt ?? l.scheduledAt;
  return (
    <li className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium">
          {l.subjectName ?? "Özel ders"}
          {at ? ` · ${dtFmt.format(at)}` : ""}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatLessonMinutes(l.durationMinutes)}
          {l.instructorName ? ` · ${l.instructorName}` : ""}
        </span>
        {l.studentVisibleNote && (
          <span className="text-xs text-pretty text-muted-foreground">
            {l.studentVisibleNote}
          </span>
        )}
      </div>
      {l.meetingUrl && l.status === "scheduled" && (
        <a
          href={l.meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          <VideoIcon className="size-3.5" />
          Katıl
        </a>
      )}
      <Badge className={STATUS_CLASS[l.status]}>
        {LESSON_STATUS_LABELS[l.status]}
      </Badge>
    </li>
  );
}

/**
 * Öğrencinin özel ders ekranı — SALT OKUNUR.
 *
 * Ders kaydını yalnız koç/öğretmen girer: "ders yapıldı" ticari bir gerçektir,
 * öğrencinin beyanına bırakılamaz (bkz. `src/actions/paketler.ts`). Öğrenci
 * kalan hakkını, yaklaşan derslerini ve kendisine bırakılan notları görür.
 */
export default async function OzelDersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const role = (user as { role?: Role }).role ?? "student";

  const detail = await getEnrollmentDetailByUserId(user.id);
  if (!detail) {
    return <NoEnrollmentCard isCoach={role === "coach" || role === "admin"} />;
  }

  const { packages, lessons, quota } = await getPackageOverview(
    detail.enrollment.id,
  );
  const activePackages = packages.filter((p) => p.status === "aktif");

  // Bugün yapılacak ders "geçmiş"e düşmesin diye bir günlük tolerans.
  const cutoff = new Date().getTime() - 86_400_000;
  const upcoming = lessons.filter(
    (l) =>
      l.status === "scheduled" && (l.scheduledAt?.getTime() ?? 0) >= cutoff,
  );
  const past = lessons.filter((l) => !upcoming.includes(l));

  if (activePackages.length === 0 && lessons.length === 0) {
    return (
      <>
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-title">Özel ders</h1>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-12 text-center ring-1 ring-foreground/10">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/10">
            <GraduationCapIcon className="size-5 text-primary" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-heading text-lg font-semibold">
              Özel ders paketin yok
            </p>
            <p className="text-sm text-pretty text-muted-foreground">
              Koçluk bir sistemdir, ders anlatımı değildir. Konu eksiğini
              kapatmak için ders almak istersen koçunla konuş — özel ders ayrı
              bir hizmet olarak eklenir ve saatleri buradan takip edilir.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-title">Özel ders</h1>
        <p className="text-sm text-muted-foreground">
          Kalan hakkın ve işlenen derslerin. Kayıtları öğretmenin girer.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Kalan hak"
          value={formatLessonMinutes(quota.remainingMinutes)}
          hint={
            quota.scheduledMinutes > 0
              ? `${formatLessonMinutes(quota.scheduledMinutes)} planlandı`
              : "Kullanabileceğin süre"
          }
        />
        <StatTile
          label="İşlenen ders"
          value={formatLessonMinutes(quota.usedMinutes)}
          hint={`Toplam ${formatLessonMinutes(quota.grantedMinutes)} hak`}
        />
      </div>

      {activePackages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Paketlerin</CardTitle>
            <CardDescription>Şu an aktif olan hizmetlerin.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y">
              {activePackages.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium">{p.name}</span>
                    {p.lessonHoursGranted > 0 && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {p.lessonHoursGranted} saat ders dahil
                      </span>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {PACKAGE_KIND_LABELS[p.kind]}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Yaklaşan dersler</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
              Planlanmış ders yok. Ders almak istersen koçuna yaz.
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {upcoming.map((l) => (
                <LessonRow key={l.id} l={l} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Geçmiş dersler</CardTitle>
            <CardDescription>
              Öğretmenin bıraktığı notlar burada görünür.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y">
              {past.map((l) => (
                <LessonRow key={l.id} l={l} />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
