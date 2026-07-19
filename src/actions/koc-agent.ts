"use server";

import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { generateText, stepCountIs } from "ai";
import { getDb } from "@/db";
import {
  aiAuditLog,
  chatMessages,
  chatThreads,
  students,
  subjects,
} from "@/db/schema";
import { AI_MODELS, chatModel } from "@/lib/ai/openrouter";
import { AGENT_WRITE_TOOLS, buildAgentTools } from "@/lib/ai/agent-tools";
import { getEnrollmentDetailByStudentId } from "@/db/queries/enrollment";
import { addPlanTask } from "@/actions/plans";
import { upsertQuestionLogs } from "@/actions/tracking";
import { DAY_NAMES_TR, mondayOf, trDayKey, trWeekday } from "@/lib/dates";
import {
  actionError,
  guarded,
  requireCoach,
  type ActionResult,
} from "@/actions/_guard";
import { assertEnrollmentAccess } from "@/actions/_access";

const AGENT_SYSTEM = `Sen Derecenin Ruhu koçluk platformunun KOÇ ASİSTANISIN.
Koça öğrencileri hakkında bilgi verir ve onun adına işlem ÖNERİRSİN.

KURALLAR:
- Bir öğrenciyle işlem yapmadan önce list_students ile ismi studentId'ye çöz.
  Birden çok eşleşme varsa hangi öğrenci olduğunu koça SOR, tahmin etme.
- Soru sayısı eklemeden önce get_subjects ile doğru subjectId'yi al. ID UYDURMA.
- create_plan_task ve add_question_log ONAY gerektirir: çağırınca koç onaylayana
  kadar YAZILMAZ. "Ekledim/kaydettim" DEME; "onayına sunuyorum" de.
- Tarihler YYYY-MM-DD; weekStart mutlaka pazartesi olmalı.
- Bir seferde yalnız BİR yazma önerisi yap.
- Muhasebe, kullanıcı/şifre, silme, öğrenci bilgisi düzenleme YAPAMAZSIN.
- Türkçe, kısa ve net konuş.`;

export type PendingWrite = {
  toolCallId: string;
  toolName: string;
  argsJson: string;
  summary: string;
};

const sendSchema = z.object({
  threadId: z.coerce.number().int().positive().nullish(),
  text: z.string().trim().min(1).max(2000),
});

async function subjectName(id: number): Promise<string | null> {
  const s = await getDb().query.subjects.findFirst({
    where: eq(subjects.id, id),
  });
  return s?.name ?? null;
}

/** Bekleyen yazma önerisini koçun okuyabileceği Türkçe özete çevir. */
async function summarizeWrite(
  toolName: string,
  args: Record<string, unknown>,
): Promise<string> {
  const studentId = Number(args.studentId);
  const st = await getDb().query.students.findFirst({
    where: eq(students.id, studentId),
  });
  const who = st?.fullName ?? `Öğrenci #${studentId}`;
  if (toolName === "create_plan_task") {
    const day = DAY_NAMES_TR[Number(args.day) - 1] ?? `gün ${String(args.day)}`;
    const subj = args.subjectId ? await subjectName(Number(args.subjectId)) : null;
    return `${who} · ${day}: ${String(args.description ?? "")}${subj ? ` [${subj}]` : ""}${args.targetQuestions ? ` (${String(args.targetQuestions)} soru)` : ""}`;
  }
  if (toolName === "add_question_log") {
    const subj = await subjectName(Number(args.subjectId));
    return `${who} · ${String(args.logDate ?? "")}: ${subj ?? `ders #${String(args.subjectId)}`} ${String(args.questionCount)} soru`;
  }
  return `${who}: ${toolName}`;
}

/** Koç ajanına mesaj gönder: okuma araçları otomatik çalışır, yazma önerileri döner. */
export async function sendCoachAgentMessage(
  input: unknown,
): Promise<
  ActionResult<{ threadId: number; text: string; pendingWrites: PendingWrite[] }>
