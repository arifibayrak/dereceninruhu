import { CircleAlertIcon, PackageIcon } from "lucide-react";

import { listAllPackages } from "@/db/queries/cms";
import { getSectionsForEnrollment } from "@/db/queries/enrollment";
import {
  getPackageOverview,
  listInstructorOptions,
} from "@/db/queries/paketler";
import type { EnrollmentDetail } from "@/db/queries/enrollment";
import { formatKurus } from "@/lib/format";
import {
  ENROLLMENT_PACKAGE_STATUS_LABELS,
  formatLessonMinutes,
  LESSON_STATUS_LABELS,
  PACKAGE_KIND_LABELS,
} from "@/lib/ozel-ders";
import { PackageAssignDialog } from "@/components/app/package-assign-dialog";
import {
  LessonDeleteButton,
  PackageDeleteButton,
} from "@/components/app/package-delete-buttons";
import { PrivateLessonDialog } from "@/components/app/private-lesson-dialog";
import { StatTile } from "@/components/brand/stat-tile";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * Kokpit "Paket & Ders" sekmesi — öğrencinin ne satın aldığı ve ne aldığı.
 *
 * Kalan saat SAKLANMAZ: her açılışta işlenen derslerden türetilir
 * (bkz. `@/lib/ozel-ders`). Böylece iptal/telafi/süre düzeltmesi sonrası sayaç
 * kendiliğinden doğrulanır.
 */
