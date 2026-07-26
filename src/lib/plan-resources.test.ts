import { describe, expect, it } from "vitest";
import {
  parseResourceIds,
  resourceNamesOf,
  serializeResourceIds,
  taskResourceIds,
} from "./plan-resources";

describe("parseResourceIds", () => {
  it("okur", () => {
    expect(parseResourceIds("[4,2]")).toEqual([4, 2]);
  });

  it("boş/null → boş dizi", () => {
    expect(parseResourceIds(null)).toEqual([]);
    expect(parseResourceIds("")).toEqual([]);
    expect(parseResourceIds("[]")).toEqual([]);
  });

  // Kaynak bilgisi görevin süsü: bozuk veri programı patlatmamalı.
  it("bozuk JSON / yanlış tip → boş dizi", () => {
    expect(parseResourceIds("{bozuk")).toEqual([]);
    expect(parseResourceIds('{"a":1}')).toEqual([]);
  });

  it("sayı olmayan ve pozitif olmayan id'leri atar", () => {
    expect(parseResourceIds('[1,"2",null,0,-3,2.5,7]')).toEqual([1, 7]);
  });
});

describe("serializeResourceIds", () => {
  it("seçim sırasını korur", () => {
    expect(serializeResourceIds([9, 3, 5])).toBe("[9,3,5]");
  });

  it("tekilleştirir ve geçersizleri atar", () => {
    expect(serializeResourceIds([3, 3, 0, -1, 8])).toBe("[3,8]");
  });
});

describe("taskResourceIds", () => {
  it("liste doluysa listeyi verir", () => {
    expect(
      taskResourceIds({ resourceIds: "[5,6]", resourceId: 1 }),
    ).toEqual([5, 6]);
  });

  // Göç öncesi satırlar: tek kaynak yalnız resource_id kolonunda duruyor.
  it("liste boşsa tekil kaynağa düşer", () => {
    expect(taskResourceIds({ resourceIds: "[]", resourceId: 7 })).toEqual([7]);
    expect(taskResourceIds({ resourceIds: null, resourceId: 7 })).toEqual([7]);
  });

  it("ikisi de boşsa boş dizi", () => {
    expect(taskResourceIds({ resourceIds: "[]", resourceId: null })).toEqual([]);
  });
});

describe("resourceNamesOf", () => {
  const names = new Map([
    [1, "Palme fasikül"],
    [2, "3D soru bankası"],
  ]);

  it("seçim sırasında adlandırır", () => {
    expect(resourceNamesOf([2, 1], names)).toEqual([
      "3D soru bankası",
      "Palme fasikül",
    ]);
  });

  // Silinmiş/başka kayda ait id sessizce düşer — satır yine render edilir.
  it("bilinmeyen id'yi atar", () => {
    expect(resourceNamesOf([1, 99], names)).toEqual(["Palme fasikül"]);
  });
});
