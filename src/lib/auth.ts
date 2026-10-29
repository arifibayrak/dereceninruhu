import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { withD1Retry } from "@/lib/d1-retry";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "@/db/schema";

// Phone helpers live in a pure module so client code (davet form) can import
// phoneToEmail without pulling server-only deps. Re-exported for convenience.
export { normalizePhone, phoneToEmail } from "@/lib/phone";

/**
 * Auth model = phone + PIN, with NO SMS (WhatsApp davet flow).
 *
 * Better Auth's username/phoneNumber/admin plugins each require extra columns
 * we didn't migrate, so we use core email+password with a PHONE-DERIVED internal
 * email. Students sign in with phone + PIN; they never see the email. The real
 * phone lives in `users.phone_number` (for wa.me / display) and `role` gates access.
 */

/**
 * Build a request-scoped auth instance bound to the current D1 binding.
 * Cloudflare bindings are per-request, so construct inside the request scope.
 */
export function getAuth() {
  const { env } = getCloudflareContext();
  const db = drizzle(withD1Retry(env.DB), { schema });

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    // Prod trusts only the real domain; dev trusts common localhost ports so the
    // app works regardless of which port `next dev` lands on.
    trustedOrigins:
      process.env.NODE_ENV === "production"
        ? [env.BETTER_AUTH_URL]
        : [
            env.BETTER_AUTH_URL,
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3007",
          ],
    database: drizzleAdapter(db, {
      provider: "sqlite",
      // Our tables are plural; map Better Auth's model names explicitly.
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    // PIN is the password; identifier is the phone-derived email (set at sign-up).
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 4, // PIN
      requireEmailVerification: false,
    },
    // 30-day sessions so students rarely re-login; refreshed daily.
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      // Oturumu imzalı bir çereze de yaz: `/koc/*` ve `/ogrenci/*` altındaki
      // HER istek layout render olmadan önce D1'e session+user sorgusu
      // atıyordu. 5 dakikalık çerez önbelleği bunu çoğu gezinmede sıfırlar.
      // TAKAS: bir admin başkasının rolünü değiştirdiğinde o kullanıcının
      // rolü en geç 5 dk bayat kalır (guard'lar da aynı çerezden okur).
      // Kabul edilebilir, çünkü rol değişimi nadir ve girişte çerez her zaman
      // D1'deki güncel rolle yeniden yazılır — kurulum/katıl akışları rolü
      // signUp'tan SONRA set edip ardından taze signIn yaptığı için etkilenmez.
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    user: {
      additionalFields: {
        // Managed server-side; clients cannot set their own role.
        role: {
          type: "string",
          required: false,
          defaultValue: "student",
          input: false,
        },
        phoneNumber: { type: "string", required: false, input: false },
        // Koç iletişim/ödeme — sunucu tarafında set edilir (clients giremez).
        telegram: { type: "string", required: false, input: false },
        instagram: { type: "string", required: false, input: false },
        iban: { type: "string", required: false, input: false },
      },
    },
  });
}

export type Auth = ReturnType<typeof getAuth>;
