/**
 * Koç notu ayrıştırıcısı — saf yardımcılar, framework yok.
 *
 * Neden var: koçlar haftanın tamamını `weekly_plans.coach_note` serbest metnine
 * yapıştırıyor ve öğrenci ekranında bir metin duvarı oluşuyor (bkz. geri
 * bildirim, Görsel 7). Gerçek çözüm notu gün gün göreve dönüştürmek; bu modül
 * hem öğrenci tarafında notu okunabilir maddelere böler hem de koç tarafında
 * "notu görevlere dönüştür" akışını besler.
 *
 * Gözlenen biçim: her satır bir gün/konu kümesi, satır içinde maddeler orta
 * nokta (·) ile ayrılmış. Ayırıcı yoksa metin olduğu gibi tek madde kalır —
 * yapı uydurmayız.
 */

/** Bir satırdan çıkan madde kümesi (genelde bir günün işleri). */
export type NoteGroup = {
  /** Satırın kaçıncı olduğu — koç tarafında gün eşlemesinin varsayılanı. */
  index: number;
  items: string[];
};

/** Madde ayırıcıları: orta nokta, madde imi, uzun tire başlı satırlar. */
const ITEM_SEPARATOR = /\s*[·•]\s*/;
/** Baştaki madde imlerini/numaraları temizler ("- ", "• ", "1) ", "2. "). */
const LEADING_BULLET = /^\s*(?:[-–—*•]|\d{1,2}[.)])\s+/;

/**
 * Notu satır → madde ağacına böler. Boş satırlar ve boş maddeler elenir.
 * Ayırıcı içermeyen tek satırlık not tek maddelik tek grup olarak döner.
 */
export function parseCoachNote(raw: string | null | undefined): NoteGroup[] {
  if (!raw) return [];
  const groups: NoteGroup[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const items = line
      .split(ITEM_SEPARATOR)
      .map((s) => s.replace(LEADING_BULLET, "").trim())
      .filter(Boolean);
    if (items.length === 0) continue;
    groups.push({ index: groups.length, items });
  }
  return groups;
}

/** Toplam madde sayısı — katlama eşiğini ve "uzun not" uyarısını besler. */
export function countNoteItems(groups: NoteGroup[]): number {
  return groups.reduce((acc, g) => acc + g.items.length, 0);
}

/**
 * Not liste olarak mı gösterilmeli? Tek maddelik kısa notlar paragraf kalır —
 * iki kelimelik bir cümleyi madde imine çevirmek gürültü olur.
 */
export function isStructuredNote(groups: NoteGroup[]): boolean {
  return countNoteItems(groups) > 1;
}

/**
 * Maddeleri düz listeye açar; koç tarafında her madde bir görev adayıdır.
 * `day` satır sırasından türetilir (1. satır → Pazartesi …), 7'den sonrası
 * son güne yığılmak yerine başa döner ki hiçbir madde kaybolmasın.
 */
export type NoteTaskCandidate = {
  /** Liste içinde benzersiz — React key'i ve seçim durumu için. */
  key: string;
  description: string;
  /** 1–7 (Pazartesi–Pazar) önerisi; koç değiştirebilir. */
  day: number;
};

export function noteTaskCandidates(groups: NoteGroup[]): NoteTaskCandidate[] {
  const out: NoteTaskCandidate[] = [];
  for (const group of groups) {
    const day = (group.index % 7) + 1;
    group.items.forEach((description, i) => {
      out.push({ key: `${group.index}-${i}`, description, day });
    });
  }
  return out;
}

/** Uzun not eşiği — koça "bunu göreve dönüştür" önerisini bu tetikler. */
export const LONG_NOTE_CHARS = 300;