export async function PaketTab({
  enrollment,
}: {
  enrollment: EnrollmentDetail["enrollment"];
}) {
  const [overview, catalog, sections, instructors] = await Promise.all([
    getPackageOverview(enrollment.id),
    listAllPackages(),
    getSectionsForEnrollment(enrollment),
    listInstructorOptions(),
  ]);

  const { packages, lessons, quota, quotaByPackage } = overview;
  const activePackages = packages.filter((p) => p.status === "aktif");

  // Ders seçenekleri: kaydın sınav kapsamındaki tüm dersler, tekilleştirilmiş.
  const subjectOptions = Array.from(
    new Map(
      sections
        .flatMap((s) => s.loggable)
        .map((sub) => [sub.id, { id: sub.id, name: sub.name }]),
    ).values(),
  );

  const packageOptions = activePackages.map((p) => ({
    id: p.id,
    name: p.name,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Aktif paket"
          value={String(activePackages.length)}
          hint={
            activePackages.length > 0
              ? activePackages.map((p) => p.name).join(" · ")
              : "Henüz paket atanmadı"
          }
        />
        <StatTile
          label="Tanınan ders"
          value={formatLessonMinutes(quota.grantedMinutes)}
          hint="Aktif paketlerin toplamı"
        />
        <StatTile
          label="İşlenen ders"
          value={formatLessonMinutes(quota.usedMinutes)}
          hint={
            quota.scheduledMinutes > 0
              ? `+${formatLessonMinutes(quota.scheduledMinutes)} planlandı`
              : "Haktan düşen dersler"
          }
        />
        <StatTile
          label="Kalan hak"
          value={formatLessonMinutes(quota.remainingMinutes)}
          hint={
            quota.overusedMinutes > 0
              ? `${formatLessonMinutes(quota.overusedMinutes)} aşım`
              : "Kullanılabilir süre"
          }
        />
      </div>

      {quota.overusedMinutes > 0 && (
        <div className="flex items-start gap-3 rounded-xl bg-warning/10 p-4 text-sm">
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-warning" />
          <p className="text-pretty text-muted-foreground">
            Hakkın üstüne{" "}
            <strong className="text-foreground">
              {formatLessonMinutes(quota.overusedMinutes)}
            </strong>{" "}
            ders işlendi. Ya yeni bir paket ata ya da fazla dersleri
            &quot;kalan haktan düşsün&quot; işaretinden çıkar.
          </p>
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Paketler</CardTitle>
            <CardDescription>
              Öğrencinin satın aldığı hizmetler. Ad ve fiyat atama anında
              kopyalanır.
            </CardDescription>
          </div>
          <PackageAssignDialog
            enrollmentId={enrollment.id}
            catalog={catalog.map((c) => ({
              id: c.id,
              name: c.name,
              kind: c.kind,
              priceKurus: c.priceKurus,
              lessonHours: c.lessonHours,
            }))}
          />
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-muted/60 px-6 py-10 text-center">
              <PackageIcon className="size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Henüz paket atanmadı. &quot;Paket ata&quot; ile başla.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y">
              {packages.map((p) => {
                const q = quotaByPackage.get(p.id);
                return (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{p.name}</span>
                        <Badge variant="secondary">
                          {PACKAGE_KIND_LABELS[p.kind]}
                        </Badge>
                        {p.status !== "aktif" && (
                          <Badge variant="outline">
                            {ENROLLMENT_PACKAGE_STATUS_LABELS[p.status]}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatKurus(p.priceKurus)}
                        {p.lessonHoursGranted > 0 && q
                          ? ` · ${formatLessonMinutes(q.usedMinutes)} / ${formatLessonMinutes(q.grantedMinutes)} kullanıldı`
                          : ""}
                        {p.startsOn ? ` · ${dateFmt.format(p.startsOn)}` : ""}
                        {p.endsOn ? ` → ${dateFmt.format(p.endsOn)}` : ""}
                      </span>
                      {p.note && (
                        <span className="text-xs text-muted-foreground">
                          {p.note}
                        </span>
                      )}
                    </div>
                    <PackageAssignDialog
                      enrollmentId={enrollment.id}
                      catalog={[]}
                      assigned={p}
                    />
                    <PackageDeleteButton
                      enrollmentPackageId={p.id}
                      name={p.name}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Özel dersler</CardTitle>
            <CardDescription>
              Kalan hak yalnız &quot;İşlendi&quot; derslerden düşer.
            </CardDescription>
          </div>
          <PrivateLessonDialog
            enrollmentId={enrollment.id}
            packages={packageOptions}
            subjects={subjectOptions}
            instructors={instructors}
          />
        </CardHeader>
        <CardContent>
          {lessons.length === 0 ? (
            <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
              Henüz ders kaydı yok.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Ders</TableHead>
                    <TableHead>Eğitmen</TableHead>
                    <TableHead className="text-right">Süre</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Paket</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessons.map((l) => {
                    const when = l.heldAt ?? l.scheduledAt;
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="whitespace-nowrap tabular-nums">
                          {when ? dateFmt.format(when) : "—"}
                        </TableCell>
                        <TableCell>{l.subjectName ?? "—"}</TableCell>
                        <TableCell>{l.instructorName ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatLessonMinutes(l.durationMinutes)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              l.status === "held" ? "secondary" : "outline"
                            }
                          >
                            {LESSON_STATUS_LABELS[l.status]}
                          </Badge>
                          {!l.countsAgainstQuota && (
                            <Badge variant="outline" className="ml-1.5">
                              Haktan düşmez
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {l.packageName ?? "Ekstra"}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <PrivateLessonDialog
                            enrollmentId={enrollment.id}
                            packages={packageOptions}
                            subjects={subjectOptions}
                            instructors={instructors}
                            lesson={{
                              id: l.id,
                              enrollmentPackageId: l.enrollmentPackageId,
                              subjectId: l.subjectId,
                              instructorUserId: l.instructorUserId,
                              instructorProfileId: l.instructorProfileId,
                              scheduledAt: l.scheduledAt,
                              heldAt: l.heldAt,
                              durationMinutes: l.durationMinutes,
                              status: l.status,
                              countsAgainstQuota: l.countsAgainstQuota,
                              note: l.note,
                              studentVisibleNote: l.studentVisibleNote,
                            }}
                          />
                          <LessonDeleteButton
                            lessonId={l.id}
                            label={
                              when ? dateFmt.format(when) : (l.subjectName ?? "")
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
