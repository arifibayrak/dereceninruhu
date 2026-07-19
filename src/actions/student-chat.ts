"use server";

import { and, asc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { generateText } from "ai";
import { getDb } from "@/db";
import { chatMessages, chatThreads } from "@/db/schema";
import { AI_MODELS, chatModel } from "@/lib/ai/openrouter";
import { buildStudentContextText } from "@/lib/ai/student-context";
import { getEnrollmentDetailByUserId } from "@/db/queries/enrollment";
import { startOfTrtDay } from "@/lib/dates";
import {
  actionError,
  guarded,
  requireUser,
  type ActionResult,
} from "@/actions/_guard";

const DAILY_LIMIT = 30;

const STUDENT_SYSTEM = `Sen Derecenin Ruhu'nda bir öğrencinin çalışma asistanısın.
KURALLAR:
- YALNIZ bu öğrencinin kendi verisi üzerinden konuş; başka öğrenciden bahsetme.
- Net/sıralama/puan TAHMİNİ yapma ("kesin girersin" gibi sözler verme).
- Tıbbi, psikolojik veya ailevi konularda tavsiye verme; koçuna yönlendir.
- Motive edici ama dürüst ol. Kısa, sade, Türkçe cevap ver.`;

const sendSchema = z.object({
  threadId: z.coerce.number().int().positive().nullish(),
  text: z.string().trim().min(1).max(1000),
});

/** Öğrenci "yolculuk" sohbeti — yalnız kendi verisiyle temellenir, yazma yok. */
export async function sendStudentChatMessage(
  input: unknown,
): Promise<ActionResult<{ threadId: number; text: string }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = sendSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const { threadId: inThreadId, text } = parsed.data;
    const db = getDb();

    const detail = await getEnrollmentDetailByUserId(user.id);
    if (!detail) return actionError("Aktif kaydın bulunamadı.");
    const enrollmentId = detail.enrollment.id;

    // Günlük mesaj limiti (suistimal + maliyet freni).
    const since = startOfTrtDay(new Date());
    const todays = await db
      .select({ id: chatMessages.id })
      .from(chatMessages)
      .innerJoin(chatThreads, eq(chatThreads.id, chatMessages.threadId))
      .where(
        and(
          eq(chatThreads.ownerUserId, user.id),
          eq(chatMessages.role, "user"),
          gte(chatMessages.createdAt, since),
        ),
      );
    if (todays.length >= DAILY_LIMIT) {
      return actionError("Bugünlük soru limitine ulaştın. Yarın tekrar dene.");
    }

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
          enrollmentId,
          audience: "student",
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

    const context = await buildStudentContextText({
      enrollmentId,
      studentName: detail.student.fullName,
      exam: detail.enrollment.examCode,
      target: detail.enrollment.targetText,
    });

    const result = await generateText({
      model: chatModel(AI_MODELS.chat),
      system: `${STUDENT_SYSTEM}\n\n=== SENİN VERİN ===\n${context}`,
      messages: [...modelMessages, { role: "user", content: text }],
      temperature: 0.3,
    });
    const answer =
      result.text?.trim() || "Şu an cevap veremedim, tekrar dener misin?";

    await db
      .insert(chatMessages)
      .values({ threadId, role: "assistant", content: answer });

    return { ok: true, data: { threadId, text: answer } };
  });
}
