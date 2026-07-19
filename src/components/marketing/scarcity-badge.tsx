import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Framing A — "Bu dönem için son N kontenjan". Yalnız kontenjan sayısı (kalan)
 * verildiğinde gösterilir. Sakin, gold vurgulu; agresif değil.
 */
export function ScarcityBadge({
  remaining,
  className,
}: {
  remaining: number;
  className?: string;
}) {
  return (
    <Badge
      className={cn(
        "gap-1.5 bg-gold/15 text-gold-foreground dark:text-gold",
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-gold" />
      Bu dönem için son {remaining} kontenjan
    </Badge>
  );
}
