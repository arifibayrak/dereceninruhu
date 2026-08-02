"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDaysIcon, QuoteIcon, SendIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { callAction } from "@/lib/action-client";
import { submitPlanForReview } from "@/actions/plans";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CoachNote } from "@/components/app/coach-note";
import { PlanAiDraft } from "@/components/app/plan-ai-draft";
import {
  ProgramChecklist,
  type ChecklistDay,
} from "@/components/app/plan-checklist";
import {
  ProgramGrid,
  type GridDay,
  type GridResource,
  type GridSubject,
  type GridTask,
} from "@/components/app/program-grid";

type Status = "none" | "draft-own" | "published";
type View = "hafta" | "gun";

type Props = {
  enrollmentId: number;
  weekKey: string;
  status: Status;
  /** Öğrenci bu hafta için program oluşturabilir mi (bu/gelecek hafta). */
  canAuthor: boolean;
  planId: number | null;
  studentSubmitted: boolean;
  motto: string | null;
  coachNote: string | null;
  subjects: GridSubject[];
  resources: GridResource[];
  gridDays: GridDay[];
  gridTasks: GridTask[];
  checklistDays: ChecklistDay[];
  todayDay: number | null;
};

function ViewToggle({
  view,
  onChange,
}: {
  view: View;
  onChange: (v: View) => void;
}) {
  const items: { value: View; label: string }[] = [
    { value: "hafta", label: "Hafta · ders" },
    { value: "gun", label: "Gün" },
  ];
  return (
    <div className="inline-flex rounded-full bg-muted p-0.5">
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onChange(it.value)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            view === it.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function MottoBanner({ motto }: { motto: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-primary p-5 text-primary-foreground">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase opacity-85">
        <QuoteIcon className="size-3.5" aria-hidden />
        Haftanın mottosu
      </span>
      <p className="font-heading text-lg font-semibold text-balance">{motto}</p>
    </div>
  );
}

/**
 * Öğrenci haftalık programı. Yayınlanmış planı ders (hafta) ya da gün
 * görünümünde işaretler; kendi taslağını ders × konu ızgarasında düzenleyip
 * koça gönderir. Koç notu programdan ayrı, stratejik bir panelde en üstte.
 */
export function StudentProgram({
  enrollmentId,
  weekKey,
  status,
  canAuthor,
  planId,
  studentSubmitted,
  motto,
  coachNote,
  subjects,
  resources,
  gridDays,
  gridTasks,
  checklistDays,
  todayDay,
}: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>("hafta");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!planId) return;
    setSubmitting(true);
    const res = await callAction(submitPlanForReview, { planId });
    setSubmitting(false);
    if (res.ok) {
      toast.success("Programın koçuna gönderildi", {
        description: "Koçun inceleyip onaylayınca işaretleyebilirsin.",
      });
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  /* -- Kendi taslağı: ders × konu ızgarasında düzenle + koça gönder -- */
  if (status === "draft-own") {
    return (
      <>
        {motto && <MottoBanner motto={motto} />}
        <div className="flex flex-col gap-1.5 rounded-xl bg-info/10 p-3.5 text-sm text-info">
          <span className="font-semibold">Bu senin taslağın</span>
          <span className="text-info/80">
            {studentSubmitted
              ? "Koçuna gönderildi — inceleyip onaylayacak."
              : "Konularını düzenle, hazır olunca koçuna gönder."}
          </span>
        </div>
        <div className="flex justify-end">
          <PlanAiDraft
            enrollmentId={enrollmentId}
            weekKey={weekKey}
            subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
            label="AI ile konu öner"
          />
        </div>
        <ProgramGrid
          enrollmentId={enrollmentId}
          weekKey={weekKey}
          subjects={subjects}
          resources={resources}
          days={gridDays}
          tasks={gridTasks}
          mode="edit"
        />
        <Button
          onClick={submit}
          disabled={submitting || gridTasks.length === 0}
          className="self-end"
        >
          <SendIcon data-icon="inline-start" />
          {submitting
            ? "Gönderiliyor…"
            : studentSubmitted
              ? "Tekrar gönder"
              : "Koça gönder"}
        </Button>
      </>
    );
  }

  /* -- Yayınlanmış plan: işaretle (hafta ya da gün) -- */
  if (status === "published") {
    return (
      <>
        {motto && <MottoBanner motto={motto} />}
        {coachNote && <CoachNote note={coachNote} />}
        <div className="flex items-center justify-between gap-2">
          <ViewToggle view={view} onChange={setView} />
        </div>
        {view === "hafta" ? (
          <ProgramGrid
            enrollmentId={enrollmentId}
            weekKey={weekKey}
            subjects={subjects}
            resources={resources}
            days={gridDays}
            tasks={gridTasks}
            mode="check"
          />
        ) : (
          <ProgramChecklist days={checklistDays} todayDay={todayDay} />
        )}
      </>
    );
  }

  /* -- Plan yok -- */
  if (canAuthor) {
    return (
      <>
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-10 text-center ring-1 ring-foreground/10">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/10">
            <SparklesIcon className="size-5 text-primary" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-heading text-lg font-semibold">
              Kendi programını oluştur
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Konularını aşağıdan ekle; hazır olunca koçuna gönder. Koçun da bu
              hafta için bir program paylaşabilir.
            </p>
          </div>
          <PlanAiDraft
            enrollmentId={enrollmentId}
            weekKey={weekKey}
            subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
            label="AI ile program oluştur"
            variant="default"
          />
        </div>
        <ProgramGrid
          enrollmentId={enrollmentId}
          weekKey={weekKey}
          subjects={subjects}
          resources={resources}
          days={gridDays}
          tasks={gridTasks}
          mode="edit"
        />
      </>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-14 text-center ring-1 ring-foreground/10">
      <span className="flex size-11 items-center justify-center rounded-full bg-primary/10">
        <CalendarDaysIcon className="size-5 text-primary" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-heading text-lg font-semibold">
          Program henüz hazır değil
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Koçun bu haftanın programını henüz paylaşmadı. Hazır olduğunda burada
          görünecek.
        </p>
      </div>
    </div>
  );
}
