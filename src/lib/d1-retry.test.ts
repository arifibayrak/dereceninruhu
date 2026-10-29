import { describe, expect, it, vi } from "vitest";

import { isReadSql, isTransientD1Error, withD1Retry } from "@/lib/d1-retry";

/**
 * 2026-10-29 Cloudflare D1 olayında sorgular "Network connection lost." ile
 * düşüyor, oturum okunamayınca sayfa komple hata veriyordu. Okumalar geçici
 * hatada yeniden denenmeli; yazımlar ASLA (çift kayıt riski).
 */

type Call = { sql: string; method: string };

/** İlk `failures` çağrıda `error` fırlatan sahte D1. */
function fakeD1(error: Error, failures: number) {
  const calls: Call[] = [];
  let remaining = failures;
  const batched: unknown[][] = [];
  const stmt = (sql: string) => {
    const s = {
      sql,
      bind: () => stmt(sql),
      first: async () => attempt(sql, "first"),
      all: async () => attempt(sql, "all"),
      raw: async () => attempt(sql, "raw"),
      run: async () => attempt(sql, "run"),
    };
    return s;
  };
  const attempt = (sql: string, method: string) => {
    calls.push({ sql, method });
    if (remaining > 0) {
      remaining--;
      throw error;
    }
    return { results: [], sql };
  };
  const db = {
    prepare: (sql: string) => stmt(sql),
    batch: async (stmts: unknown[]) => {
      batched.push(stmts);
      return [];
    },
  };
  return { db: db as unknown as D1Database, calls, batched };
}

const noSleep = vi.fn(async () => {});
const lost = new Error("Network connection lost.");

describe("withD1Retry", () => {
  it("okuma sorgusunu geçici hatada yeniden dener ve başarır", async () => {
    const { db, calls } = fakeD1(lost, 2);
    const wrapped = withD1Retry(db, noSleep);
    await expect(
      wrapped.prepare("select * from sessions where token = ?").bind("t").raw(),
    ).resolves.toBeDefined();
    expect(calls).toHaveLength(3);
  });

  it("Drizzle'ın sardığı hatada da (cause zinciri) yeniden dener", async () => {
    const drizzleErr = new Error("Failed query: select 1", { cause: lost });
    const { db, calls } = fakeD1(drizzleErr, 1);
    await withD1Retry(db, noSleep).prepare("select 1").all();
    expect(calls).toHaveLength(2);
  });

  it("yazımı ASLA yeniden denemez", async () => {
    const { db, calls } = fakeD1(lost, 1);
    const wrapped = withD1Retry(db, noSleep);
    await expect(
      wrapped.prepare("insert into plan_tasks (id) values (?)").bind(1).run(),
    ).rejects.toThrow("Network connection lost");
    expect(calls).toHaveLength(1);
  });

  it("geçici olmayan hatayı (SQL hatası) yeniden denemez", async () => {
    const { db, calls } = fakeD1(new Error("no such column: segment"), 1);
    await expect(withD1Retry(db, noSleep).prepare("select segment from x").all()).rejects.toThrow(
      "no such column",
    );
    expect(calls).toHaveLength(1);
  });

  it("deneme hakkı bitince son hatayı iletir", async () => {
    const { db, calls } = fakeD1(lost, 10);
    await expect(withD1Retry(db, noSleep).prepare("select 1").first()).rejects.toThrow(lost);
    expect(calls).toHaveLength(3);
  });

  it("batch'e yerel ifadeleri verir (sarmalayıcıyı değil)", async () => {
    const { db, batched } = fakeD1(lost, 0);
    const wrapped = withD1Retry(db, noSleep);
    const a = wrapped.prepare("insert into t values (?)").bind(1);
    await wrapped.batch([a]);
    expect(batched[0][0]).not.toBe(a);
    expect((batched[0][0] as { sql: string }).sql).toBe("insert into t values (?)");
  });
});

describe("isReadSql / isTransientD1Error", () => {
  it("okuma ile yazımı ayırır (updated_at gibi sütunlar yanıltmaz)", () => {
    expect(isReadSql('select "updated_at", "deleted_at" from "students"')).toBe(true);
    expect(isReadSql("with x as (select 1) select * from x")).toBe(true);
    expect(isReadSql('update "students" set "segment" = ?')).toBe(false);
    expect(isReadSql('insert into "question_logs" values (?)')).toBe(false);
    expect(isReadSql("with x as (select 1) delete from t")).toBe(false);
  });

  it("Cloudflare'in geçici D1 mesajlarını tanır", () => {
    expect(isTransientD1Error(lost)).toBe(true);
    expect(isTransientD1Error(new Error("D1_ERROR: internal error; reference = abc"))).toBe(true);
    expect(isTransientD1Error(new Error("D1 DB is overloaded. Too many requests queued."))).toBe(true);
    expect(isTransientD1Error(new Error("UNIQUE constraint failed"))).toBe(false);
  });
});
