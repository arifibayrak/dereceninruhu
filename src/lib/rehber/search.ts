import type { Block, Section, SectionIndexEntry } from "@/lib/rehber/types";

/**
 * Türkçe arama katlaması — aksanları ve İ/ı ikilisini tek forma indirger.
 * Kullanıcılar çoğu zaman "kaydet" yerine "kaydet", "görüşme" yerine "gorusme"
 * yazar; her iki taraf da katlanınca ikisi de eşleşir.
 */
export function foldTr(input: string): string {
  return input
    .replace(/[İIı]/g, "i")
    .replace(/[Şş]/g, "s")
    .replace(/[Ğğ]/g, "g")
    .replace(/[Üü]/g, "u")
    .replace(/[Öö]/g, "o")
    .replace(/[Çç]/g, "c")
    .toLowerCase();
}

/** Tek bir bloğun içindeki tüm metni toplar. */
function blockText(block: Block): string {
  switch (block.kind) {
    case "para":
    case "tip":
    case "warning":
    case "note":
      return block.text;
    case "steps":
      return [block.title, ...block.items].filter(Boolean).join(" ");
    case "buttons":
      return [
        block.title,
        ...block.rows.flatMap((r) => [r.label, r.where, r.does]),
      ]
        .filter(Boolean)
        .join(" ");
    case "table":
      return [block.title, ...block.head, ...block.rows.flat()]
        .filter(Boolean)
        .join(" ");
    case "faq":
      return block.items.flatMap((i) => [i.q, i.a]).join(" ");
    case "link":
      return block.label;
  }
}

/** Bir bölümün tüm metnini tek bir aranabilir dizeye indirger. */
export function flatten(section: Section): string {
  return foldTr(
    [
      section.title,
      section.chapter,
      section.lead,
      section.where ?? "",
      ...(section.keywords ?? []),
      ...section.blocks.map(blockText),
    ].join(" "),
  );
}

/** Sunucuda üretilip istemciye geçirilen hafif indeks. */
export function buildIndex(sections: Section[]): SectionIndexEntry[] {
  return sections.map((s) => ({
    id: s.id,
    no: s.no,
    chapter: s.chapter,
    title: s.title,
    lead: s.lead,
    haystack: flatten(s),
  }));
}

/**
 * Boşlukla ayrılmış her terimin ayrı ayrı bulunmasını arar (AND).
 * Boş sorgu her şeyi eşleştirir.
 */
export function matches(entry: SectionIndexEntry, query: string): boolean {
  const terms = foldTr(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  return terms.every((t) => entry.haystack.includes(t));
}
