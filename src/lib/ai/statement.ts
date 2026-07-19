/**
 * Serbest-metin banka ekstresini yapılandırılmış GELEN işlemlere çevirir (AI).
 *
 * extraction.ts ile aynı model-bağımsız desen: JSON-only prompt → gevşek JSON
 * ayrıştırma → doğrulama → bir kez yeniden dene. Tutarları AI HESAPLAMAZ, metni
 * olduğu gibi kopyalar; kuruşa çevirmeyi `parseTryToKurus` yapar (para = kuruş).
 * İsim → öğrenci eşleştirmesini AI YAPMAZ; `matchSender` (reconcile.ts) yapar.
 */
import { generateText } from "ai";
import { z } from "zod";
import { AI_MODELS, chatModel } from "./openrouter";
import { parseTryToKurus } from "@/lib/muhasebe";
import type { RawTransfer } from "@/lib/reconcile";

const SYSTEM = `Sen bir Türk banka hesap ekstresi ayrıştırıcısısın.
Görevin: metindeki GELEN (para girişi / havale / EFT ile alınan) işlemleri çıkarmak.

KATI KURALLAR:
- SADECE geçerli JSON döndür. Markdown, açıklama, kod bloğu YOK.
- YALNIZ para GİRİŞLERİ (alacak). Giden ödeme, masraf, faiz, vergi, komisyon = ATLA.
- "amount": tutarı ekstredeki gibi METİN olarak yaz ("1.234,56"). HESAP YAPMA, para birimi ekleme.
- "sender": parayı gönderenin AD SOYADI. Açıklamadaki ekleri (FAST, EFT, HAVALE, referans no) at; sadece isim kalsın.
- "date": "YYYY-MM-DD". Bilinmiyorsa null.
- Emin değilsen o satırı atla. Hiç giriş yoksa {"transfers": []} döndür.

ÇIKTI ŞEMASI:
{ "transfers": [ { "date": "YYYY-MM-DD" | null, "amount": "1.234,56", "sender": "AD SOYAD" } ] }`;

const aiSchema = z.object({
  transfers: z
    .array(
      z.object({
        date: z.string().nullish(),
        amount: z.union([z.string(), z.number()]),
        sender: z.string(),
      }),
    )
    .default([]),
});

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseAiJson(text: string): z.infer<typeof aiSchema> | null {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const raw = JSON.parse(cleaned.slice(start, end + 1));
    const parsed = aiSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Serbest-metin ekstreyi GELEN işlemlere çevir (iki denemede JSON çıkmazsa boş). */
export async function extractTransfersFromText(
  statement: string,
): Promise<RawTransfer[]> {
  const prompt = `=== EKSTRE ===\n${statement}\n\n=== GÖREV ===\nGelen işlemleri yukarıdaki şemaya göre SADECE JSON olarak üret.`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const { text } = await generateText({
      model: chatModel(AI_MODELS.extraction),
      system: SYSTEM,
      prompt,
      temperature: 0,
    });
    const parsed = parseAiJson(text);
    if (!parsed) continue;

    const out: RawTransfer[] = [];
    for (const t of parsed.transfers) {
      const amountKurus = parseTryToKurus(String(t.amount));
      if (amountKurus === null || amountKurus <= 0) continue;
      const sender = t.sender.trim();
      out.push({
        date: t.date && DATE_RE.test(t.date) ? t.date : null,
        amountKurus,
        senderName: sender,
        description: sender,
      });
    }
    return out;
  }
  return [];
}
