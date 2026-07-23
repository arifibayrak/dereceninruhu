import { tool } from "ai";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { aiAuditLog, enrollments, examTemplates, students } from "@/db/schema";
import {
  getEnrollmentDetailByStudentId,
  getSectionsForEnrollment,
} from "@/db/queries/enrollment";
import { getNetSeries, getWeekQuestionTotal } from "@/db/queries/tracking";
import { getTopicDeficits } from "@/db/queries/analiz";
import { getCohortScoreboard } from "@/db/queries/cohort";
import { getPlanForReuse, listWeeklyPlans } from "@/db/queries/plans";
import { netTrend } from "@/lib/insights";
import { trDayKey } from "@/lib/dates";

/**
 * Koç ajanı araçları — güvenlik modeli:
 * - OKUMA araçları (execute VAR): otomatik çalışır, ai_audit_log'a 'auto' yazar.
 * - YAZMA araçları (execute YOK): AI SDK bunları "bekleyen" tool-call olarak
 *   döndürür; koç onaylayınca MEVCUT Server Action çalışır ('confirmed').
 * - YASAK (hiç tanımlı değil): muhasebe, kullanıcı/PIN, silme, PII, kayıt yaşam
 *   döngüsü — model çağıramaz çünkü araç yok.
 */

export const AGENT_WRITE_TOOLS = [
  "create_plan_task",
  "add_question_log",
  "propose_weekly_program",
] as const;
export type AgentWriteTool = (typeof AGENT_WRITE_TOOLS)[number];

export function isWriteTool(name: string): name is AgentWriteTool {
  return (AGENT_WRITE_TOOLS as readonly string[]).includes(name);
}

async function logAudit(
  actorUserId: string,
  toolName: string,
  args: unknown,
  enrollmentId?: number | null,
) {
  await getDb()
    .insert(aiAuditLog)
    .values({
      actorUserId,
      enrollmentId: enrollmentId ?? null,
      toolName,
      argsJson: JSON.stringify(args ?? {}),
      decision: "auto",
      resultStatus: "ok",
    });
}

export type PendingAgentWrite = {
  toolName: AgentWriteTool;
  args: Record<string, unknown>;
};

/**
 * İstek başına araç seti + bekleyen-yazma toplayıcısı.
 * YAZMA araçları DB'ye yazmaz: argümanları `pending`'e iter ve "onaya sunuldu"
 * döndürür — böylece model tek adımda bitirir (execute'suz döngü kilitlenmesi yok).
 */
