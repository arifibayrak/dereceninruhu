/**
 * D1'in SERT sınırı: bir sorguda en fazla **100 bağlı parametre** (`?`) olabilir.
 * https://developers.cloudflare.com/d1/platform/limits/
 *
 * Çok satırlı `insert ... values (?,?,?), (?,?,?)` ya da `in (?, ?, …)` üreten
 * her yazım satır sayısı büyüdükçe sessizce bu sınıra dayanır ve sorgu
 * "Failed query: …" ile patlar. Toplu yazımları HER ZAMAN buradan geçir.
 */
export const D1_MAX_BOUND_PARAMS = 100;

/** Diziyi en fazla `size` uzunluklu parçalara böler (boş dizi → boş sonuç). */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const step = Math.max(1, Math.floor(size));
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += step) out.push(items.slice(i, i + step));
  return out;
}

/**
 * Satır başına `paramsPerRow` parametre harcayan toplu bir sorguyu D1 sınırının
 * altında kalan parçalara böler.
 *
 * @param paramsPerRow Satır başına `?` sayısı. INSERT'te bu, değeri ya da
 *   `$defaultFn`'i olan sütun sayısıdır (autoincrement `id` literal `null`
 *   yazıldığı için sayılmaz) — ör. `mock_topic_errors` = 4.
 * @param reservedParams Sorgunun sabit parametreleri (ör. `where mock_exam_id = ?`).
 */
export function chunkForD1<T>(
  rows: readonly T[],
  paramsPerRow: number,
  reservedParams = 0,
): T[][] {
  const perRow = Math.max(1, Math.floor(paramsPerRow));
  const budget = D1_MAX_BOUND_PARAMS - Math.max(0, Math.floor(reservedParams));
  return chunk(rows, Math.floor(budget / perRow));
}

/**
 * `where … in (ids)` okumalarını parça parça çalıştırıp satırları birleştirir.
 * Liste kısaysa (tek parça) tek sorgu atar — yani sıcak yol aynı kalır.
 *
 * @param reservedParams Sorgunun id dışındaki sabit parametreleri.
 */
export async function selectInChunks<Id, R>(
  ids: readonly Id[],
  run: (part: Id[]) => Promise<R[]>,
  reservedParams = 0,
): Promise<R[]> {
  if (ids.length === 0) return [];
  const parts = chunkForD1(ids, 1, reservedParams);
  if (parts.length === 1) return run(parts[0]);
  const out: R[] = [];
  for (const part of parts) out.push(...(await run(part)));
  return out;
}
