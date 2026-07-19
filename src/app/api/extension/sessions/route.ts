import { getExtensionPickerData } from "@/db/queries/sessions";
import { requireCoachFromBearer } from "@/lib/extension-auth";
import { preflight, withCors } from "@/lib/extension-cors";

/**
 * GET /api/extension/sessions — canlı-transkript eklentisinin öğrenci/görüşme
 * seçicisi. Bearer token ile kimlik; koç-scope'lu aktif öğrenciler + bugünden
 * itibaren planlı görüşmeler (auto-match için `meetingUrl` dahil) döner.
 * Sekme-URL eşleşmesi eklenti tarafında yapılır.
 */
export const dynamic = "force-dynamic";

export function OPTIONS(req: Request) {
  return preflight(req);
}

export async function GET(req: Request) {
  try {
    const coach = await requireCoachFromBearer(req);
    const data = await getExtensionPickerData({
      id: coach.id,
      role: coach.role,
    });
    return withCors(Response.json({ ok: true, ...data }), req);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Beklenmeyen bir hata oluştu";
    const status = msg === "Yetkisiz" ? 401 : 403;
    return withCors(Response.json({ ok: false, error: msg }, { status }), req);
  }
}
