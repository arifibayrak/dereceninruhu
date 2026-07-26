import { describe, expect, it } from "vitest";
import {
  DAY_COLOR_KEYS,
  dayColorOf,
  defaultDayColor,
  fillLayoutDays,
  layoutIsEmpty,
  parseSubjectIds,
  serializeSubjectIds,
} from "./plan-layout";

describe("parseSubjectIds", () => {
  it("okur", () => {
    expect(parseSubjectIds("[3,1,2]")).toEqual([3, 1, 2]);
  });

  it("boş/null → boş dizi", () => {
    expect(parseSubjectIds(null)).toEqual([]);
    expect(parseSubjectIds("")).toEqual([]);
    expect(parseSubjectIds("[]")).toEqual([]);
  });

  // Düzen kozmetiktir: bozuk veri programı patlatmamalı, sessizce boşalmalı.
  it("bozuk JSON / yanlış tip → boş dizi", () => {
    expect(parseSubjectIds("{bozuk")).toEqual([]);
    expect(parseSubjectIds('{"a":1}')).toEqual([]);
    expect(parseSubjectIds('"metin"')).toEqual([]);
  });

  it("sayı olmayan ve pozitif olmayan id'leri atar", () => {
    expect(parseSubjectIds('[1,"2",null,0,-4,3.5,3]')).toEqual([1, 3]);
  });
});

describe("serializeSubjectIds", () => {
  it("sırayı korur (koçun seçim sırası = gösterim sırası)", () => {
    expect(serializeSubjectIds([5, 2, 9])).toBe("[5,2,9]");
  });

  it("tekilleştirir", () => {
    expect(serializeSubjectIds([4, 4, 7, 4])).toBe("[4,7]");
  });

  it("geçersiz id'leri düşürür", () => {
    expect(serializeSubjectIds([1, 0, -2, 3])).toBe("[1,3]");
  });

  it("parse ile gidiş-dönüş kayıpsız", () => {
    expect(parseSubjectIds(serializeSubjectIds([8, 1, 6]))).toEqual([8, 1, 6]);
  });
});

describe("gün renkleri", () => {
  it("her güne farklı varsayılan verir (7 gün, 7 renk)", () => {
    const colors = [1, 2, 3, 4, 5, 6, 7].map(defaultDayColor);
    expect(new Set(colors).size).toBe(7);
    expect(DAY_COLOR_KEYS).toHaveLength(7);
  });

  it("kayıtlı geçerli anahtarı kullanır", () => {
    expect(dayColorOf(1, "zumrut")).toBe("zumrut");
  });

  it("geçersiz/boş anahtarda varsayılana düşer", () => {
    expect(dayColorOf(3, "yok-boyle-renk")).toBe(defaultDayColor(3));
    expect(dayColorOf(3, null)).toBe(defaultDayColor(3));
  });
});

describe("fillLayoutDays", () => {
  it("kayıtsız günleri boş + varsayılan renkle tamamlar", () => {
    const filled = fillLayoutDays([
      { day: 2, subjectIds: [4, 5], color: "gok" },
    ]);
    expect(filled).toHaveLength(7);
    expect(filled.map((d) => d.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);

    const salı = filled.find((d) => d.day === 2)!;
    expect(salı.subjectIds).toEqual([4, 5]);
    expect(salı.color).toBe("gok");

    const pazartesi = filled.find((d) => d.day === 1)!;
    expect(pazartesi.subjectIds).toEqual([]);
    expect(pazartesi.color).toBe(defaultDayColor(1));
  });

  it("hiç satır yoksa 7 boş gün döner", () => {
    const filled = fillLayoutDays([]);
    expect(filled).toHaveLength(7);
    expect(layoutIsEmpty(filled)).toBe(true);
  });

  it("tek dolu gün bile düzeni 'boş değil' yapar", () => {
    expect(
      layoutIsEmpty(fillLayoutDays([{ day: 5, subjectIds: [1], color: null }])),
    ).toBe(false);
  });
});
