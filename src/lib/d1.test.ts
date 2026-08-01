import { describe, expect, it } from "vitest";
import { chunk, chunkForD1, D1_MAX_BOUND_PARAMS } from "./d1";

describe("chunk", () => {
  it("boş dizi → boş sonuç", () => {
    expect(chunk([], 10)).toEqual([]);
  });

  it("tam bölünen dizi eşit parçalara ayrılır", () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("artan eleman son parçada kalır", () => {
    expect(chunk([1, 2, 3], 2)).toEqual([[1, 2], [3]]);
  });

  it("sıfır/negatif boyutta bile sonsuz döngüye girmez", () => {
    expect(chunk([1, 2], 0)).toEqual([[1], [2]]);
  });
});

describe("chunkForD1", () => {
  it("parça başına parametre sayısı D1 sınırını aşmaz", () => {
    const rows = Array.from({ length: 40 }, (_, i) => i);
    for (const paramsPerRow of [1, 2, 3, 4, 6, 9, 11]) {
      for (const part of chunkForD1(rows, paramsPerRow)) {
        expect(part.length * paramsPerRow).toBeLessThanOrEqual(
          D1_MAX_BOUND_PARAMS,
        );
      }
    }
  });

  it("mock_topic_errors (4 `?`/satır) → 25'erli parçalar", () => {
    const rows = Array.from({ length: 28 }, (_, i) => i);
    const parts = chunkForD1(rows, 4);
    expect(parts.map((p) => p.length)).toEqual([25, 3]);
  });

  it("sabit parametreler bütçeden düşülür (where … and in (…))", () => {
    const rows = Array.from({ length: 250 }, (_, i) => i);
    const parts = chunkForD1(rows, 1, 1);
    expect(parts[0]).toHaveLength(99);
    expect(parts.every((p) => p.length + 1 <= D1_MAX_BOUND_PARAMS)).toBe(true);
  });

  it("hiçbir satır kaybolmaz ve sıra korunur", () => {
    const rows = Array.from({ length: 137 }, (_, i) => i);
    expect(chunkForD1(rows, 9).flat()).toEqual(rows);
  });
});
