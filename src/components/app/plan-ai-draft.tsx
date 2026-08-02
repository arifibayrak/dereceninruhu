"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { callAction } from "@/lib/action-client";
import { addPlanTasks, upsertWeeklyPlan } from "@/actions/plans";
import { generatePlanDraft } from "@/actions/plan-ai";
import type { ProgramDraft } from "@/lib/ai/plan-generate";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const SHORT_DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

type Props = {
  enrollmentId: number;
  /** Haftanın pazartesisi, yyyy-mm-dd. */
  weekKey: string;
  /** Koç bir öğrenci için üretiyorsa dolu; öğrenci kendisi için üretiyorsa yok. */
  studentId?: number;
  subjects: { id: number; name: string }[];
  /** Buton etiketi (varsayılan "AI ile oluştur"). */
  label?: string;
  variant?: "default" | "outline";
};

/**
 * AI ile haftalık program taslağı üret → gözden geçir → onayla. Onaya kadar
 * hiçbir şey yazılmaz; onaylanınca konular normal `addPlanTask` yoluyla eklenir
 * (koç için taslak, öğrenci için "öğrenci önerisi" taslağı).
 */
export function PlanAiDraft({
  enrollmentId,
  weekKey,
  studentId,
  subjects,
  label = "AI ile oluştur",
  variant = "outline",
}: Props) {
  const router = useRouter();
  const isCoach = studentId != null;
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState("");
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [draft, setDraft] = useState<ProgramDraft | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const subjectName = (id: number | null) =>
    id == null ? "Genel" : (subjects.find((s) => s.id === id)?.name ?? "Genel");

  const reset = () => {
    setDraft(null);
    setSelected(new Set());
    setFocus("");
  };

  const generate = async () => {
    setLoading(true);
    const res = await callAction(generatePlanDraft, {
      studentId,
      weekStart: weekKey,
      focus,
    });
    setLoading(false);
    if (res.ok) {
      setDraft(res.data);
      setSelected(new Set(res.data.topics.map((_, i) => i)));
    } else {
      toast.error(res.error);
    }
  };

  const toggle = (i: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const apply = async () => {
    if (!draft) return;
    const picked = draft.topics.filter((_, i) => selected.has(i));
    if (picked.length === 0) {
      toast.error("En az bir konu seç.");
      return;
    }
    setApplying(true);
    // Motto/not (koç notu yalnız koç önerisinde yazılır).
    if (draft.motto || (isCoach && draft.note)) {
      await callAction(upsertWeeklyPlan, {
        enrollmentId,
        weekStart: weekKey,
        motto: draft.motto ?? "",
        coachNote: isCoach ? (draft.note ?? "") : "",
      });
    }
    // Konular TEK istekte yazılır — görev başına ayrı çağrı, 40 konuluk bir
    // taslakta dakikalarca süren (ve ortasında kopabilen) bir kuyruk demekti.
    const res = await callAction(addPlanTasks, {
      enrollmentId,
      weekStart: weekKey,
      tasks: picked.map((t) => ({
        day: t.day,
        subjectId: t.subjectId,
        resourceIds: [],
        description: t.description,
        targetQuestions: t.targetQuestions,
      })),
    });
    setApplying(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    const added = res.data.added;
    toast.success(`${added} konu eklendi`, {
      description: isCoach
        ? "Taslak hazır — düzenleyip yayınlayabilirsin."
        : "Taslağın hazır — düzenleyip koçuna gönderebilirsin.",
    });
    setOpen(false);
    reset();
    router.refresh();
  };

  return (
    <>
      <Button variant={variant} size="sm" onClick={() => setOpen(true)}>
        <SparklesIcon data-icon="inline-start" />
        {label}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>AI ile program oluştur</DialogTitle>
            <DialogDescription>
              {isCoach
                ? "Öğrencinin verisine göre bir taslak öneririm. Sen onaylayana kadar hiçbir şey yazılmaz."
                : "Verine göre bir taslak öneririm. Onayladıklarını kendi taslağına eklersin."}
            </DialogDescription>
          </DialogHeader>

          {!draft ? (
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="ai-focus">
                  Odak (opsiyonel)
                </FieldLabel>
                <Input
                  id="ai-focus"
                  placeholder="Örn. Bu hafta matematik ve paragraf ağırlıklı"
                  value={focus}
                  maxLength={200}
                  onChange={(e) => setFocus(e.target.value)}
                />
              </Field>
              <Button
                onClick={generate}
                disabled={loading}
                className="self-end"
              >
                <SparklesIcon data-icon="inline-start" />
                {loading ? "Hazırlanıyor…" : "Taslak öner"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {(draft.motto || draft.note) && (
                <div className="flex flex-col gap-1 rounded-xl bg-muted/50 p-3 text-sm">
                  {draft.motto && (
                    <p className="font-medium">“{draft.motto}”</p>
                  )}
                  {draft.note && (
                    <p className="text-muted-foreground">{draft.note}</p>
                  )}
                </div>
              )}
              <div className="flex flex-col gap-2">
                {draft.topics.map((t, i) => (
                  <label
                    key={i}
                    className={cn(
                      "flex items-start gap-2 rounded-lg bg-muted/50 p-2.5",
                      !selected.has(i) && "opacity-50",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 size-4 shrink-0 accent-primary"
                      checked={selected.has(i)}
                      onChange={() => toggle(i)}
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[11px] font-semibold text-primary">
                        {subjectName(t.subjectId)}
                      </span>
                      <span className="text-sm break-words">
                        {t.description}
                      </span>
                      {(t.day != null || t.targetQuestions != null) && (
                        <span className="text-[11px] text-muted-foreground">
                          {[
                            t.day != null ? SHORT_DAYS[t.day - 1] : null,
                            t.targetQuestions != null
                              ? `${t.targetQuestions} soru`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3">
                <Button variant="ghost" size="sm" onClick={reset}>
                  Yeniden öner
                </Button>
                <Button
                  onClick={apply}
                  disabled={applying || selected.size === 0}
                >
                  {applying ? "Ekleniyor…" : `${selected.size} konuyu ekle`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
