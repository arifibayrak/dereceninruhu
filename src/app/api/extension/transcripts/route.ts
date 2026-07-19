import { getDb } from "@/db";
import { assertEnrollmentAccess } from "@/actions/_access";
import { fieldErrorsOf } from "@/actions/_guard";
import {
  insertTranscriptCore,
  runExtractionCore,
} from "@/actions/_transcripts-core";
import { requireCoachFromBearer } from "@/lib/extension-auth";
import { preflight, withCors } from "@/lib/extension-cors";
import { liveTranscriptSchema } from "@/lib/validation-ext";

/**
 * POST /api/extension/transcripts — canlı transkript METNİNİ (ses değil) alır,
 * bir `transcripts` satırı yazar (source="live") ve AI çıkarımını çalıştırır.
 * Aynı çekirdekleri cookie'li `createPastedTranscript`/`runTranscriptExtraction`
 * de kullanır; tek fark ön kapının bearer olması.
 *
 * Sıra: bearer → Zod → assertEnrollmentAccess (tek yetki kapısı) → insert
 * (önce commit) → extraction (inline; AI hatası olsa bile transkript korunur).
 */
export const dynamic = "force-dynamic";

export function OPTIONS(req: Request) {
  return preflight(req);
}

export async function POST(req: Request) {
  try {
    const coach = await requireCoachFromBearer(req);

    const body = await req.json().catch(() => null);
    const parsed = liveTranscriptSchema.safeParse(body);
    if (!parsed.success) {
      return withCors(
        Response.json(
          {
            ok: false,
            error: "Geçersiz giriş.",
            fieldErrors: fieldErrorsOf(parsed.error.issues),
          },
          { status: 422 },
        ),
        req,
      );
    }

    const { enrollmentId, coachingSessionId, rawText, language } = parsed.data;
    const db = getDb();
    await assertEnrollmentAccess(db, enrollmentId, coach);

    const { transcriptId } = await insertTranscriptCore(
      db,
      { enrollmentId, coachingSessionId, rawText, source: "live", language },
      coach,
    );

    // Transkript yazıldıktan SONRA çıkar; yavaş/başarısız AI transkripti kaybettirmesin.
    try {
      const { proposalCount } = await runExtractionCore(db, transcriptId);
      return withCors(
        Response.json({ ok: true, transcriptId, proposalCount }),
        req,
      );
    } catch {
      return withCors(
        Response.json({
          ok: true,
          transcriptId,
          proposalCount: 0,
          extractionFailed: true,
        }),
        req,
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Beklenmeyen bir hata oluştu";
    const status =
      msg === "Yetkisiz"
        ? 401
        : msg.includes("ait değil") || msg.includes("koç yetkisi")
          ? 403
          : 500;
    return withCors(Response.json({ ok: false, error: msg }, { status }), req);
  }
}
