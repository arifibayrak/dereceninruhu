import { StarIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type Testimonial = {
  /** Gizlilik: sitede ad + soyadın ilk harfi, örn. "Merve K." */
  displayName: string;
  /** Genelde "LGS" | "YKS" | "KPSS"; CMS serbest metnine tolerans var. */
  exam: string;
  quote: string;
  /** ISO tarih (örn. "2026-07-09") — "Temmuz 2026" olarak gösterilir. */
  date?: string;
  /** 1–5; varsayılan 5. */
  rating?: number;
};

const monthYear = new Intl.DateTimeFormat("tr-TR", {
  month: "long",
  year: "numeric",
});

/** Sınav rozeti: renk noktada, metin mürekkepte (erişilebilirlik). */
const EXAM_DOT: Record<string, string> = {
  YKS: "bg-chart-1",
  KPSS: "bg-chart-3",
  LGS: "bg-chart-2",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR"))
    .join("");
}

export function TestimonialCard({
  testimonial,
  className,
}: {
  testimonial: Testimonial;
  className?: string;
}) {
  const { displayName, exam, quote, date, rating = 5 } = testimonial;
  const stars = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <figure
      className={cn(
        "flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10",
        className
      )}
    >
      <div className="flex items-center gap-1" aria-label={`${stars} yıldız`}>
        {Array.from({ length: stars }).map((_, i) => (
          <StarIcon key={i} className="size-3.5 fill-gold text-gold" />
        ))}
      </div>
      <blockquote className="text-sm leading-relaxed text-pretty text-foreground">
        “{quote}”
      </blockquote>
      <figcaption className="mt-auto flex items-center gap-3 pt-1">
        <Avatar className="size-8">
          <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
            {initials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{displayName}</span>
          {date && (
            <span className="text-xs text-muted-foreground">
              {monthYear.format(new Date(date))}
            </span>
          )}
        </div>
        <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          <span
            aria-hidden
            className={cn(
              "size-1.5 rounded-full",
              EXAM_DOT[exam] ?? "bg-muted-foreground",
            )}
          />
          {exam}
        </span>
      </figcaption>
    </figure>
  );
}
