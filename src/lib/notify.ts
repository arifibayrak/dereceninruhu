/**
 * Anlık yönetici bildirimi — form doldurulunca Telegram (telefon push) +
 * Resend (e-posta arşivi). Sunucu-only; getEnv() ile secret'ları okur.
 *
 * Secret'lar (yoksa ilgili kanal sessizce atlanır — form akışı ASLA bozulmaz):
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 *   RESEND_API_KEY, NOTIFY_EMAIL_TO (virgülle çoklu), NOTIFY_EMAIL_FROM
 *   BETTER_AUTH_URL (bağlantıları mutlaklaştırmak için; zaten mevcut)
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getEnv } from "@/db";

export type NotifyPayload = {
  title: string;
  /** "Etiket: değer" satırları. */
  lines: string[];
  /** Koç paneline bağlantı (rölatif → BETTER_AUTH_URL ile mutlaklaşır). */
  url?: string;
};

type NotifyEnv = {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  RESEND_API_KEY?: string;
  NOTIFY_EMAIL_TO?: string;
  NOTIFY_EMAIL_FROM?: string;
  BETTER_AUTH_URL?: string;
};

const TIMEOUT_MS = 8000;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function absUrl(env: NotifyEnv, url?: string): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//.test(url)) return url;
  const base = env.BETTER_AUTH_URL?.replace(/\/$/, "") ?? "";
  return base ? `${base}${url}` : url;
}

async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<void> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: ac.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function sendTelegram(
  env: NotifyEnv,
  payload: NotifyPayload,
): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  const link = absUrl(env, payload.url);
  const text =
    `<b>${escapeHtml(payload.title)}</b>\n` +
    payload.lines.map(escapeHtml).join("\n") +
    (link ? `\n\n${escapeHtml(link)}` : "");
  await postJson(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {},
    {
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    },
  );
}

async function sendEmail(env: NotifyEnv, payload: NotifyPayload): Promise<void> {
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL_TO || !env.NOTIFY_EMAIL_FROM) {
    return;
  }
  const link = absUrl(env, payload.url);
  const html =
    `<h2 style="margin:0 0 12px">${escapeHtml(payload.title)}</h2>` +
    `<ul>${payload.lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>` +
    (link
      ? `<p><a href="${escapeHtml(link)}">Panelde aç →</a></p>`
      : "");
  await postJson(
    "https://api.resend.com/emails",
    { authorization: `Bearer ${env.RESEND_API_KEY}` },
    {
      from: env.NOTIFY_EMAIL_FROM,
      to: env.NOTIFY_EMAIL_TO.split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      subject: payload.title,
      html,
    },
  );
}

/** Best-effort; ASLA throw etmez. İlgili secret yoksa o kanalı sessizce atlar. */
export async function notify(payload: NotifyPayload): Promise<void> {
  let env: NotifyEnv;
  try {
    env = getEnv() as unknown as NotifyEnv;
  } catch {
    return;
  }
  await Promise.allSettled([
    sendTelegram(env, payload),
    sendEmail(env, payload),
  ]);
}

/**
 * Yanıtı bloklamadan bildirim gönder (Cloudflare ctx.waitUntil). Server
 * Action'lardan senkron çağrılır; başarısızlık formu ETKİLEMEZ.
 */
export function notifyAfterResponse(payload: NotifyPayload): void {
  const pending = notify(payload);
  try {
    getCloudflareContext().ctx.waitUntil(pending);
  } catch {
    // ctx yoksa (ör. yerel) sadece arka planda bırak.
    void pending;
  }
}
