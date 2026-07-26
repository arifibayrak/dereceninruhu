/**
 * Program görevine bağlı KAYNAKLAR.
 *
 * Bir konu tek kaynaktan çalışılmaz: "Limit — Palme fasikül + 3D soru bankası".
 * Bu yüzden görev, kayıttaki kaynaklardan birden çoğunu taşır ve
 * `plan_tasks.resource_ids` JSON-encoded number[] tutar
 * (`plan_day_layouts.subject_ids` ile aynı desen). Pure — DB yok.
 */

/** Bir görevde en çok kaç kaynak seçilebilir (form + doğrulama ortak sınırı). */
export const MAX_TASK_RESOURCES = 8;

/**
 * Bozuk/eksik veri boş diziye düşer — kaynak bilgisi görevin süsü, asla
 * programı patlatmamalı.
 */
export function parseResourceIds(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v.filter((n): n is number => Number.isInteger(n) && n > 0);
  } catch {
    return [];
  }
}

export function serializeResourceIds(ids: readonly number[]): string {
  // Tekilleştir + sırayı koru: koçun seçim sırası gösterim sırasıdır.
  return JSON.stringify([
    ...new Set(ids.filter((n) => Number.isInteger(n) && n > 0)),
  ]);
}

/**
 * Satırın kaynak listesi. `resource_ids` kolonu 0021'de eklendi; o göçten önce
 * yazılmış (ya da eski bir istemciden gelen) satırlarda tek `resource_id` var —
 * liste boşsa ona düşeriz, hiçbir görev kaynağını kaybetmez.
 */
export function taskResourceIds(row: {
  resourceIds: string | null;
  resourceId: number | null;
}): number[] {
  const ids = parseResourceIds(row.resourceIds);
  if (ids.length > 0) return ids;
  return row.resourceId != null ? [row.resourceId] : [];
}

/** Kaynak adları — seçim sırasında; kayıtta olmayan id sessizce düşer. */
export function resourceNamesOf(
  ids: readonly number[],
  names: ReadonlyMap<number, string>,
): string[] {
  return ids.map((id) => names.get(id)).filter((n): n is string => n != null);
}
