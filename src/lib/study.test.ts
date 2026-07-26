import { describe, expect, it } from "vitest";

import {
  elapsedOf,
  formatMinutes,
  formatStopwatch,
  MAX_TIMER_SEC,
  parseTimerState,
  type TimerState,
} from "@/lib/study";

const T0 = 1_700_000_000_000; // sabit bir an (epoch ms)

describe("elapsedOf", () => {
  it("duraklatılmışken yalnız biriken süreyi verir", () => {
    const state: TimerState = { subject: "genel", accumulated: 90, startedAt: null };
    // `now` ilerlese de duraklatılmış sayaç ilerlemez.
    expect(elapsedOf(state, T0)).toBe(90);
    expect(elapsedOf(state, T0 + 60_000)).toBe(90);
  });

  it("çalışırken süreyi duvar saatinden türetir", () => {
    const state: TimerState = { subject: "genel", accumulated: 30, startedAt: T0 };
    expect(elapsedOf(state, T0 + 10_000)).toBe(40);
  });

  /** Asıl hata buydu: telefonda uygulamadan çıkınca sayaç duruyordu. */
  it("sayfa bellekten atılıp geri gelse de arada geçen süreyi sayar", () => {
    const state: TimerState = { subject: "genel", accumulated: 0, startedAt: T0 };
    // 25 dakika sonra uygulama yeniden açıldı: sayaç 25 dakikada olmalı.
    expect(elapsedOf(state, T0 + 25 * 60_000)).toBe(25 * 60);
  });

  it("kayıt yoksa sıfırdır", () => {
    expect(elapsedOf(null, T0)).toBe(0);
  });

  it("unutulmuş kronometreyi 24 saatte sabitler", () => {
    const state: TimerState = { subject: "genel", accumulated: 0, startedAt: T0 };
    expect(elapsedOf(state, T0 + 3 * 24 * 3600_000)).toBe(MAX_TIMER_SEC);
  });

  it("saat geri alınırsa negatife düşmez", () => {
    const state: TimerState = { subject: "genel", accumulated: 0, startedAt: T0 };
    expect(elapsedOf(state, T0 - 60_000)).toBe(0);
  });
});

describe("parseTimerState", () => {
  it("saklanan durumu geri okur", () => {
    const raw = JSON.stringify({ subject: "12", accumulated: 42.5, startedAt: T0 });
    expect(parseTimerState(raw, "genel")).toEqual({
      subject: "12",
      accumulated: 42.5,
      startedAt: T0,
    });
  });

  it("boş, bozuk ya da geçersiz veriye null döner", () => {
    expect(parseTimerState(null, "genel")).toBeNull();
    expect(parseTimerState("{bozuk", "genel")).toBeNull();
    expect(parseTimerState(JSON.stringify({ accumulated: -5 }), "genel")).toBeNull();
    expect(parseTimerState(JSON.stringify({ subject: "genel" }), "genel")).toBeNull();
  });

  it("ders bilgisi eksikse yedeğe düşer, startedAt yoksa duraklatılmış sayar", () => {
    expect(parseTimerState(JSON.stringify({ accumulated: 10 }), "genel")).toEqual({
      subject: "genel",
      accumulated: 10,
      startedAt: null,
    });
  });
});

describe("formatStopwatch", () => {
  it("saat:dakika:saniye olarak yazar", () => {
    expect(formatStopwatch(0)).toBe("00:00:00");
    expect(formatStopwatch(59.9)).toBe("00:00:59");
    expect(formatStopwatch(3661)).toBe("01:01:01");
  });
});

describe("formatMinutes", () => {
  it("dakikayı saat/dakika olarak okunur hâle getirir", () => {
    expect(formatMinutes(45)).toBe("45dk");
    expect(formatMinutes(60)).toBe("1s");
    expect(formatMinutes(90)).toBe("1s 30dk");
  });
});
