/**
 * Banka ekstresi mutabakatı — saf yardımcılar (DB erişimi yok).
 *
 * İki giriş yolu ortak `RawTransfer` şekline iner:
 *  - CSV/tablo: `parseStatementCsv` (kesin tutar; banka başlık takma adları).
 *  - Serbest metin: `@/lib/ai/statement` (AI; bu dosyanın dışında).
 * Sonra gönderen adı `matchSender` ile kadroya eşleştirilir. Para = kuruş.
 */
import { parseCsv } from "@/lib/csv";
import { parseTryToKurus } from "@/lib/muhasebe";

/** Ekstredeki tek bir GELEN işlem (para girişi). */
export type RawTransfer = {
  /** YYYY-MM-DD ya da null (koç önizlemede belirler). */
  date: string | null;
  amountKurus: number;
  senderName: string;
  description?: string;
};

/** Eşleştirme hedefi — aktif kadro satırı. */
export type RosterEntry = {
  enrollmentId: number;
  studentId: number;
  label: string;
};

/* -------------------------------------------------------------------------- */
/*  İsim sadeleştirme + eşleştirme                                            */
/* -------------------------------------------------------------------------- */

const TR_FOLD: Record<string, string> = {
  ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g",
  ç: "c", Ç: "c", ö: "o", Ö: "o", ü: "u", Ü: "u",
  â: "a", î: "i", û: "u",
};

/** İsimleri karşılaştırma için sadeleştir: TR harflerini katla, küçük harf, noktalama at. */
export function normalizeName(s: string): string {
  return s
    .split("")
    .map((c) => TR_FOLD[c] ?? c)
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 2+ harfli anlamlı parçalar (tek harfli baş harfleri ele). */
function nameTokens(s: string): string[] {
  return normalizeName(s)
    .split(" ")
    .filter((t) => t.length > 1);
}

export type SenderMatch = {
  match: RosterEntry | null;
  /** Aynı skorla birden çok öğrenci → belirsiz (koç seçmeli). */
  ambiguous: boolean;
  /** Eşleşen isim parçası sayısı (güven göstergesi). */
  score: number;
};

/**
 * Gönderen adını kadroyla eşleştir. Öğrencinin adının parçaları gönderen
 * metninde ne kadar geçiyorsa skor o kadar yüksek; en az ad+soyad (2 parça)
 * ya da tek parçalı ismin tamamı gerekir. En yüksek skor kazanır, beraberlik
 * = belirsiz (koç önizlemede seçer). Ekstredeki "FAST/EFT/referans" ekleri
 * skoru bozmaz çünkü yalnız öğrenci-adı parçaları aranır.
 */
export function matchSender(senderName: string, roster: RosterEntry[]): SenderMatch {
  const senderSet = new Set(nameTokens(senderName));
  if (senderSet.size === 0) return { match: null, ambiguous: false, score: 0 };

  let best: RosterEntry | null = null;
  let bestScore = 0;
  let tie = false;

  for (const entry of roster) {
    const tokens = nameTokens(entry.label);
    if (tokens.length === 0) continue;
    const hit = tokens.filter((t) => senderSet.has(t)).length;
    const strong = hit >= 2 || (tokens.length === 1 && hit === 1);
    if (!strong) continue;
    if (hit > bestScore) {
      best = entry;
      bestScore = hit;
      tie = false;
    } else if (hit === bestScore && best && entry.studentId !== best.studentId) {
      tie = true;
    }
  }

  return { match: best, ambiguous: tie, score: bestScore };
}

/* -------------------------------------------------------------------------- */
/*  CSV / tablo ayrıştırma (banka hesap hareketleri dışa aktarımı)           */
/* -------------------------------------------------------------------------- */

const DATE_ALIASES = [
  "tarih", "işlem tarihi", "islem tarihi", "valör", "valor",
  "valör tarihi", "valor tarihi", "date",
];
const CREDIT_ALIASES = ["alacak", "credit", "gelen", "para girişi", "para girisi", "giriş"];
const AMOUNT_ALIASES = ["tutar", "işlem tutarı", "islem tutari", "miktar", "amount"];
const SENDER_ALIASES = [
  "gönderen", "gonderen", "gönderen ad", "gönderen unvan", "gönderen ünvan",
  "karşı taraf", "karsi taraf", "açıklama", "aciklama", "ad soyad", "adsoyad",
  "ad-soyad", "isim", "description", "sender", "name",
];

function findCol(header: string[], aliases: string[]): number {
  const norm = header.map((h) => h.trim().toLowerCase());
  for (let i = 0; i < norm.length; i++) {
    if (aliases.includes(norm[i])) return i;
  }
  for (let i = 0; i < norm.length; i++) {
    if (norm[i] && aliases.some((a) => norm[i].includes(a))) return i;
  }
  return -1;
}

/** dd.mm.yyyy / dd/mm/yyyy / yyyy-mm-dd → YYYY-MM-DD (yoksa null). */
function parseDateCell(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  let m = t.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = t.match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

export type StatementParse = { transfers: RawTransfer[]; warnings: string[] };

/**
 * Banka CSV'sini GELEN işlemlere çevirir. Alacak sütunu varsa onu, yoksa Tutar
 * sütununu kullanır; negatif/boş/okunamayan tutarlar (giden işlemler) atlanır.
 */
export function parseStatementCsv(text: string): StatementParse {
  const grid = parseCsv(text);
  const warnings: string[] = [];
  if (grid.length < 2) {
    return { transfers: [], warnings: ["Tablo okunamadı (başlık + en az bir satır gerekli)."] };
  }
  const header = grid[0];
  const dateCol = findCol(header, DATE_ALIASES);
  const creditCol = findCol(header, CREDIT_ALIASES);
  const amountCol = creditCol !== -1 ? creditCol : findCol(header, AMOUNT_ALIASES);
  const senderCol = findCol(header, SENDER_ALIASES);

  if (amountCol === -1) {
    return {
      transfers: [],
      warnings: ["Tutar/Alacak sütunu bulunamadı. Başlıkta 'Tutar' ya da 'Alacak' olmalı."],
    };
  }
  if (senderCol === -1) {
    warnings.push("Gönderen/Açıklama sütunu bulunamadı — isim eşleştirmesi yapılamıyor.");
  }

  const transfers: RawTransfer[] = [];
  let skipped = 0;
  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r];
    const amountKurus = parseTryToKurus(cells[amountCol] ?? "");
    if (amountKurus === null || amountKurus <= 0) {
      skipped++;
      continue;
    }
    const senderName = senderCol !== -1 ? (cells[senderCol] ?? "").trim() : "";
    transfers.push({
      date: dateCol !== -1 ? parseDateCell(cells[dateCol] ?? "") : null,
      amountKurus,
      senderName,
      description: senderName,
    });
  }
  if (skipped > 0) {
    warnings.push(`${skipped} satır atlandı (giden/boş/okunamayan tutar).`);
  }
  return { transfers, warnings };
}
