"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CopyIcon, LayoutGridIcon, SaveIcon } from "lucide-react";
import { toast } from "sonner";

import { callAction } from "@/lib/action-client";
import { copyPlanDayLayout, savePlanDayLayout } from "@/actions/plans";
import {
  DAY_COLORS,
  DAY_COLOR_KEYS,
  type DayColorKey,
  type DayLayoutEntry,
} from "@/lib/plan-layout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type LayoutSubject = { id: number; name: string; sectionName: string };
export type LayoutSource = {
  enrollmentId: number;
  studentName: string;
  examCode: string;
};

type Props = {
  enrollmentId: number;
  layout: DayLayoutEntry[];
  subjects: LayoutSubject[];
  /** Düzeni dolu diğer kayıtlar — "başka öğrenciden kopyala". */
  sources: LayoutSource[];
  dayNames: Record<number, string>;
};

/**
 * Haftalık ders düzeni editörü — "Pazartesi = Türkçe + Matematik".
 *
 * Düzen haftaya değil KAYDA aittir: bir kez kurulur, her hafta program
 * kurucusunda iskelet olarak çıkar ve koç yalnız konuları yazar.
 */
export function DayLayoutDialog({
  enrollmentId,
  layout,
  subjects,
  sources,
  dayNames,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DayLayoutEntry[]>(layout);
  const [saving, setSaving] = useState(false);
  const [copyFrom, setCopyFrom] = useState<number>(0);
  const [copying, setCopying] = useState(false);

  const toggleSubject = (day: number, subjectId: number) => {
    setDraft((prev) =>
      prev.map((d) =>
        d.day !== day
          ? d
          : {
              ...d,
              subjectIds: d.subjectIds.includes(subjectId)
                ? d.subjectIds.filter((id) => id !== subjectId)
                : [...d.subjectIds, subjectId],
            },
      ),
    );
  };

  const setColor = (day: number, color: DayColorKey) => {
    setDraft((prev) =>
      prev.map((d) => (d.day !== day ? d : { ...d, color })),
    );
  };

  const save = async () => {
    setSaving(true);
    const res = await callAction(savePlanDayLayout, { enrollmentId, days: draft });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Ders düzeni kaydedildi", {
      description: "Her hafta bu iskelet çıkacak; sen yalnız konuları yaz.",
    });
    setOpen(false);
    router.refresh();
  };

  const copy = async () => {
    if (copyFrom === 0) return;
    setCopying(true);
    const res = await callAction(copyPlanDayLayout, {
      enrollmentId,
      sourceEnrollmentId: copyFrom,
    });
    setCopying(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Düzen kopyalandı");
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        // Diyalog her açılışta kayıtlı düzenden başlar (yarım kalan taslak yok).
        if (v) setDraft(layout);
        setOpen(v);
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <LayoutGridIcon data-icon="inline-start" />
        Ders düzeni
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Haftalık ders düzeni</DialogTitle>
          <DialogDescription>
            Hangi gün hangi dersler işlenecek? Bir kez kur — her hafta bu iskelet
            çıkar, sen yalnız konuları yazarsın.
          </DialogDescription>
        </DialogHeader>

        {sources.length > 0 && (
          <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-3 sm:flex-row sm:items-end">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Başka öğrenciden kopyala
              </span>
              <Select
                items={[
                  { value: 0, label: "Öğrenci seç…" },
                  ...sources.map((s) => ({
                    value: s.enrollmentId,
                    label: `${s.studentName} · ${s.examCode}`,
                  })),
                ]}
                value={copyFrom}
                onValueChange={(v) => {
                  if (typeof v === "number") setCopyFrom(v);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={0}>Öğrenci seç…</SelectItem>
                  {sources.map((s) => (
                    <SelectItem key={s.enrollmentId} value={s.enrollmentId}>
                      {s.studentName} · {s.examCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copy}
              disabled={copyFrom === 0 || copying}
            >
              <CopyIcon data-icon="inline-start" />
              {copying ? "Kopyalanıyor…" : "Kopyala"}
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {draft.map((d) => {
            const tone = DAY_COLORS[d.color];
            return (
              <section
                key={d.day}
                className={cn("flex flex-col gap-2 rounded-xl p-3 ring-1", tone.card)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className={cn("size-2.5 rounded-full", tone.dot)} />
                    {dayNames[d.day]}
                    <span className="text-xs font-normal text-muted-foreground">
                      {d.subjectIds.length === 0
                        ? "ders yok"
                        : `${d.subjectIds.length} ders`}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    {DAY_COLOR_KEYS.map((key) => (
                      <button
                        key={key}
                        type="button"
                        aria-label={`${dayNames[d.day]} rengi: ${DAY_COLORS[key].label}`}
                        aria-pressed={d.color === key}
                        onClick={() => setColor(d.day, key)}
                        className={cn(
                          "size-5 rounded-full ring-offset-1 ring-offset-background transition-transform",
                          DAY_COLORS[key].dot,
                          d.color === key
                            ? "scale-110 ring-2 ring-foreground/50"
                            : "opacity-50 hover:opacity-100",
                        )}
                      />
                    ))}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {subjects.map((s) => {
                    const on = d.subjectIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleSubject(d.day, s.id)}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                          on
                            ? tone.chip
                            : "bg-background text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground",
                        )}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            <SaveIcon data-icon="inline-start" />
            {saving ? "Kaydediliyor…" : "Düzeni kaydet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
