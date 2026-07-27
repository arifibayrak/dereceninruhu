import { getTopicDeficits } from "@/db/queries/analiz";
import type { ExamScopeSource } from "@/db/queries/enrollment";
import { getKonuProgress, getTopicResourceMatrix } from "@/db/queries/konular";
import { formatInt } from "@/lib/format";
import { TopicDeficitList } from "@/components/app/topic-deficit-list";
import { TopicResourceMatrix } from "@/components/app/topic-resource-matrix";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Kokpit "Konular" sekmesi — konu ilerleme + en zayıf konular + Bitti matrisi. */
export async function KonularTab({
  enrollmentId,
  exam,
}: {
  enrollmentId: number;
  /** Kaydın sınav(lar)ı — çift sınavlı öğrencide iki şablonun konuları gelir. */
  exam: ExamScopeSource;
}) {
  const [matrix, progress, deficits] = await Promise.all([
    getTopicResourceMatrix(enrollmentId, exam),
    getKonuProgress(enrollmentId, exam),
    getTopicDeficits(enrollmentId),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Konu ilerleme</CardTitle>
          <CardDescription>
            {formatInt(progress.doneTotal)} / {formatInt(progress.totalTopics)}{" "}
            konu bitti · %{progress.pct} tamamlandı
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {progress.subjects.length === 0 ? (
            <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
              Konu takibi için önce kaynak ekleyip konuları işaretle.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {progress.subjects.map((s) => {
                const pct =
                  s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
                return (
                  <li key={s.subjectId} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{s.subjectName}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatInt(s.done)}/{formatInt(s.total)} konu
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: s.chartColor ?? "var(--chart-1)",
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {deficits.length > 0 && (
            <div className="flex flex-col gap-2 border-t pt-4">
              <span className="text-sm font-semibold text-muted-foreground">
                En zayıf konular
              </span>
              <TopicDeficitList deficits={deficits} limit={3} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Konu × kaynak takibi</CardTitle>
          <CardDescription>
            Ders seç; her konunun hangi kaynakta bittiğini işaretle. Öğrenci de
            kendi tarafından işaretleyebilir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopicResourceMatrix
            enrollmentId={enrollmentId}
            groups={matrix.groups}
            resources={matrix.resources.map((r) => ({
              id: r.id,
              name: r.name,
              subjectId: r.subjectId,
            }))}
            initialDone={matrix.done}
          />
        </CardContent>
      </Card>
    </div>
  );
}
