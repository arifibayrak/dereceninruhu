import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  /** Küçük üst etiket, örn. "Renk Paleti". */
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        align === "center" && "items-center text-center",
        className
      )}
    >
      {eyebrow && (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-gold" />
          {eyebrow}
        </span>
      )}
      <h2 className="font-heading text-title text-balance">{title}</h2>
      {description && (
        <p className="max-w-prose text-sm text-pretty text-muted-foreground md:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
