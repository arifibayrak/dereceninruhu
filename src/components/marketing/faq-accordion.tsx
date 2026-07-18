import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * SSS akordeonu — native <details>/<summary>: sıfır JS, erişilebilir,
 * server component. Chevron group-open ile döner.
 */
export function FaqAccordion({
  items,
  className,
}: {
  items: { question: string; answer: string }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col divide-y rounded-2xl bg-card ring-1 ring-foreground/10",
        className,
      )}
    >
      {items.map((item) => (
        <details key={item.question} className="group px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium select-none [&::-webkit-details-marker]:hidden">
            <span className="text-pretty">{item.question}</span>
            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <p className="pt-2.5 text-sm leading-relaxed text-pretty text-muted-foreground">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
