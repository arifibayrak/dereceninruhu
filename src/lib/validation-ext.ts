import { z } from "zod";

/**
 * Tarayıcı eklentisi API sözleşmesi — TEK KAYNAK. Route handler'lar bu şemayı
 * doğrular; eklenti bu tipleri (yalnız tip olarak) kopyalar. `transcripts.ts`
 * içindeki `pasteSchema` ile aynı şekildedir, artı canlı-özel alanlar.
 */
export const liveTranscriptSchema = z.object({
  enrollmentId: z.coerce.number().int().positive(),
  coachingSessionId: z.coerce.number().int().positive().nullish(),
  rawText: z.string().trim().min(20, "Transkript çok kısa.").max(200_000),
  /** Varsayılan "tr"; eklenti şimdilik hep Türkçe gönderir. */
  language: z.string().trim().min(2).max(8).optional(),
  /** Bilgi amaçlı; kaynak her zaman "live" olarak yazılır. */
  source: z.literal("live").optional(),
  /** Görüşmenin bittiği an (istemci saati) — ileri uyumluluk; şu an saklanmaz. */
  clientEndedAt: z.coerce.date().optional(),
});

export type LiveTranscriptInput = z.infer<typeof liveTranscriptSchema>;

/* ------------------------- GET /api/extension/sessions -------------------- */

export type ExtensionStudent = {
  studentId: number;
  enrollmentId: number;
  fullName: string;
  examCode: string;
};

export type ExtensionSession = {
  id: number;
  enrollmentId: number;
  studentId: number;
  studentName: string;
  /** ISO 8601 (UTC). */
  scheduledAt: string;
  meetingUrl: string | null;
  meetingProvider: string | null;
};

export type ExtensionPickerData = {
  students: ExtensionStudent[];
  sessions: ExtensionSession[];
};
