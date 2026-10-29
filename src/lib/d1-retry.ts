/**
 * D1'in GEÇİCİ hatalarında OKUMA sorgularını yeniden dener.
 *
 * NEDEN: 2026-10-29 14:16–16:33 UTC Cloudflare'de "Increased Durable Objects,
 * D1 and Workflows Error Rates" olayı vardı. O pencerede bizde 232 hata
 * kaydedildi: sorgular "Network connection lost." ile düşüyor, Better Auth
 * oturum okuyamayınca ("Failed to get session") SAYFANIN TAMAMI hata
 * veriyordu. Ahmet Hoca'nın "kaydediliyor diyor öyle kalıyor" mesajı tam o
 * pencerede geldi. Cloudflare'in D1 önerisi geçici hatalarda yeniden denemek.
 *
 * Yalnız OKUMALAR yeniden denenir: bağlantı kopan bir yazım sunucuda işlenmiş
 * olabilir; sessizce tekrarlamak çift kayıt demek (aynı gerekçe `callAction`).
 * Yazım hatası kullanıcıya iletilir, tekrar denemek onun kararıdır.
 *
 * Bağlamaya (binding) sarılır — `getDb`, `getDbAsync` ve Better Auth'un kendi
 * drizzle örneği aynı korumayı alır.
 */

/** Cloudflare'in "yeniden denenebilir" saydığı D1 hata metinleri. */
const TRANSIENT =
  /Network connection lost|internal error|transient issue|overloaded|Too many requests queued|storage caused object to be reset|reset because its code was updated|Cannot resolve D1 DB|D1 DB storage operation exceeded timeout/i;

const DELAYS_MS = [120, 400];

export function isTransientD1Error(err: unknown): boolean {
  // Drizzle sorgu hatasını sarar ("Failed query: …"); asıl D1 mesajı `cause`ta.
  for (let e: unknown = err, depth = 0; e && depth < 4; depth++) {
    const message = e instanceof Error ? e.message : String(e);
    if (TRANSIENT.test(message)) return true;
    e = e instanceof Error ? e.cause : undefined;
  }
  return false;
}

/** SELECT / salt okuyan CTE mi? Yazan ifade asla yeniden denenmez. */
export function isReadSql(sql: string): boolean {
  return (
    /^\s*(select|with)\b/i.test(sql) &&
    !/\b(insert|update|delete|replace|create|drop|alter)\b/i.test(sql)
  );
}

type Sleep = (ms: number) => Promise<void>;
const realSleep: Sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(run: () => Promise<T>, sleep: Sleep): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await run();
    } catch (err) {
      if (attempt >= DELAYS_MS.length || !isTransientD1Error(err)) throw err;
      await sleep(DELAYS_MS[attempt]);
    }
  }
}

const READ_METHODS = new Set<PropertyKey>(["first", "all", "raw", "run"]);

/** `batch` yerel ifade nesnesi ister — sarmalayıcıdan asıl ifadeye dönüş. */
const original = new WeakMap<object, D1PreparedStatement>();

function wrapStatement(
  stmt: D1PreparedStatement,
  read: boolean,
  sleep: Sleep,
): D1PreparedStatement {
  const wrapped = new Proxy(stmt, {
    get(target, prop) {
      if (prop === "bind") {
        return (...values: unknown[]) =>
          wrapStatement(target.bind(...values), read, sleep);
      }
      const value = Reflect.get(target, prop, target);
      if (typeof value !== "function") return value;
      if (read && READ_METHODS.has(prop)) {
        return (...args: unknown[]) =>
          withRetry(() => value.apply(target, args), sleep);
      }
      return value.bind(target);
    },
  });
  original.set(wrapped, stmt);
  return wrapped;
}

/** D1 bağlamasını, okuma sorgularını geçici hatalarda yeniden deneyen eşiyle sarar. */
export function withD1Retry(db: D1Database, sleep: Sleep = realSleep): D1Database {
  return new Proxy(db, {
    get(target, prop) {
      if (prop === "prepare") {
        return (sql: string) => wrapStatement(target.prepare(sql), isReadSql(sql), sleep);
      }
      if (prop === "batch") {
        // Toplu yazım tek işlem; yeniden DENENMEZ (yazım içerebilir).
        return (statements: D1PreparedStatement[]) =>
          target.batch(statements.map((s) => original.get(s) ?? s));
      }
      const value = Reflect.get(target, prop, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
