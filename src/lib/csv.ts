/**
 * Bağımlılıksız, küçük bir CSV ayrıştırıcı (RFC-4180 benzeri): tırnaklı alanlar,
 * gömülü virgül/yeni satır, "" kaçışı ve CRLF/LF desteklenir. Kadro içe aktarımı
 * için başlık satırını kanonik alan adlarına (Türkçe/İngilizce) eşler.
 */

/** Ham CSV metnini satır/hücre dizisine çevirir. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  // UTF-8 BOM'u temizle.
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      // \r\n → tek satır sonu.
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  // Son alan/satır (dosya yeni satırla bitmeyebilir).
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Tamamen boş satırları at.
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** Kanonik kadro alanları. */
export type RosterField =
  | "fullName"
  | "phone"
  | "examCode"
  | "trackCode"
  | "targetText"
  | "grade"
  | "status";

/** Başlık takma adları (küçük harfe indirgenmiş) → kanonik alan. */
const HEADER_ALIASES: Record<string, RosterField> = {
  fullname: "fullName",
  "ad soyad": "fullName",
  adsoyad: "fullName",
  "ad-soyad": "fullName",
  ad: "fullName",
  isim: "fullName",
  phone: "phone",
  telefon: "phone",
  "telefon numarası": "phone",
  "telefon numarasi": "phone",
  tel: "phone",
  gsm: "phone",
  numara: "phone",
  examcode: "examCode",
  "sınav": "examCode",
  sinav: "examCode",
  "sınav kodu": "examCode",
  trackcode: "trackCode",
  alan: "trackCode",
  "bölüm": "trackCode",
  bolum: "trackCode",
  targettext: "targetText",
  hedef: "targetText",
  grade: "grade",
  "sınıf": "grade",
  sinif: "grade",
  status: "status",
  durum: "status",
};

export type RosterCsvRow = {
  /** 1 tabanlı kaynak satır numarası (başlık = 1). */
  lineNo: number;
  values: Partial<Record<RosterField, string>>;
};

export type ParsedRosterCsv = {
  fields: RosterField[];
  rows: RosterCsvRow[];
  /** Eşlenemeyen başlık sütunları (kullanıcıya uyarı). */
  unknownHeaders: string[];
};

/** Başlıklı CSV'yi kanonik satırlara çevirir. */
export function parseRosterCsv(text: string): ParsedRosterCsv {
  const grid = parseCsv(text);
  if (grid.length === 0) {
    return { fields: [], rows: [], unknownHeaders: [] };
  }
  const header = grid[0];
  const fields: (RosterField | null)[] = [];
  const unknownHeaders: string[] = [];
  for (const raw of header) {
    const key = raw.trim().toLowerCase();
    const mapped = HEADER_ALIASES[key] ?? null;
    fields.push(mapped);
    if (!mapped && raw.trim() !== "") unknownHeaders.push(raw.trim());
  }

  const rows: RosterCsvRow[] = [];
  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r];
    const values: Partial<Record<RosterField, string>> = {};
    for (let c = 0; c < fields.length; c++) {
      const f = fields[c];
      if (!f) continue;
      const v = (cells[c] ?? "").trim();
      if (v !== "") values[f] = v;
    }
    rows.push({ lineNo: r + 1, values });
  }

  return {
    fields: fields.filter((f): f is RosterField => f !== null),
    rows,
    unknownHeaders,
  };
}
