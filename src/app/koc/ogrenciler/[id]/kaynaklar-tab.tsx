import { getSectionsForEnrollment } from "@/db/queries/enrollment";
import { listResourcesWithStats } from "@/db/queries/konular";
import { formatInt } from "@/lib/format";
import { ResourceManager } from "@/components/app/resource-manager";
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

/** Kokpit "Kaynaklar" sekmesi — kaynak CRUD + kaynak başına soru & konu. */
export async function KaynaklarTab({
  enrollmentId,
  examTemplateId,
  trackCode,
}: {
  enrollmentId: number;
  examTemplateId: number;
  trackCode: string | null;
}) {
  const [stats, sections] = await Promise.all([
    listResourcesWithStats(enrollmentId),
    getSectionsForEnrollment(examTemplateId, trackCode),
  ]);
  const subjectOptions = sections.flatMap((s) =>
    s.loggable.map((sub) => ({ id: sub.id, name: `${sub.name} (${s.name})` })),
  );
  const active = stats.filter((r) => r.isActive);

  return (
    <div className="flex flex-col gap-4">
      <ResourceManager
        enrollmentId={enrollmentId}
        resources={stats}
        subjects={subjectOptions}
      />

      <Card>
        <CardHeader>
          <CardTitle>Kaynak başına soru &amp; konu</CardTitle>
          <CardDescription>
            Her kaynaktan çözülen soru ve o kaynakta biten konu sayısı.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
              Aktif kaynak yok.
            </div>
          ) : (
            <div className="rounded-xl bg-card ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Kaynak</TableHead>
                    <TableHead>Ders</TableHead>
                    <TableHead className="text-right">Toplam soru</TableHead>
                    <TableHead className="text-right">Bu hafta</TableHead>
                    <TableHead className="pr-4 text-right">Biten konu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {active.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="pl-4 font-medium">{r.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.subjectName ?? "Genel"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatInt(r.totalQuestions)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatInt(r.weekQuestions)}
                      </TableCell>
                      <TableCell className="pr-4 text-right tabular-nums text-muted-foreground">
                        {formatInt(r.topicsDone)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
