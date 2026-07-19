"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { coachingSessions, enrollments } from "@/db/schema";
import { mondayOf, trDayKey } from "@/lib/dates";
import { getOrCreateWeeklyPlan } from "@/db/queries/plans";
import {
  createSessionSchema,
  planFromSessionSchema,
  updateSessionSchema,
} from "@/lib/validation";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireCoach,
  type ActionResult,
} from "@/actions/_guard";

const clean = (v?: string | null) => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};

/** Toplantı linkinden sağlayıcıyı çıkar (etiket/ikon için). */
function detectProvider(
  url: string | null,
): "google_meet" | "zoom" | "other" | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("meet.google")) return "google_meet";
    if (host.includes("zoom.")) return "zoom";
    return "other";
  } catch {
    return "other";
  }
}

/** Koç: görüşme planlar (tarih/saat + öğrencinin göreceği not). */
export async function createSession(
  input: unknown,
): Promise<ActionResult<{ sessionId: number }>> {
  return guarded(async () => {
    await requireCoach();
    const parsed = createSessionSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();

    const enrollment = await db.query.enrollments.findFirst({
      where: eq(enrollments.id, v.enrollmentId),
    });
    if (!enrollment) return actionError("Kayıt bulunamadı.");

    const meetingUrl = clean(v.meetingUrl);
    const [session] = await db
      .insert(coachingSessions)
      .values({
        enrollmentId: v.enrollmentId,
        scheduledAt: v.scheduledAt,
        status: "scheduled",
        studentVisibleNote: clean(v.studentVisibleNote),
        summary: clean(v.summary),
        meetingUrl,
        meetingProvider: detectProvider(meetingUrl),
      })
      .returning({ id: coachingSessions.id });

    return { ok: true, data: { sessionId: session.id } };
  });
}

/**
 * Koç: görüşmeyi günceller — tarih, durum (yapıldı/gelmedi/iptal), koç özeti,
 * öğrenci notu, bağlı plan. Verilmeyen alanlar dokunulmaz; durum "held"
 * olduğunda heldAt otomatik damgalanır.
 */
export async function updateSession(
  input: unknown,
): Promise<ActionResult<{ sessionId: number }>> {
  return guarded(async () => {
    await requireCoach();
    const parsed = updateSessionSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();

    const session = await db.query.coachingSessions.findFirst({
      where: eq(coachingSessions.id, v.sessionId),
    });
    if (!session) return actionError("Görüşme bulunamadı.");

    const set: Partial<typeof coachingSessions.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (v.scheduledAt !== undefined) set.scheduledAt = v.scheduledAt;
    if (v.status !== undefined) {
      set.status = v.status;
      if (v.status === "held" && !session.heldAt) set.heldAt = new Date();
    }
    if (v.summary !== undefined) set.summary = clean(v.summary);
    if (v.studentVisibleNote !== undefined) {
      set.studentVisibleNote = clean(v.studentVisibleNote);
    }
    if (v.nextPlanId !== undefined) set.nextPlanId = v.nextPlanId ?? null;
    if (v.meetingUrl !== undefined) {
      const url = clean(v.meetingUrl);
      set.meetingUrl = url;
      set.meetingProvider = detectProvider(url);
    }

    await db
      .update(coachingSessions)
      .set(set)
      .where(eq(coachingSessions.id, v.sessionId));

    return { ok: true, data: { sessionId: v.sessionId } };
  });
}

/**
 * Koç: "Bu görüşmeden program oluştur" — verilen haftanın planını (yoksa
 * taslak olarak) oluşturur ve görüşmeye bağlar.
 */
export async function createPlanFromSession(
  input: unknown,
): Promise<ActionResult<{ planId: number; weekKey: string; enrollmentId: number }>> {
  return guarded(async () => {
    await requireCoach();
    const parsed = planFromSessionSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();

    const session = await db.query.coachingSessions.findFirst({
      where: eq(coachingSessions.id, v.sessionId),
    });
    if (!session) return actionError("Görüşme bulunamadı.");

    const weekStart = mondayOf(v.weekStart);
    const plan = await getOrCreateWeeklyPlan(
      db,
      session.enrollmentId,
      weekStart,
    );
    await db
      .update(coachingSessions)
      .set({ nextPlanId: plan.id, updatedAt: new Date() })
      .where(eq(coachingSessions.id, session.id));

    return {
      ok: true,
      data: {
        planId: plan.id,
        weekKey: trDayKey(plan.weekStart),
        enrollmentId: session.enrollmentId,
      },
    };
  });
}
