import Link from "next/link";
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  InfoIcon,
  LightbulbIcon,
  TriangleAlertIcon,
} from "lucide-react";

import type { Block } from "@/lib/rehber/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/* Blok bileşenleri — hepsi server component, sıfır JS.                 */
/* ------------------------------------------------------------------ */

function BlockTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
      {children}
    </h4>
  );
}

function Steps({ title, items }: { title?: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {title && <BlockTitle>{title}</BlockTitle>}
      <ol className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3">
            <span
              aria-hidden
              className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold tabular-nums text-secondary-foreground"
            >
              {i + 1}
            </span>
            <span className="text-sm leading-relaxed text-pretty text-muted-foreground">
              {item}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Buton referansı — rehberin çekirdeği.
 * Mobilde üst üste, sm+ ekranda iki sütun okunur.
 */
function Buttons({
  title,
  rows,
}: {
  title?: string;
  rows: { label: string; where: string; does: string }[];
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <BlockTitle>{title ?? "Butonlar ve kontroller"}</BlockTitle>
      {/*
        İki sütuna geçiş kabın genişliğine bakar, ekranınkine değil: öğrenci
        kabuğu masaüstünde bile `max-w-lg` (512px) olduğu için viewport `sm:`
        kullanılsaydı dar sütunda sıkışık bir tablo çıkardı.
      */}
      <div className="@container flex flex-col divide-y rounded-2xl bg-card ring-1 ring-foreground/10">
        {rows.map((row, i) => (
          <div
            key={i}
            className="grid gap-1.5 px-4 py-3 @xl:grid-cols-[minmax(10rem,14rem)_1fr] @xl:gap-5"
          >
            <div className="flex flex-col gap-1">
              <span className="w-fit rounded-md bg-secondary px-2 py-0.5 font-mono text-[0.72rem] leading-5 font-medium text-secondary-foreground">
                {row.label}
              </span>
              <span className="text-[11px] leading-tight text-muted-foreground/80">
                {row.where}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
              {row.does}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataTable({
  title,
  head,
  rows,
}: {
  title?: string;
  head: string[];
  rows: string[][];
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {title && <BlockTitle>{title}</BlockTitle>}
      <div className="overflow-x-auto rounded-2xl bg-card ring-1 ring-foreground/10">
        <table className="w-full min-w-[28rem] text-sm">
          <thead>
            <tr className="border-b text-left">
              {head.map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={cn(
                      "px-4 py-2.5 align-top text-pretty",
                      j === 0
                        ? "font-medium text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const CALLOUT = {
  tip: {
    icon: LightbulbIcon,
    cls: "bg-success/8 text-success ring-success/25",
    label: "İpucu",
  },
  warning: {
    icon: TriangleAlertIcon,
    cls: "bg-warning/10 text-warning ring-warning/30",
    label: "Dikkat",
  },
  note: {
    icon: InfoIcon,
    cls: "bg-info/8 text-info ring-info/25",
    label: "Not",
  },
} as const;

function Callout({
  kind,
  text,
}: {
  kind: "tip" | "warning" | "note";
  text: string;
}) {
  const { icon: Icon, cls, label } = CALLOUT[kind];
  return (
    <div className={cn("flex gap-3 rounded-2xl px-4 py-3 ring-1", cls)}>
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <p className="text-sm leading-relaxed text-pretty text-foreground">
        <span className="font-semibold">{label}: </span>
        {text}
      </p>
    </div>
  );
}

function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="flex flex-col divide-y rounded-2xl bg-card ring-1 ring-foreground/10">
      {items.map((item) => (
        <details key={item.q} className="group px-4 py-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium select-none [&::-webkit-details-marker]:hidden">
            <span className="text-pretty">{item.q}</span>
            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <p className="pt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}

export function GuideBlock({ block }: { block: Block }) {
  switch (block.kind) {
    case "para":
      return (
        <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
          {block.text}
        </p>
      );
    case "steps":
      return <Steps title={block.title} items={block.items} />;
    case "buttons":
      return <Buttons title={block.title} rows={block.rows} />;
    case "table":
      return (
        <DataTable title={block.title} head={block.head} rows={block.rows} />
      );
    case "tip":
    case "warning":
    case "note":
      return <Callout kind={block.kind} text={block.text} />;
    case "faq":
      return <Faq items={block.items} />;
    case "link":
      return (
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          render={
            block.external ? (
              <a href={block.href} target="_blank" rel="noreferrer" />
            ) : (
              <Link href={block.href} />
            )
          }
        >
          {block.label}
          <ArrowUpRightIcon data-icon="inline-end" />
        </Button>
      );
  }
}
