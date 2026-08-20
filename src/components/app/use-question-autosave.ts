"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { upsertQuestionLogs } from "@/actions/tracking";
import { callAction } from "@/lib/action-client";

/** Sunucuya gönderilen tek hücre — `upsertQuestionLogs` girdisiyle birebir. */
export type AutosaveEntry = {
  subjectId: number;
  questionCount: number;
  correctCount: number | null;
  wrongCount: number | null;
  blankCount: number | null;
};

export type AutosaveStatus =
  | "hazir"
  | "bekliyor"
  | "kaydediliyor"
  | "kaydedildi"
  | "hata";

/**
 * Aynı güne art arda gelen dokunuşlar tek istekte birleşsin diye. 250 ms,
 * "+5'e üç kez bas" hareketini tek tura indirecek kadar uzun, kullanıcının
 * bekleme hissedemeyeceği kadar kısa.
 */
const DEBOUNCE_MS = 250;

/** Başarılı kayıttan sonra sayfa verisini tazeleme gecikmesi (yalnız istenirse). */
const REFRESH_MS = 1500;

/** dayKey → (subjectId → hücre). Aynı hücre tekrar yazılırsa sonuncusu kalır. */
type Pending = Map<string, Map<number, AutosaveEntry>>;

function mergeInto(target: Pending, dayKey: string, entries: AutosaveEntry[]) {
  let day = target.get(dayKey);
  if (!day) {
    day = new Map();
    target.set(dayKey, day);
  }
  for (const e of entries) day.set(e.subjectId, e);
}

/**
 * Soru girişi otomatik kaydı — ayrı "Kaydet" düğmesinin yerine geçer.
 *
 * NEDEN: öğrenci sayıyı girip panelin onay tuşuna basıyor, kaydettiğini sanıyor,
 * ama ızgaranın altındaki "Kaydet"e basmadığı için gün kayboluyordu. Artık her
 * hücre kendi başına yazılır.
 *
 * Güvenli, çünkü `upsertQuestionLogs` gerçek bir UPSERT: benzersiz anahtar
 * (enrollment_id, log_date, subject_id) — aynı hücre kaç kez gönderilirse
 * gönderilsin satır çoğalmaz.
 *
 * Otomatik yeniden deneme YOK (bkz. `callAction`): patlayan istek sunucuya
 * ulaşmış olabilir. Hata kullanıcıya gösterilir, tekrar denemek onun kararıdır.
 */
export function useQuestionAutosave({
  enrollmentId,
  /** Kayıt sonrası sayfa verisini tazele — yalnız türetilmiş kart/özet gösteren
   *  sayfalarda aç (ör. /ogrenci). Izgara kendi durumunu taşıdığı için orada
   *  gereksiz ve `force-dynamic` kabuğu boşuna yeniden çalıştırır. */
  refreshAfterSave = false,
}: {
  enrollmentId: number;
  refreshAfterSave?: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [status, setStatus] = useState<AutosaveStatus>("hazir");

  const pending = useRef<Pending>(new Map());
  const failed = useRef<Pending>(new Map());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  /** `flush` kendini çağırabilsin diye (tanımlanmadan önce erişilemez). */
  const flushRef = useRef<(() => Promise<void>) | null>(null);

  const scheduleRefresh = useCallback(() => {
    if (!refreshAfterSave) return;
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      startTransition(() => router.refresh());
    }, REFRESH_MS);
  }, [refreshAfterSave, router]);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    // Uçuştaki istek bitince kendisi tekrar tetikliyor; burada sıraya girme.
    if (inFlight.current) return;
    const batch = pending.current;
    if (batch.size === 0) return;
    pending.current = new Map();
    inFlight.current = true;
    setStatus("kaydediliyor");

    // Gün başına TEK istek (AGENTS.md: N satır = tek action çağrısı).
    const results = await Promise.all(
      [...batch.entries()].map(async ([dayKey, cells]) => {
        const entries = [...cells.values()];
        const res = await callAction(upsertQuestionLogs, {
          enrollmentId,
          logDate: dayKey,
          entries,
        });
        return { dayKey, entries, error: res.ok ? null : res.error };
      }),
    );
    inFlight.current = false;

    const firstError = results.find((r) => r.error !== null)?.error ?? null;
    if (firstError) {
      for (const r of results) {
        if (r.error !== null) mergeInto(failed.current, r.dayKey, r.entries);
      }
      setStatus("hata");
      toast.error(firstError);
      return;
    }

    if (pending.current.size > 0) {
      // Kayıt sürerken yeni dokunuş geldi — hemen ikinci turu çalıştır.
      void flushRef.current?.();
      return;
    }
    setStatus("kaydedildi");
    scheduleRefresh();
  }, [enrollmentId, scheduleRefresh]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  /** Bir ya da birden çok hücreyi kayıt kuyruğuna al. */
  const queue = useCallback(
    (dayKey: string, entries: AutosaveEntry[]) => {
      if (entries.length === 0) return;
      mergeInto(pending.current, dayKey, entries);
      setStatus("bekliyor");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    },
    [flush],
  );

  /** Başarısız kaydı yeniden dene — kullanıcı tetikler, kendiliğinden olmaz. */
  const retry = useCallback(() => {
    if (failed.current.size === 0) return;
    for (const [dayKey, cells] of failed.current) {
      mergeInto(pending.current, dayKey, [...cells.values()]);
    }
    failed.current = new Map();
    setStatus("bekliyor");
    void flush();
  }, [flush]);

  /*
   * Güvenlik ağı: sekme arka plana atılır ya da sayfa kapanırsa bekleyen
   * 250 ms'lik kuyruk yanmasın. Server Action `sendBeacon` ile gönderilemez;
   * yapılabilecek en iyi şey bekleme süresini beklemeden isteği başlatmak.
   */
  useEffect(() => {
    const onHide = () => {
      if (pending.current.size > 0) void flush();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onHide();
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
      if (timer.current) clearTimeout(timer.current);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [flush]);

  return { status, queue, retry };
}
