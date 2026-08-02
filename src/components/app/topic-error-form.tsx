"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SaveIcon } from "lucide-react";
import { toast } from "sonner";

import { callAction } from "@/lib/action-client";
import { upsertTopicErrors } from "@/actions/analiz";
import { formatInt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TopicGroupInput = {
  subjectId: number;
  subjectName: string;
  sectionName: string;
  topics: { id: number; name: string }[];
};

/**
 * Deneme analizi girişi — ders ders konu listesi, her konuya "eksik" sayısı.
 * Eksik = o konudan kaçırılan soru (yanlış + boş). 0 girmek satırı siler.
 */
export function TopicErrorForm({
  mockExamId,
  groups,
  initial,
  onSavedHref,
}: {
  mockExamId: number;
  groups: TopicGroupInput[];
  /** topicId → mevcut errorCount. */
  initial: Record<number, number>;
  /** Kayıttan sonra dönülecek sayfa (koç kokpiti / öğrenci denemeleri). */
  onSavedHref?: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<number, string>>(() => {
    const out: Record<number, string> = {};
    for (const [k, v] of Object.entries(initial)) out[Number(k)] = String(v);
    return out;
  });

  const numAt = (topicId: number): number => {
    const raw = values[topicId];
    if (raw === undefined) return initial[topicId] ?? 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  };

  const dirty = useMemo(() => {
    return groups.some((g) =>
      g.topics.some((t) => numAt(t.id) !== (initial[t.id] ?? 0)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, groups, initial]);

  const total = groups.reduce(
    (acc, g) => acc + g.topics.reduce((a, t) => a + numAt(t.id), 0),
    0,
  );

  const setCell = (topicId: number, raw: string) => {
    const clean = raw.replace(/\D/g, "").slice(0, 2);
    setValues((prev) => ({ ...prev, [topicId]: clean }));
  };

  const save = async () => {
    // Değişen + dolu satırları gönder (0'a çekilenler silinsin diye dahil).
    const entries: { topicId: number; errorCount: number }[] = [];
    for (const g of groups) {
      for (const t of g.topics) {
        const now = numAt(t.id);
        const before = initial[t.id] ?? 0;
        if (now > 0 || before > 0) entries.push({ topicId: t.id, errorCount: now });
      }
    }
    if (entries.length === 0) {
      toast.info("Girilecek eksik yok.");
      return;
    }
    setSaving(true);
    // Ağ/sunucu hatası da `callAction` içinde ActionResult'a döner — buton
    // "Kaydediliyor…"da asılı kalmaz.
    const res = await callAction(upsertTopicErrors, { mockExamId, entries });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(
      res.data.analysisDone
        ? "Analiz kaydedildi — deneme analizi yapıldı işaretlendi ✅"
        : "Analiz kaydedildi",
    );
    if (onSavedHref) router.push(onSavedHref);
    else router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((g) => {
          const subjectTotal = g.topics.reduce((a, t) => a + numAt(t.id), 0);
          return (
            <div
              key={g.subjectId}
              className="flex flex-col rounded-xl bg-card ring-1 ring-foreground/10"
            >
              <div className="flex items-baseline justify-between gap-2 border-b px-4 py-2.5">
                <div className="flex flex-col leading-tight">
                  <span className="font-heading text-sm font-semibold">
                    {g.subjectName}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {g.sectionName}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-xs font-medium tabular-nums",
                    subjectTotal > 0 ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {subjectTotal > 0 ? `${formatInt(subjectTotal)} eksik` : "—"}
                </span>
              </div>
              <ul className="flex flex-col divide-y">
                {g.topics.map((t) => {
                  const raw =
                    values[t.id] ??
                    (initial[t.id] !== undefined ? String(initial[t.id]) : "");
                  const n = numAt(t.id);
                  return (
                    <li
                      key={t.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-1.5",
                        n > 0 && "bg-destructive/5",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {t.name}
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        aria-label={`${t.name} eksik sayısı`}
                        value={raw}
                        placeholder="·"
                        onChange={(e) => setCell(t.id, e.target.value)}
                        className="h-9 w-12 shrink-0 rounded-md border border-transparent bg-transparent text-center text-sm tabular-nums transition-colors outline-none placeholder:text-muted-foreground/40 hover:border-input focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl bg-background/90 p-3 ring-1 ring-foreground/10 backdrop-blur">
        <span className="text-sm text-muted-foreground">
          Toplam <strong className="text-foreground">{formatInt(total)}</strong>{" "}
          eksik
          {dirty ? " · kaydedilmemiş değişiklik var" : ""}
        </span>
        <Button onClick={save} disabled={saving || !dirty}>
          <SaveIcon data-icon="inline-start" />
          {saving ? "Kaydediliyor…" : "Analizi kaydet"}
        </Button>
      </div>
    </div>
  );
}
