/**
 * Asılı kalan Server Action / RSC isteklerini iptal eden emniyet kemeri.
 *
 * NEDEN: Next'in istemci yönlendiricisi Server Action'ları ve `router.refresh()`
 * çağrılarını SIRAYLA çalıştırır (`app-router-instance.js` → tek `pending`
 * kuyruğu) ve hiçbir isteğe zaman aşımı koymaz. Telefonda uygulama arka plana
 * atılınca / ağ değişince / ekran kilitlenince giden istek ne yanıt ne hata
 * döndürür: promise SONSUZA kadar bekler. O tek ölü istek kuyruğun başında
 * durduğu için sonraki BÜTÜN kayıtlar da sıraya girip hiç gönderilmez — buton
 * "Kaydediliyor…"da kalır, öğrenci uygulamayı kapatıp açana ("gir çık") kadar
 * hiçbir şey kaydedilmez. Tarayıcıda bir isteği bilerek askıda bırakarak birebir
 * üretildi (2026-10-29).
 *
 * ÇÖZÜM: bu iki tür isteği izle; askıda kalanı iptal et. İptal edilen fetch
 * reddeder → Next kuyruğu açılır → `callAction` hatayı forma "tekrar dene"
 * olarak taşır. Otomatik yeniden deneme YOK (bkz. `callAction`).
 *
 * Sınırlar bilerek cömert: AI taslağı / transkript gibi meşru uzun action'lar
 * dakikalar sürebilir. Asıl yakalayıcı "geri dönüş" kuralıdır: sayfa gizliyken
 * yanıtı gelmemiş istek, sayfa görünür olduktan kısa süre sonra hâlâ yanıtsızsa
 * ölüdür.
 */

export type StallLimits = {
  /** Action isteği: yanıt başlıkları en geç bu sürede gelmeli. */
  actionHeadersMs: number;
  /** RSC (refresh / gezinme) isteği: yanıt başlıkları en geç bu sürede. */
  rscHeadersMs: number;
  /** Yanıt gövdesi akarken bu kadar süre hiç veri gelmezse ölü sayılır. */
  bodyIdleMs: number;
  /** Sayfa bu süreden uzun gizli kaldıysa "geri dönüş" kuralı devreye girer. */
  hiddenMinMs: number;
  /** Geri dönüşten sonra yanıtı hâlâ gelmeyen isteğe tanınan ek süre. */
  resumeGraceMs: number;
};

export const STALL_LIMITS: StallLimits = {
  actionHeadersMs: 120_000,
  rscHeadersMs: 45_000,
  bodyIdleMs: 30_000,
  hiddenMinMs: 3_000,
  resumeGraceMs: 8_000,
};

/** İptal sebebi — `callAction` bunu tanıyıp Türkçe mesaja çevirir. */
export const STALL_ERROR_NAME = "TimeoutError";

type Kind = "action" | "rsc";

type Tracked = {
  kind: Kind;
  controller: AbortController;
  /** Sayfa gizliyken hâlâ uçuştaydı (telefon isteği askıya almış olabilir). */
  sawHidden: boolean;
  gotHeaders: boolean;
};

/** Saat ve görünürlük kaynağı — testlerde sahtesi verilir. */
export type GuardEnv = {
  document: Pick<Document, "visibilityState" | "addEventListener" | "removeEventListener">;
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (id: unknown) => void;
  now: () => number;
};

function kindOf(input: RequestInfo | URL, init?: RequestInit): Kind | null {
  const headers = new Headers(
    init?.headers ?? (input instanceof Request ? input.headers : undefined),
  );
  if (headers.has("next-action")) return "action";
  if (headers.has("rsc")) return "rsc";
  return null;
}

function stallError(why: string): DOMException {
  return new DOMException(`İstek yanıt vermedi (${why})`, STALL_ERROR_NAME);
}

