import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  installRequestStallGuard,
  isStallError,
  type GuardEnv,
  type StallLimits,
} from "@/lib/request-stall-guard";

/**
 * "Kaydediliyor…'da kalıyor, gir çık yapmak gerekiyor" hatasının kilidi.
 *
 * Telefonda askıya alınan istek ne yanıt ne hata döndürür; Next'in action
 * kuyruğu sıralı olduğu için o tek istek sonraki bütün kayıtları da kilitler.
 * Buradaki sahte fetch tam olarak o istektir: hiç çözülmeyen bir promise.
 */
const LIMITS: StallLimits = {
  actionHeadersMs: 1_000,
  rscHeadersMs: 500,
  bodyIdleMs: 300,
  hiddenMinMs: 100,
  resumeGraceMs: 50,
};

const ACTION = { method: "POST", headers: { "Next-Action": "abc123" } };

/** Sinyal iptal edilene kadar hiç çözülmeyen fetch — askıdaki mobil istek. */
function hangingFetch(): typeof fetch {
  return ((_input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal!.reason));
    })) as typeof fetch;
}

function fakeDocument() {
  const listeners = new Set<() => void>();
  const doc = {
    visibilityState: "visible" as DocumentVisibilityState,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    setVisibility(state: DocumentVisibilityState) {
      doc.visibilityState = state;
      for (const fn of listeners) fn();
    },
  };
  return doc;
}

function envFor(doc: ReturnType<typeof fakeDocument>): GuardEnv {
  return {
    document: doc as unknown as GuardEnv["document"],
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
    now: () => Date.now(),
  };
}

describe("installRequestStallGuard", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("yanıtsız kalan action isteğini süre dolunca iptal eder (kuyruk açılır)", async () => {
    const target = { fetch: hangingFetch() };
    installRequestStallGuard(target, envFor(fakeDocument()), LIMITS);

    const req = target.fetch("/ogrenci/program", ACTION);
    const settled = expect(req).rejects.toSatisfy(isStallError);
    await vi.advanceTimersByTimeAsync(LIMITS.actionHeadersMs);
    await settled;
  });

  it("uygulama arka plandan dönünce askıdaki isteği hemen (ek süre sonunda) iptal eder", async () => {
    const doc = fakeDocument();
    const target = { fetch: hangingFetch() };
    installRequestStallGuard(target, envFor(doc), LIMITS);

    const req = target.fetch("/ogrenci/program", ACTION);
    const settled = expect(req).rejects.toSatisfy(isStallError);
    doc.setVisibility("hidden");
    await vi.advanceTimersByTimeAsync(LIMITS.hiddenMinMs);
    doc.setVisibility("visible");
    // Uzun başlık süresini BEKLEMEDEN, yalnız ek süre sonunda.
    await vi.advanceTimersByTimeAsync(LIMITS.resumeGraceMs);
    await settled;
  });

  it("kısa bir gizlenme (bildirim çekmecesi) isteği öldürmez", async () => {
    const doc = fakeDocument();
    let resolve!: (r: Response) => void;
    const target = {
      fetch: (() => new Promise<Response>((r) => (resolve = r))) as typeof fetch,
    };
    installRequestStallGuard(target, envFor(doc), LIMITS);

    const req = target.fetch("/ogrenci/program", ACTION);
    doc.setVisibility("hidden");
    doc.setVisibility("visible");
    await vi.advanceTimersByTimeAsync(LIMITS.resumeGraceMs * 2);
    resolve(new Response("ok"));
    await expect(req).resolves.toBeInstanceOf(Response);
  });

  it("akış ortasında duran gövdeyi iptal eder", async () => {
    const target = {
      fetch: ((_: RequestInfo | URL, init?: RequestInit) => {
        const body = new ReadableStream<Uint8Array>({
          start(c) {
            c.enqueue(new TextEncoder().encode("ilk parça"));
            init?.signal?.addEventListener("abort", () => c.error(init.signal!.reason));
          },
        });
        return Promise.resolve(new Response(body));
      }) as typeof fetch,
    };
    installRequestStallGuard(target, envFor(fakeDocument()), LIMITS);

    const res = await target.fetch("/ogrenci/program", ACTION);
    const read = expect(res.text()).rejects.toSatisfy(isStallError);
    await vi.advanceTimersByTimeAsync(LIMITS.bodyIdleMs + 10);
    await read;
  });

  it("tamamlanan yanıtın url/redirected bilgisini korur (Next yönlendirme tespiti)", async () => {
    const original = new Response("veri");
    Object.defineProperties(original, {
      url: { value: "https://dereceninruhu.com/ogrenci" },
      redirected: { value: true },
    });
    const target = { fetch: (() => Promise.resolve(original)) as typeof fetch };
    installRequestStallGuard(target, envFor(fakeDocument()), LIMITS);

    const res = await target.fetch("/ogrenci", { headers: { RSC: "1" } });
    expect(res.url).toBe("https://dereceninruhu.com/ogrenci");
    expect(res.redirected).toBe(true);
    await expect(res.text()).resolves.toBe("veri");
  });

  it("Next dışındaki fetch'lere dokunmaz", async () => {
    const target = { fetch: hangingFetch() };
    installRequestStallGuard(target, envFor(fakeDocument()), LIMITS);

    let settled = false;
    void target.fetch("/api/whatever").then(
      () => (settled = true),
      () => (settled = true),
    );
    await vi.advanceTimersByTimeAsync(LIMITS.actionHeadersMs * 5);
    expect(settled).toBe(false);
  });
});
