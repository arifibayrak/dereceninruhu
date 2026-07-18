import { describe, expect, it } from "vitest";
import {
  kurusToTryInput,
  parseTryToKurus,
  resolveInvoiceStatus,
  trtMonthRange,
} from "./muhasebe";

describe("parseTryToKurus", () => {
  it("parses plain integers as lira", () => {
    expect(parseTryToKurus("2500")).toBe(250000);
    expect(parseTryToKurus(" 0 ")).toBe(0);
  });

  it("parses Turkish thousands + decimal comma", () => {
    expect(parseTryToKurus("2.500")).toBe(250000);
    expect(parseTryToKurus("2.500,50")).toBe(250050);
    expect(parseTryToKurus("1.250.000")).toBe(125000000);
    expect(parseTryToKurus("2500,5")).toBe(250050);
  });

  it("parses decimal dot", () => {
    expect(parseTryToKurus("2500.50")).toBe(250050);
    expect(parseTryToKurus("2500.5")).toBe(250050);
  });

  it("strips currency symbols and spaces", () => {
    expect(parseTryToKurus("₺2.500,00")).toBe(250000);
  });

  it("rejects garbage", () => {
    expect(parseTryToKurus("")).toBeNull();
    expect(parseTryToKurus("abc")).toBeNull();
    expect(parseTryToKurus("-5")).toBeNull();
    expect(parseTryToKurus("2,500,00")).toBeNull();
  });
});

describe("kurusToTryInput", () => {
  it("round-trips whole lira without decimals", () => {
    expect(kurusToTryInput(250000)).toBe("2500");
  });
  it("keeps kuruş with a comma", () => {
    expect(kurusToTryInput(250050)).toBe("2500,50");
    expect(kurusToTryInput(101)).toBe("1,01");
  });
});

describe("resolveInvoiceStatus", () => {
  const base = {
    amountKurus: 250000,
    dueOn: new Date("2026-07-10T00:00:00+03:00"),
  };
  const now = new Date("2026-07-18T12:00:00+03:00");

  it("marks fully paid invoices ödendi", () => {
    expect(
      resolveInvoiceStatus({
        ...base,
        current: "gecikmiş",
        paidKurus: 250000,
        now,
      }),
    ).toBe("ödendi");
  });

  it("marks past-due open invoices gecikmiş", () => {
    expect(
      resolveInvoiceStatus({ ...base, current: "gönderildi", paidKurus: 1000, now }),
    ).toBe("gecikmiş");
  });

  it("keeps future-due invoices gönderildi (taslak promotes)", () => {
    const dueOn = new Date("2026-08-01T00:00:00+03:00");
    expect(
      resolveInvoiceStatus({
        amountKurus: 250000,
        dueOn,
        current: "taslak",
        paidKurus: 1000,
        now,
      }),
    ).toBe("gönderildi");
  });

  it("never resurrects iptal", () => {
    expect(
      resolveInvoiceStatus({ ...base, current: "iptal", paidKurus: 250000, now }),
    ).toBe("iptal");
  });
});

describe("trtMonthRange", () => {
  it("brackets the TRT month", () => {
    const { start, end } = trtMonthRange(new Date("2026-07-18T12:00:00+03:00"));
    expect(start.toISOString()).toBe("2026-06-30T21:00:00.000Z"); // 1 Tem 00:00 TRT
    expect(end.toISOString()).toBe("2026-07-31T21:00:00.000Z"); // 1 Ağu 00:00 TRT
  });
});
