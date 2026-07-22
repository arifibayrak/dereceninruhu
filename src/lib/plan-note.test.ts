import { describe, expect, it } from "vitest";

import {
  countNoteItems,
  isStructuredNote,
  noteTaskCandidates,
  parseCoachNote,
} from "@/lib/plan-note";

/** Geri bildirimdeki gerçek not (Görsel 7) — kısaltılmış hâli. */
const REAL_NOTE = `TÜRKÇE(Aker Kartal) · Matematik(Mehmet Bilge Yıldız) · TARİH(Mehmet Celal)
Branş Denemesi ×2 · Oran Orantı+Çarpanlara ayırma · İnkılaplar+Dış Politikaları
Parla Sözcük Türleri · Yeryüzü Şekilleri(Tekrar)`;

describe("parseCoachNote", () => {
  it("satırlara ve orta noktaya göre böler", () => {
    const groups = parseCoachNote(REAL_NOTE);
    expect(groups).toHaveLength(3);
    expect(groups[0].items).toEqual([
      "TÜRKÇE(Aker Kartal)",
      "Matematik(Mehmet Bilge Yıldız)",
      "TARİH(Mehmet Celal)",
    ]);
    expect(groups[2].items).toEqual([
      "Parla Sözcük Türleri",
      "Yeryüzü Şekilleri(Tekrar)",
    ]);
  });

  it("boş satırları atlar ve index'i sıkıştırır", () => {
    const groups = parseCoachNote("Bir\n\n\nİki");
    expect(groups.map((g) => g.index)).toEqual([0, 1]);
    expect(groups[1].items).toEqual(["İki"]);
  });

  it("baştaki madde imlerini ve numaraları temizler", () => {
    const groups = parseCoachNote("- Türev tekrar\n2) Limit soruları\n• Deneme");
    expect(groups.flatMap((g) => g.items)).toEqual([
      "Türev tekrar",
      "Limit soruları",
      "Deneme",
    ]);
  });

  it("ayırıcı yoksa metni bozmaz", () => {
    const groups = parseCoachNote("Bu hafta denemeye ağırlık ver.");
    expect(groups).toEqual([
      { index: 0, items: ["Bu hafta denemeye ağırlık ver."] },
    ]);
  });

  it("boş/eksik girdide boş dizi döner", () => {
    expect(parseCoachNote(null)).toEqual([]);
    expect(parseCoachNote("")).toEqual([]);
    expect(parseCoachNote("   \n \n")).toEqual([]);
  });

  it("ardışık ayırıcılardan boş madde üretmez", () => {
    expect(parseCoachNote("A ·· B · · C")[0].items).toEqual(["A", "B", "C"]);
  });
});

describe("countNoteItems / isStructuredNote", () => {
  it("toplam madde sayar", () => {
    expect(countNoteItems(parseCoachNote(REAL_NOTE))).toBe(8);
  });

  it("tek maddelik notu liste saymaz", () => {
    expect(isStructuredNote(parseCoachNote("Kısa bir not"))).toBe(false);
    expect(isStructuredNote(parseCoachNote("A · B"))).toBe(true);
  });
});

describe("noteTaskCandidates", () => {
  it("satır sırasını güne çevirir", () => {
    const c = noteTaskCandidates(parseCoachNote(REAL_NOTE));
    expect(c).toHaveLength(8);
    expect(c[0]).toEqual({
      key: "0-0",
      description: "TÜRKÇE(Aker Kartal)",
      day: 1,
    });
    // 2. satır → Salı, 3. satır → Çarşamba
    expect(c.find((x) => x.key === "1-0")?.day).toBe(2);
    expect(c.find((x) => x.key === "2-0")?.day).toBe(3);
  });

  it("7 satırdan sonra başa döner, madde kaybolmaz", () => {
    const note = Array.from({ length: 9 }, (_, i) => `Satır ${i}`).join("\n");
    const c = noteTaskCandidates(parseCoachNote(note));
    expect(c).toHaveLength(9);
    expect(c[7].day).toBe(1); // 8. satır → Pazartesi
    expect(c[8].day).toBe(2);
  });

  it("anahtarlar benzersiz", () => {
    const c = noteTaskCandidates(parseCoachNote(REAL_NOTE));
    expect(new Set(c.map((x) => x.key)).size).toBe(c.length);
  });
});
