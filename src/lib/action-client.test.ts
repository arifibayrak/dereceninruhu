import { afterEach, describe, expect, it, vi } from "vitest";

import {
  actionErrorMessage,
  callAction,
  isStaleVersionError,
  STALE_VERSION_ERROR,
} from "@/lib/action-client";

/**
 * Bu sarmalayıcının TEK işi var: Server Action çağrısı ne şekilde patlarsa
 * patlasın çağıran tarafa bir `ActionResult` dönmek. Fırlatırsa formdaki
 * `setSaving(false)` çalışmaz ve buton "Kaydediliyor…"da asılı kalır —
 * kullanıcıların "donuyor, kaydetmiyor" dediği hata budur.
 */
describe("callAction", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("başarılı sonucu olduğu gibi geçirir", async () => {
    const action = vi.fn(async (n: number) => ({ ok: true as const, data: n * 2 }));
    await expect(callAction(action, 21)).resolves.toEqual({ ok: true, data: 42 });
    expect(action).toHaveBeenCalledWith(21);
  });

  it("sunucunun ürettiği hatayı olduğu gibi geçirir", async () => {
    const action = async () => ({ ok: false as const, error: "Deneme bulunamadı." });
    await expect(callAction(action)).resolves.toEqual({
      ok: false,
      error: "Deneme bulunamadı.",
    });
  });

  it("bütün argümanları aksiyona iletir", async () => {
    const action = vi.fn(async (id: number, done: boolean) => ({
      ok: true as const,
      data: { id, done },
    }));
    await callAction(action, 7, true);
    expect(action).toHaveBeenCalledWith(7, true);
  });

  it("ağ hatasında FIRLATMAZ, ActionResult döner", async () => {
    const action = async () => {
      throw new TypeError("Failed to fetch");
    };
    const res = await callAction(action);
    expect(res.ok).toBe(false);
    expect(res.ok === false && res.error).toContain("Sunucuya ulaşılamadı");
  });

  it("yeni sürüm yayınlandıysa kullanıcıya sayfayı yenilemesini söyler", async () => {
    const action = async () => {
      throw new Error(
        'Server Action "abc" was not found on the server. \nRead more: …',
      );
    };
    const res = await callAction(action);
    expect(res).toEqual({ ok: false, error: STALE_VERSION_ERROR });
  });

  it("beklenmedik bir yanıt geldiğinde de ok:false döner", async () => {
    // Ör. worker RSC yerine HTML hata sayfası döndü.
    const action = async () => undefined as never;
    const res = await callAction(action);
    expect(res.ok).toBe(false);
  });
});

describe("actionErrorMessage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("çevrimdışıyken bağlantı mesajı verir", () => {
    vi.stubGlobal("navigator", { onLine: false });
    expect(actionErrorMessage(new TypeError("Failed to fetch"))).toContain(
      "İnternet bağlantısı yok",
    );
  });

  it("sürüm uyuşmazlığı çevrimdışı kontrolünden önce gelir", () => {
    vi.stubGlobal("navigator", { onLine: false });
    expect(actionErrorMessage(new Error("Failed to find Server Action"))).toBe(
      STALE_VERSION_ERROR,
    );
  });
});

describe("isStaleVersionError", () => {
  it("Next'in iki hata metnini de tanır", () => {
    expect(isStaleVersionError(new Error("Failed to find Server Action"))).toBe(
      true,
    );
    expect(
      isStaleVersionError(new Error('Server Action "x" was not found on the server.')),
    ).toBe(true);
  });

  it("alakasız hataları sürüm hatası saymaz", () => {
    expect(isStaleVersionError(new Error("Kayıt bulunamadı."))).toBe(false);
    expect(isStaleVersionError(null)).toBe(false);
  });
});
