"use client";

import { unstable_isUnrecognizedActionError } from "next/navigation";

import type { ActionResult } from "@/actions/_guard";

/**
 * Server Action'ın TAŞIMA katmanı hataları sunucudaki `guarded`'a HİÇ ulaşmaz —
 * çağrının promise'i doğrudan REDDEDİLİR:
 *
 * - Telefonun bağlantısı koptu / sekme uyandı → `fetch` patlar.
 * - Worker 500 döndü ya da yanıt RSC değil → Next "unexpected response" fırlatır.
 * - **Yeni sürüm yayınlandı** → sekmedeki eski JS'in action id'si sunucuda artık
 *   yok; Next `UnrecognizedActionError` fırlatır ("Failed to find Server Action").
 *
 * Çağrı yeri `await createMock(...)`'ı korumaya almadığında o satırdan sonrası
 * — `setSaving(false)`, `toast.error(res.error)` — hiç çalışmaz: buton
 * "Kaydediliyor…"da asılı kalır, kullanıcı hiçbir hata görmez ve kaydı gitmiş
 * olur. Kullanıcıların "donuyor, kaydetmiyor" dediği şey tam olarak budur.
 *
 * Bu yüzden istemciden yapılan HER action çağrısı buradan geçer: ne olursa olsun
 * sonuç bir `ActionResult`'tır, form tek bir yol bilir.
 *
 * ```ts
 * // await createMock(payload) YERİNE:
 * const res = await callAction(createMock, payload);
 * if (!res.ok) { toast.error(res.error); return; }
 * ```
 *
 * Otomatik yeniden deneme YOK: patlayan istek sunucuya ulaşmış olabilir, sessiz
 * tekrar çift kayıt yazardı. Kullanıcı hatayı görüp kendi tekrar dener.
 */
export async function callAction<A extends unknown[], T>(
  action: (...args: A) => Promise<ActionResult<T>>,
  ...args: A
): Promise<ActionResult<T>> {
  try {
    const res = await action(...args);
    /*
     * Sunucu beklenmedik bir şey döndürdüyse forma `res.ok` okutma — `undefined`
     * üzerinden okumak da aynı donmaya döner.
     */
    if (!res || typeof res !== "object" || typeof res.ok !== "boolean") {
      return { ok: false, error: GENERIC_ERROR };
    }
    return res;
  } catch (err) {
    // Tarayıcı konsoluna ham hata: kullanıcıya Türkçe mesaj, bize teşhis.
    console.error("[action]", err);
    return { ok: false, error: actionErrorMessage(err) };
  }
}

/** Yayın sonrası eski sekme — tek çare sayfayı yenilemek. */
export const STALE_VERSION_ERROR =
  "Uygulama yeni sürüme geçti. Sayfayı yenileyip tekrar kaydet.";

const OFFLINE_ERROR =
  "İnternet bağlantısı yok — kayıt gönderilemedi. Bağlanınca tekrar dene.";

const NETWORK_ERROR =
  "Sunucuya ulaşılamadı — kaydedilemedi. Birkaç saniye sonra tekrar dene.";

const GENERIC_ERROR =
  "Kaydedilemedi — beklenmeyen bir hata oluştu. Lütfen tekrar dene.";

/** Taşıma hatasını kullanıcıya gösterilecek Türkçe mesaja çevirir. */
export function actionErrorMessage(err: unknown): string {
  if (isStaleVersionError(err)) return STALE_VERSION_ERROR;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return OFFLINE_ERROR;
  }
  // `fetch` ağ seviyesinde patladığında TypeError gelir (mesajı tarayıcıya göre
  // değişir: "Failed to fetch" / "Load failed" / "NetworkError…").
  if (err instanceof TypeError) return NETWORK_ERROR;
  return GENERIC_ERROR;
}

/**
 * Sekme, sunucudaki sürümden ESKİ bir derlemede kaldı mı? Next bunu
 * `UnrecognizedActionError` ile bildirir; eski/farklı sürümlerde tip kaybolabildiği
 * için mesaja da bakılır.
 */
export function isStaleVersionError(err: unknown): boolean {
  if (unstable_isUnrecognizedActionError(err)) return true;
  const message = err instanceof Error ? err.message : "";
  return (
    message.includes("Failed to find Server Action") ||
    message.includes("was not found on the server")
  );
}
