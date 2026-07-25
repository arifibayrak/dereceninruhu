import Link from "next/link";
import { LockIcon } from "lucide-react";

import { ACTOR_LABEL, type Actor, type Flow } from "@/lib/rehber/akis-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Rol renkleri — akış boyunca kimin sırası olduğu tek bakışta okunsun. */
const ACTOR_STYLE: Record<Actor, { chip: string; node: string }> = {
  ogrenci: {
    chip: "bg-info/12 text-info ring-info/25",
    node: "bg-info/15 text-info ring-info/30",
  },
  koc: {
    chip: "bg-primary/12 text-primary ring-primary/25",
    node: "bg-primary/15 text-primary ring-primary/30",
  },
  yonetici: {
    chip: "bg-gold/15 text-gold ring-gold/30",
    node: "bg-gold/15 text-gold ring-gold/30",
  },
  sistem: {
    chip: "bg-muted text-muted-foreground ring-foreground/10",
    node: "bg-muted text-muted-foreground ring-foreground/15",
  },
};

function ActorChip({ actor }: { actor: Actor }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center rounded-4xl px-2 text-xs font-medium ring-1",
        ACTOR_STYLE[actor].chip,
      )}
    >
      {ACTOR_LABEL[actor]}
    </span>
  );
}

function FlowStepCard({
  step,
  index,
  isLast,
  guideBase,
}: {
  step: Flow["steps"][number];
  index: number;
  isLast: boolean;
  guideBase: string;
}) {
  return (
    <li className="relative flex gap-4 pb-8 last:pb-0">
      {/* Dikey bağlantı çizgisi — adımların tek bir akış olduğunu gösterir. */}
      {!isLast && (
        <span
          aria-hidden
          className="absolute top-9 bottom-0 left-[1.0625rem] w-px bg-border"
        />
      )}

      <span
        aria-hidden
        className={cn(
          "z-10 flex size-[2.125rem] shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums ring-1",
          ACTOR_STYLE[step.actor].node,
        )}
      >
        {index + 1}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <ActorChip actor={step.actor} />
          <h3 className="font-heading text-base font-medium text-balance">
            {step.title}
          </h3>
        </div>

        <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
          {step.summary}
        </p>

        {step.buttons && step.buttons.length > 0 && (
          <ul className="flex flex-col gap-1.5 rounded-xl bg-card px-3 py-2.5 ring-1 ring-foreground/10">
            {step.buttons.map((b) => (
              <li key={b.label} className="flex flex-wrap items-baseline gap-2">
                <span className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[0.72rem] font-medium text-secondary-foreground">
                  {b.label}
                </span>
                <span className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground">
                  {b.does}
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="text-sm text-pretty">
          <span className="text-muted-foreground">Sonuç: </span>
          {step.outcome}
        </p>

        {step.gate && (
          <p className="flex gap-2 rounded-xl bg-warning/10 px-3 py-2 text-sm leading-relaxed text-pretty ring-1 ring-warning/30">
            <LockIcon aria-hidden className="mt-0.5 size-3.5 shrink-0 text-warning" />
            <span>
              <span className="font-semibold text-warning">Devir noktası: </span>
              {step.gate}
            </span>
          </p>
        )}

        <div className="flex flex-wrap gap-1">
          {step.where && (
            <Button
              variant="ghost"
              size="xs"
              className="text-primary"
              render={<Link href={step.where} />}
            >
              Ekrana git
            </Button>
          )}
          {step.section && (
            <Button
              variant="ghost"
              size="xs"
              className="text-muted-foreground"
              render={<Link href={`${guideBase}#bolum-${step.section}`} />}
            >
              Rehberde oku
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

export function FlowWalkthrough({
  flows,
  guideBase,
}: {
  flows: Flow[];
  /** İlgili rehberin kökü — "Rehberde oku" bağlantıları buna göre kurulur. */
  guideBase: string;
}) {
  return (
    <div className="flex flex-col gap-12">
      {flows.map((flow, i) => (
        <section
          key={flow.id}
          id={`akis-${flow.id}`}
          className="flex scroll-mt-32 flex-col gap-4"
        >
          <header className="flex flex-col gap-1.5">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
              <span aria-hidden className="size-1.5 rounded-full bg-gold" />
              <span className="tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-muted-foreground/70">{flow.cadence}</span>
            </span>
            <h2 className="font-heading text-title text-balance">
              {flow.title}
            </h2>
            <p className="max-w-prose text-sm text-pretty text-muted-foreground md:text-base">
              {flow.description}
            </p>
          </header>

          <ol className="flex flex-col">
            {flow.steps.map((step, j) => (
              <FlowStepCard
                key={step.id}
                step={step}
                index={j}
                isLast={j === flow.steps.length - 1}
                guideBase={guideBase}
              />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

/** Akışların üstünde duran kısa rol açıklaması. */
export function ActorLegend() {
  const actors: Actor[] = ["ogrenci", "koc", "yonetici", "sistem"];
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      <span className="text-xs font-medium text-muted-foreground">
        Adımı kim yapar:
      </span>
      {actors.map((a) => (
        <ActorChip key={a} actor={a} />
      ))}
    </div>
  );
}
