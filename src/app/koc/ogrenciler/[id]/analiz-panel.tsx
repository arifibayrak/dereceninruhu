import { getTopicDeficits, getTopicHeatmap } from "@/db/queries/analiz";
import { TopicDeficitList } from "@/components/app/topic-deficit-list";
import { TopicHeatmap } from "@/components/app/topic-heatmap";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Kokpit "Denemeler" sekmesi alt paneli — TOPLAM EKSİK + ısı haritası. */
export async function AnalizPanel({ enrollmentId }: { enrollmentId: number }) {
  const [deficits, heatmap] = await Promise.all([
    getTopicDeficits(enrollmentId),
    getTopicHeatmap(enrollmentId),
  ]);
  if (deficits.length === 0) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Toplam eksik</CardTitle>
          <CardDescription>
            Tüm deneme analizlerinden konu sıralaması.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopicDeficitList deficits={deficits} limit={8} />
        </CardContent>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Konu ısı haritası</CardTitle>
          <CardDescription>
            Deneme deneme eksikler — tekrarlayan koyu hücrelere odaklanın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopicHeatmap data={heatmap} />
        </CardContent>
      </Card>
    </div>
  );
}