/**
 * `target.fetch`'i (tarayıcıda `window`) sarar; geri alma fonksiyonu döndürür. Yalnız Next'in kendi
 * istekleri (`Next-Action` ya da `RSC` başlığı) izlenir — diğer fetch'ler
 * olduğu gibi geçer.
 */
export function installRequestStallGuard(
  target: { fetch: typeof fetch },
  env: GuardEnv,
  limits: StallLimits = STALL_LIMITS,
): () => void {
  const host = env;
  const original = target.fetch.bind(target);
  const installed = target.fetch;
  const inflight = new Set<Tracked>();
  let hiddenAt: number | null = null;

  const guarded = ((input: RequestInfo | URL, init?: RequestInit) => {
    const kind = kindOf(input, init);
    if (!kind) return original(input, init);

    const controller = new AbortController();
    const outer = init?.signal ?? (input instanceof Request ? input.signal : null);
    if (outer) {
      if (outer.aborted) controller.abort(outer.reason);
      else
        outer.addEventListener("abort", () => controller.abort(outer.reason), {
          once: true,
        });
    }

    const t: Tracked = {
      kind,
      controller,
      sawHidden: host.document.visibilityState === "hidden",
      gotHeaders: false,
    };
    inflight.add(t);

    let timer = host.setTimeout(
      () => controller.abort(stallError("yanıt yok")),
      kind === "action" ? limits.actionHeadersMs : limits.rscHeadersMs,
    );
    const finish = () => {
      host.clearTimeout(timer);
      inflight.delete(t);
    };

    return original(input, { ...init, signal: controller.signal }).then(
      (res) => {
        t.gotHeaders = true;
        host.clearTimeout(timer);
        if (!res.body) {
          finish();
          return res;
        }
        // Gövde boşta kalırsa da ölü say: veri geldikçe saat sıfırlanır.
        const arm = () => {
          host.clearTimeout(timer);
          timer = host.setTimeout(
            () => controller.abort(stallError("akış durdu")),
            limits.bodyIdleMs,
          );
        };
        arm();
        const reader = res.body.getReader();
        const body = new ReadableStream<Uint8Array>({
          async pull(c) {
            try {
              const { done, value } = await reader.read();
              if (done) {
                finish();
                c.close();
                return;
              }
              arm();
              c.enqueue(value);
            } catch (err) {
              finish();
              c.error(err);
            }
          },
          cancel(reason) {
            finish();
            return reader.cancel(reason);
          },
        });
        const wrapped = new Response(body, {
          status: res.status,
          statusText: res.statusText,
          headers: res.headers,
        });
        // Next yönlendirme tespiti için `url`/`redirected` okur; yeni Response
        // bunları kaybeder.
        Object.defineProperties(wrapped, {
          url: { value: res.url },
          redirected: { value: res.redirected },
        });
        return wrapped;
      },
      (err: unknown) => {
        finish();
        throw err;
      },
    );
  }) as typeof fetch;

  const onVisibility = () => {
    if (host.document.visibilityState === "hidden") {
      hiddenAt = host.now();
      for (const t of inflight) t.sawHidden = true;
      return;
    }
    const wasHidden = hiddenAt !== null && host.now() - hiddenAt >= limits.hiddenMinMs;
    hiddenAt = null;
    if (!wasHidden) return;
    for (const t of inflight) {
      if (!t.sawHidden || t.gotHeaders) continue;
      host.setTimeout(() => {
        if (inflight.has(t) && !t.gotHeaders) {
          t.controller.abort(stallError("uygulama arka plandan döndü"));
        }
      }, limits.resumeGraceMs);
    }
  };

  target.fetch = guarded;
  host.document.addEventListener("visibilitychange", onVisibility);
  return () => {
    host.document.removeEventListener("visibilitychange", onVisibility);
    if (target.fetch === guarded) target.fetch = installed;
  };
}

/** `callAction` için: bu hata bizim iptalimiz mi? */
export function isStallError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: unknown }).name === STALL_ERROR_NAME
  );
}
