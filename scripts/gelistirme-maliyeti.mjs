#!/usr/bin/env node
/**
 * Geliştirme jetonlarını ölçüp `dev_usage_snapshot` tablosuna yazar.
 *
 * NEDEN: Projeyi yazarken harcanan Claude Code jetonları geliştiricinin
 * makinesindeki oturum kayıtlarında (~/.claude/projects/<proje>/*.jsonl) durur.
 * Worker bu dosyaları göremez, dolayısıyla /koc/maliyet paneli geliştirme
 * maliyetini kendi başına bilemez. Bu betik her `pnpm run deploy` sonunda
 * çalışıp güncel toplamı D1'e taşır.
 *
 * ASLA dağıtımı düşürmez: hata olursa uyarı basıp 0 ile çıkar (dağıtım zaten
 * bitmiştir; muhasebe yüzünden kırmızı görmek istemeyiz).
 *
 * Elle çalıştırmak için: `pnpm gelistirme:maliyet`
 */
import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { createInterface } from "node:readline";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";

const DB = "dereceninruhu-db";

/** Claude Code proje dizini: mutlak yol içindeki `/` ve `.` karakterleri `-` olur. */
function transcriptDir() {
  const slug = process.cwd().replace(/[/.]/g, "-");
  return join(homedir(), ".claude", "projects", slug);
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith(".jsonl")) out.push(p);
  }
  return out;
}

async function olc(dir) {
  const seen = new Set();
  const byModel = new Map();
  let firstAt = null;
  let lastAt = null;

  for (const file of walk(dir)) {
    const rl = createInterface({
      input: createReadStream(file),
      crlfDelay: Infinity,
    });
    for await (const line of rl) {
      if (!line.startsWith("{")) continue;
      let o;
      try {
        o = JSON.parse(line);
      } catch {
        continue;
      }
      const msg = o.message;
      if (!msg?.usage || msg.role !== "assistant" || !msg.model) continue;
      // Aynı API yanıtı devam eden/çatallanan oturumlarda tekrar görünebilir.
      const id = msg.id ?? o.requestId ?? o.uuid;
      if (id) {
        if (seen.has(id)) continue;
        seen.add(id);
      }
      const ts = o.timestamp ? Date.parse(o.timestamp) : null;
      if (ts && Number.isFinite(ts)) {
        if (firstAt === null || ts < firstAt) firstAt = ts;
        if (lastAt === null || ts > lastAt) lastAt = ts;
      }
      const u = msg.usage;
      const cc = u.cache_creation ?? {};
      const m = byModel.get(msg.model) ?? {
        calls: 0,
        input: 0,
        output: 0,
        cacheRead: 0,
        w5: 0,
        w1: 0,
      };
      m.calls += 1;
      m.input += u.input_tokens ?? 0;
      m.output += u.output_tokens ?? 0;
      m.cacheRead += u.cache_read_input_tokens ?? 0;
      const w5 = cc.ephemeral_5m_input_tokens ?? 0;
      const w1 = cc.ephemeral_1h_input_tokens ?? 0;
      // Dökümü olmayan eski kayıtlarda toplamı ucuz olana (5 dk) say.
      if (w5 || w1) {
        m.w5 += w5;
        m.w1 += w1;
      } else m.w5 += u.cache_creation_input_tokens ?? 0;
      byModel.set(msg.model, m);
    }
  }
  return { byModel, firstAt, lastAt, benzersiz: seen.size };
}

const sec = (ms) => (ms ? Math.floor(ms / 1000) : "null");

async function main() {
  const dir = transcriptDir();
  if (!existsSync(dir)) {
    console.warn(`[gelistirme-maliyeti] oturum kaydı yok: ${dir} — atlandı`);
    return;
  }

  const { byModel, firstAt, lastAt, benzersiz } = await olc(dir);
  if (byModel.size === 0) {
    console.warn("[gelistirme-maliyeti] ölçülecek kullanım bulunamadı — atlandı");
    return;
  }

  const measuredAt = Math.floor(Date.now() / 1000);
  const values = [...byModel.entries()]
    // Claude Code'un iç mesajları (`<synthetic>`) jeton harcamaz — panelde
    // sıfırlık satır olarak görünmesinler.
    .filter(
      ([, m]) => m.input + m.output + m.cacheRead + m.w5 + m.w1 > 0,
    )
    .map(([model, m]) => {
      // Model kimliği bizim ürettiğimiz kayıttan geliyor; yine de tırnak kaçır.
      const safe = model.replace(/'/g, "''");
      return `(${measuredAt}, ${sec(firstAt)}, ${sec(lastAt)}, '${safe}', ${m.calls}, ${m.input}, ${m.output}, ${m.cacheRead}, ${m.w5}, ${m.w1})`;
    })
    .join(", ");

  if (!values) {
    console.warn("[gelistirme-maliyeti] jeton harcayan model yok — atlandı");
    return;
  }

  const sql =
    "insert into dev_usage_snapshot " +
    "(measured_at, first_at, last_at, model, calls, input_tokens, output_tokens, cache_read_tokens, cache_write_5m_tokens, cache_write_1h_tokens) " +
    `values ${values};`;

  execFileSync(
    "pnpm",
    ["exec", "wrangler", "d1", "execute", DB, "--remote", "--command", sql],
    { stdio: "pipe" },
  );

  const toplam = [...byModel.values()].reduce(
    (t, m) => t + m.input + m.output + m.cacheRead + m.w5 + m.w1,
    0,
  );
  console.log(
    `[gelistirme-maliyeti] ${byModel.size} model · ${benzersiz.toLocaleString("tr-TR")} çağrı · ` +
      `${toplam.toLocaleString("tr-TR")} jeton → dev_usage_snapshot`,
  );
}

main().catch((err) => {
  // Dağıtımı ASLA düşürme.
  console.warn("[gelistirme-maliyeti] yazılamadı:", err?.message ?? err);
});