export function buildAgentTools(coachUserId: string) {
  const pending: PendingAgentWrite[] = [];
  const tools = {
    /* --------------------------- OKUMA (otomatik) --------------------------- */
    find_students: tool({
      description:
        "TÜM aktif öğrencileri TEK çağrıda tara: net eğilimi (up/down/flat + delta), bu hafta çözülen soru, kaç gündür giriş yok (daysSinceActivity), en zayıf dersler. 'Gerileyen/geride kalan öğrenciler', 'en çok/az soru çözenler', 'X gündür görüşülmeyen/giriş yapmayanlar', 'matematikte zorlananlar' gibi KADRO GENELİ soruları BURADAN yanıtla — tek tek get_student_overview çağırma. netDirection='down' = neti gerileyen. weakSubjects belirli bir dersi (ör. Matematik) filtrelemek için.",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = await getCohortScoreboard();
        await logAudit(coachUserId, "find_students", {});
        return { count: rows.length, students: rows.slice(0, 100) };
      },
    }),

    list_students: tool({
      description:
        "Öğrencileri listele veya isme göre ara. Bir öğrenciyle işlem yapmadan önce studentId'yi buradan çöz.",
      inputSchema: z.object({
        query: z.string().optional().describe("İsim parçası (opsiyonel)"),
      }),
      execute: async ({ query }) => {
        const db = getDb();
        const rows = await db
          .select({
            studentId: students.id,
            name: students.fullName,
            examCode: examTemplates.code,
          })
          .from(students)
          .innerJoin(
            enrollments,
            and(
              eq(enrollments.studentId, students.id),
              eq(enrollments.status, "active"),
            ),
          )
          .innerJoin(
            examTemplates,
            eq(examTemplates.id, enrollments.examTemplateId),
          )
          .where(isNull(students.deletedAt));
        const q = query?.toLocaleLowerCase("tr").trim();
        const filtered = q
          ? rows.filter((r) => r.name.toLocaleLowerCase("tr").includes(q))
          : rows;
        await logAudit(coachUserId, "list_students", { query });
        return { students: filtered.slice(0, 25) };
      },
    }),

    get_student_overview: tool({
      description:
        "Bir öğrencinin özeti: hedef, son net + eğilim, bu hafta çözülen soru, en zayıf konular.",
      inputSchema: z.object({
        studentId: z.coerce.number().int().positive(),
      }),
      execute: async ({ studentId }) => {
        const detail = await getEnrollmentDetailByStudentId(studentId);
        if (!detail) return { error: "Öğrenci bulunamadı." };
        const enrollmentId = detail.enrollment.id;
        const [series, weekTotal, deficits] = await Promise.all([
          getNetSeries(enrollmentId),
          getWeekQuestionTotal(enrollmentId),
          getTopicDeficits(enrollmentId),
        ]);
        const trend = netTrend(series.map((p) => ({ takenOn: p.takenOn, net: p.net })));
        await logAudit(coachUserId, "get_student_overview", { studentId }, enrollmentId);
        return {
          name: detail.student.fullName,
          exam: detail.enrollment.examCode,
          target: detail.enrollment.targetText,
          latestNet: trend.latest,
          netDelta: trend.delta,
          netDirection: trend.direction,
          weekQuestions: weekTotal,
          weakestTopics: deficits.slice(0, 3).map((d) => ({
            topic: d.topicName,
            subject: d.subjectName,
            errors: d.total,
          })),
        };
      },
    }),

    get_subjects: tool({
      description:
        "Bir öğrencinin sınavındaki ders id -> ad listesi. add_question_log için doğru subjectId'yi buradan al.",
      inputSchema: z.object({
        studentId: z.coerce.number().int().positive(),
      }),
      execute: async ({ studentId }) => {
        const detail = await getEnrollmentDetailByStudentId(studentId);
        if (!detail) return { error: "Öğrenci bulunamadı." };
        const sections = await getSectionsForEnrollment(
          detail.enrollment.examTemplateId,
          detail.enrollment.trackCode,
        );
        const subjects = sections.flatMap((s) =>
          s.loggable.map((subj) => ({ id: subj.id, name: subj.name })),
        );
        await logAudit(coachUserId, "get_subjects", { studentId }, detail.enrollment.id);
        return { subjects };
      },
    }),

    list_past_plans: tool({
      description:
        "Bir öğrencinin geçmiş + mevcut haftalık programlarını listele (hafta, durum, konu sayısı, motto). Yeni program önermeden ÖNCE eskiyi gör — tekrar etme, üstüne kur.",
      inputSchema: z.object({
        studentId: z.coerce.number().int().positive(),
      }),
      execute: async ({ studentId }) => {
        const detail = await getEnrollmentDetailByStudentId(studentId);
        if (!detail) return { error: "Öğrenci bulunamadı." };
        const weeks = await listWeeklyPlans(detail.enrollment.id, 8);
        await logAudit(coachUserId, "list_past_plans", { studentId }, detail.enrollment.id);
        return {
          plans: weeks.map((w) => ({
            weekStart: trDayKey(w.weekStart),
            status: w.status,
            taskCount: w.taskCount,
            motto: w.motto,
          })),
        };
      },
    }),

    get_plan: tool({
      description:
        "Belirli bir haftanın programındaki konuları getir (uyarlamak/kopyalamak için). weekStart pazartesi YYYY-MM-DD.",
      inputSchema: z.object({
        studentId: z.coerce.number().int().positive(),
        weekStart: z.string().describe("Haftanın pazartesisi, YYYY-MM-DD"),
      }),
      execute: async ({ studentId, weekStart }) => {
        const detail = await getEnrollmentDetailByStudentId(studentId);
        if (!detail) return { error: "Öğrenci bulunamadı." };
        const tasks = await getPlanForReuse(
          detail.enrollment.id,
          new Date(weekStart),
        );
        await logAudit(coachUserId, "get_plan", { studentId, weekStart }, detail.enrollment.id);
        return {
          topics: tasks.map((t) => ({
            day: t.day,
            subjectId: t.subjectId,
            description: t.description,
            targetQuestions: t.targetQuestions,
          })),
        };
      },
    }),

    /* ------------------------- YAZMA (onay gerekir) ------------------------- */
    create_plan_task: tool({
      description:
        "Programa TEK bir görev ekle. day boşsa haftalık konu (güne atanmamış). TÜM HAFTA için değil — tüm program için propose_weekly_program kullan. ONAY gerekir.",
      inputSchema: z.object({
        studentId: z.coerce.number().int().positive(),
        weekStart: z.string().describe("Haftanın pazartesisi, YYYY-MM-DD"),
        day: z.coerce
          .number()
          .int()
          .min(1)
          .max(7)
          .nullish()
          .describe("1=Pazartesi … 7=Pazar; boş = haftalık konu"),
        description: z.string().min(1).max(300),
        subjectId: z.coerce.number().int().positive().optional(),
        targetQuestions: z.coerce.number().int().min(0).max(2000).optional(),
      }),
      execute: async (args) => {
        pending.push({ toolName: "create_plan_task", args });
        return { status: "onaya_sunuldu" as const };
      },
    }),

    propose_weekly_program: tool({
      description:
        "Bir öğrenciye TÜM HAFTA için program öner (ders × konu) — konuları TEK çağrıda ver. Önce list_past_plans/get_plan ile geçmişe bak. subjectId için get_subjects'ten gerçek id kullan. day boşsa haftalık konu. ONAY gerekir.",
      inputSchema: z.object({
        studentId: z.coerce.number().int().positive(),
        weekStart: z.string().describe("Haftanın pazartesisi, YYYY-MM-DD"),
        items: z
          .array(
            z.object({
              description: z.string().min(1).max(300),
              subjectId: z.coerce.number().int().positive().optional(),
              day: z.coerce.number().int().min(1).max(7).nullish(),
              targetQuestions: z.coerce.number().int().min(0).max(2000).optional(),
            }),
          )
          .min(1)
          .max(40),
      }),
      execute: async (args) => {
        pending.push({ toolName: "propose_weekly_program", args });
        return { status: "onaya_sunuldu" as const };
      },
    }),

    add_question_log: tool({
      description:
        "ÇÖZÜLMÜŞ (geçmiş) soru sayısını kaydet. Önce get_subjects ile subjectId al. ONAY gerekir.",
      inputSchema: z.object({
        studentId: z.coerce.number().int().positive(),
        logDate: z.string().describe("YYYY-MM-DD"),
        subjectId: z.coerce.number().int().positive(),
        questionCount: z.coerce.number().int().min(0).max(2000),
      }),
      execute: async (args) => {
        pending.push({ toolName: "add_question_log", args });
        return { status: "onaya_sunuldu" as const };
      },
    }),
  };
  return { tools, pending };
}
