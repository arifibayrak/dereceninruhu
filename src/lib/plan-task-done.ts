import { useCallback, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { callAction } from "@/lib/action-client";
import { togglePlanTaskDone } from "@/actions/plans";

/*
 * Program görevlerinin iyimser "tamam" durumu — sekme genelinde TEK kaynak.
 *
 * Eskiden her işaretleme `router.refresh()` tetikliyordu: force-dynamic sayfa
 * baştan render edilip ~6 D1 sorgusu sırayla koşuyor, iki ızgara da yeniden
 * kuruluyordu ("program çok kasıyor"). Artık işaretleme yalnız action'ı çağırır;
 * yeni durum burada tutulur. Hafta (ızgara) ve Gün (liste) görünümleri aynı
 * deposu okuduğundan görünüm değiştirince işaretler kaybolmaz.
 */
const overrides = new Map<number, boolean>();
const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version++;
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function set(taskId: number, isDone: boolean) {
  overrides.set(taskId, isDone);
  emit();
}

/** Görevi işaretler / geri alır; hata olursa eski hâline döner. */
export async function setPlanTaskDone(taskId: number, isDone: boolean) {
  set(taskId, isDone);
  const res = await callAction(togglePlanTaskDone, { taskId, isDone });
  if (!res.ok) {
    set(taskId, !isDone);
    toast.error(res.error);
  }
}

/** `doneOf(id, sunucuDeğeri)` — yerel işaret varsa o, yoksa sunucudaki değer. */
export function usePlanTaskDone() {
  const v = useSyncExternalStore(
    subscribe,
    () => version,
    () => 0,
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `v` değişince yeni fonksiyon: tüketiciler yeniden hesaplasın.
  return useCallback((taskId: number, serverDone: boolean) => overrides.get(taskId) ?? serverDone, [v]);
}