> {
  return guarded(async () => {
    const user = await requireCoach();
    const parsed = sendSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const { threadId: inThreadId, text } = parsed.data;
    const db = getDb();

    let threadId: number;
    if (inThreadId) {
      const t = await db.query.chatThreads.findFirst({
        where: eq(chatThreads.id, inThreadId),
      });
      if (!t || t.ownerUserId !== user.id) return actionError("Sohbet bulunamadı.");
      threadId = t.id;
    } else {
      const [t] = await db
        .insert(chatThreads)
        .values({
          ownerUserId: user.id,
          audience: "coach",
          title: text.slice(0, 60),
        })
        .returning({ id: chatThreads.id });
      threadId = t.id;
    }

    const history = await db.query.chatMessages.findMany({
      where: eq(chatMessages.threadId, threadId),
      orderBy: [asc(chatMessages.createdAt)],
    });
    const modelMessages = history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    await db.insert(chatMessages).values({ threadId, role: "user", content: text });
    modelMessages.push({ role: "user", content: text });

    const now = new Date();
    const dateCtx = `BUGÜN: ${trDayKey(now)} (${DAY_NAMES_TR[trWeekday(now) - 1]}). Bu haftanın pazartesisi: ${trDayKey(mondayOf(now))}. Göreli tarihleri ("bu hafta", "dün") buna göre çöz.`;

    const { tools, pending } = buildAgentTools(user.id);
    const result = await generateText({
      model: chatModel(AI_MODELS.agent),
      system: `${AGENT_SYSTEM}\n\n${dateCtx}`,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(5),
      temperature: 0,
    });

    const assistantText = result.text?.trim() ?? "";
    if (assistantText) {
      await db
        .insert(chatMessages)
        .values({ threadId, role: "assistant", content: assistantText });
    }

    const pendingWrites: PendingWrite[] = [];
    for (let i = 0; i < pending.length; i++) {
      const p = pending[i];
      pendingWrites.push({
        toolCallId: `${p.toolName}-${i}`,
        toolName: p.toolName,
        argsJson: JSON.stringify(p.args),
        summary: await summarizeWrite(p.toolName, p.args),
      });
    }

    return { ok: true, data: { threadId, text: assistantText, pendingWrites } };
  });
}

const confirmSchema = z.object({
  threadId: z.coerce.number().int().positive(),
  toolName: z.enum(AGENT_WRITE_TOOLS),
  argsJson: z.string().max(4000),
});

/** Bekleyen yazma önerisini ONAYLA: mevcut Server Action çalışır, denetime yazılır. */
export async function confirmCoachAgentWrite(
  input: unknown,
): Promise<ActionResult<{ done: true }>> {
  return guarded(async () => {
    const user = await requireCoach();
    const parsed = confirmSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const { threadId, toolName, argsJson } = parsed.data;
    const db = getDb();

    let args: Record<string, unknown>;
    try {
      args = JSON.parse(argsJson) as Record<string, unknown>;
    } catch {
      return actionError("Argümanlar okunamadı.");
    }

    const detail = await getEnrollmentDetailByStudentId(Number(args.studentId));
    if (!detail) return actionError("Öğrenci bulunamadı.");
    const enrollmentId = detail.enrollment.id;
    await assertEnrollmentAccess(db, enrollmentId, user);

    const result: ActionResult<unknown> =
      toolName === "create_plan_task"
        ? await addPlanTask({
            enrollmentId,
            weekStart: args.weekStart,
            day: args.day,
            description: args.description,
            subjectId: args.subjectId ?? null,
            targetQuestions: args.targetQuestions ?? null,
          })
        : await upsertQuestionLogs({
            enrollmentId,
            logDate: args.logDate,
            entries: [
              { subjectId: args.subjectId, questionCount: args.questionCount },
            ],
          });

    await db.insert(aiAuditLog).values({
      actorUserId: user.id,
      enrollmentId,
      toolName,
      argsJson,
      decision: "confirmed",
      resultStatus: result.ok ? "ok" : "error",
      error: result.ok ? null : result.error,
    });
    await db.insert(chatMessages).values({
      threadId,
      role: "tool",
      content: result.ok
        ? `✓ ${toolName} uygulandı`
        : `✗ ${toolName}: ${result.error}`,
    });

    if (!result.ok) return actionError(result.error);
    return { ok: true, data: { done: true } };
  });
}

/** Bekleyen öneriyi REDDET (yalnız denetime yazılır). */
export async function rejectCoachAgentWrite(
  input: unknown,
): Promise<ActionResult<{ done: true }>> {
  return guarded(async () => {
    const user = await requireCoach();
    const parsed = confirmSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const { toolName, argsJson } = parsed.data;
    await getDb()
      .insert(aiAuditLog)
      .values({
        actorUserId: user.id,
        toolName,
        argsJson,
        decision: "denied",
      });
    return { ok: true, data: { done: true } };
  });
}
