import { getStudentInsightInput, getMockList } from "@/db/queries/tracking";
import { getTopicDeficits } from "@/db/queries/analiz";
import { getWeeklyPlan } from "@/db/queries/plans";
import { buildStudentInsights } from "@/lib/insights";
import { DAY_NAMES_TR, formatTrDate } from "@/lib/dates";

/**
 * Öğrenci sohbeti için "bağlam paketi" — YALNIZ bu enrollment'ın verisi.
 *
 * İzolasyon yapısaldır: enrollmentId çağırının kendi kaydından gelir; koç-özel
 * alanlar (görüşme özeti, muhasebe) hiç sorgulanmaz, prompt'a asla girmez.
 */
export async function buildStudentContextText(params: {
  enrollmentId: number;
  studentName: string;
  exam: string;
  target: string | null;
}): Promise<string> {
  const { enrollmentId } = params;
  const [insightInput, deficits, plan, mocks] = await Promise.all([
    getStudentInsightInput(enrollmentId),
    getTopicDeficits(enrollmentId),
    getWeeklyPlan(enrollmentId, new Date()),
    getMockList(enrollmentId),
  ]);

  const insights = buildStudentInsights({
    ...insightInput,
    weakestTopics: deficits
      .slice(0, 3)
      .map((d) => ({ topicName: d.topicName, errorCount: d.total })),
  });

  const lines: string[] = [];
  lines.push(
    `Öğrenci: ${params.studentName} | Sınav: ${params.exam}` +
      (params.target ? ` | Hedef: ${params.target}` : ""),
  );

  if (insights.length) {
    lines.push("");
    lines.push("Öne çıkanlar:");
    for (const i of insights) {
      lines.push(`- ${i.title}${i.detail ? `: ${i.detail}` : ""}`);
    }
  }

  if (plan && plan.tasks.length) {
    const done = plan.tasks.filter((t) => t.isDone).length;
    lines.push("");
    lines.push(`Bu haftaki plan (${done}/${plan.tasks.length} tamam):`);
    for (const t of plan.tasks.slice(0, 12)) {
      lines.push(
        `- ${DAY_NAMES_TR[t.day - 1] ?? `gün ${t.day}`}: ${t.description ?? "-"}` +
          (t.isDone ? " [yapıldı]" : ""),
      );
    }
  }

  const recent = mocks.slice(0, 3);
  if (recent.length) {
    lines.push("");
    lines.push("Son denemeler:");
    for (const m of recent) {
      lines.push(`- ${formatTrDate(m.takenOn)} ${m.sectionName}: net ${m.totalNet}`);
    }
  }

  if (deficits.length) {
    lines.push("");
    lines.push(
      "En zayıf konular: " +
        deficits
          .slice(0, 5)
          .map((d) => `${d.topicName} (${d.subjectName})`)
          .join(", "),
    );
  }

  return lines.join("\n");
}
