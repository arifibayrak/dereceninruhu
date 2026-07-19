import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { enrollments } from "@/db/schema";
import { getSectionsForEnrollment } from "@/db/queries/enrollment";
import { getTopicGroupsForExam } from "@/db/queries/analiz";
import { getWeeklyPlan, getResourcesForEnrollment } from "@/db/queries/plans";
import { getMockList } from "@/db/queries/tracking";
import { formatTrDate } from "@/lib/dates";

/**
 * Bir enrollment için "grounding paketi": modelin ders/konu ADLARINI doğru
 * ID'lere eşlemesi, uydurmaması için bağlam. TÜM veriler mevcut sorgu
 * yardımcılarından gelir (yeni SQL yok). Çıktı, prompt'a gömülen düz metindir.
 *
 * Güvenlik: enrollmentId çağırandan (transkript kaydı) gelir; modele değil.
 */
export async function buildGroundingText(enrollmentId: number): Promise<string> {
  const db = getDb();
  const enr = await db.query.enrollments.findFirst({
    where: eq(enrollments.id, enrollmentId),
    with: { student: true, examTemplate: true, track: true },
  });
  if (!enr) throw new Error("Enrollment bulunamadı.");

  const examTemplateId = enr.examTemplateId;
  const trackCode = enr.track?.code ?? null;

  const [sections, topicGroups, plan, mocks, resources] = await Promise.all([
    getSectionsForEnrollment(examTemplateId, trackCode),
    getTopicGroupsForExam(examTemplateId, trackCode),
    getWeeklyPlan(enrollmentId, new Date()),
    getMockList(enrollmentId),
    getResourcesForEnrollment(enrollmentId),
  ]);

  const lines: string[] = [];
  lines.push("=== ÖĞRENCİ BAĞLAMI ===");
  lines.push(
    `Öğrenci: ${enr.student?.fullName ?? "-"} | Sınav: ${enr.examTemplate?.name ?? enr.examTemplate?.code ?? "-"}` +
      (enr.track?.name ? ` | Alan: ${enr.track.name}` : "") +
      (enr.targetText ? ` | Hedef: ${enr.targetText}` : ""),
  );

  // Bölümler + puanlanan/loglanabilir dersler (ID ZORUNLU eşleme kaynağı).
  lines.push("");
  lines.push("=== BÖLÜMLER ve DERSLER (id -> ad) ===");
  for (const s of sections) {
    lines.push(
      `# Bölüm ${s.id} ${s.name} [${s.code}] (yanlış/böl=${s.wrongPenaltyDivisor})`,
    );
    const scoredIds = new Set(s.scored.map((x) => x.id));
    for (const subj of s.loggable) {
      const tag = scoredIds.has(subj.id) ? "puanlanan" : "alt-ders";
      lines.push(`  ders ${subj.id}: ${subj.name} [${subj.code}] (${tag})`);
    }
  }

  // Konular (id -> ad), derse göre.
  lines.push("");
  lines.push("=== KONULAR (id -> ad, derse göre) ===");
  for (const g of topicGroups) {
    if (g.topics.length === 0) continue;
    const topicStr = g.topics.map((t) => `${t.id}:${t.name}`).join(", ");
    lines.push(`  [ders ${g.subjectId} ${g.subjectName}] ${topicStr}`);
  }

  // Kaynaklar (kitap/materyal id -> ad) — topic_progress_update için gerekli.
  lines.push("");
  lines.push("=== KAYNAKLAR (id -> ad) ===");
  if (resources.length === 0) {
    lines.push("(kaynak yok)");
  } else {
    lines.push(resources.map((r) => `${r.id}:${r.name}`).join(", "));
  }

  // Güncel haftalık plan.
  lines.push("");
  lines.push("=== GÜNCEL HAFTALIK PLAN ===");
  if (plan) {
    lines.push(
      `plan ${plan.id} | hafta başı ${formatTrDate(plan.weekStart)} | durum ${plan.status}` +
        (plan.motto ? ` | motto: ${plan.motto}` : ""),
    );
    for (const t of plan.tasks) {
      lines.push(
        `  gün ${t.day}${t.subjectName ? ` ${t.subjectName}` : ""}: ${t.description ?? "-"}` +
          (t.targetQuestions ? ` (hedef ${t.targetQuestions} soru)` : "") +
          (t.isDone ? " [yapıldı]" : ""),
      );
    }
  } else {
    lines.push("(bu hafta için plan yok)");
  }

  // Son denemeler.
  lines.push("");
  lines.push("=== SON DENEMELER ===");
  const recent = mocks.slice(0, 5);
  if (recent.length === 0) {
    lines.push("(deneme yok)");
  } else {
    for (const m of recent) {
      lines.push(
        `  ${formatTrDate(m.takenOn)} ${m.sectionName} [${m.scope}]${m.publisher ? ` ${m.publisher}` : ""} → net ${m.totalNet}`,
      );
    }
  }

  return lines.join("\n");
}
