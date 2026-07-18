import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Son giriş rozeti: bugün/dün nötr, ≥3 gün uyarı, hiç giriş yok kırmızı. */
export function StalenessBadge({
  staleDays,
  className,
}: {
  staleDays: number | null;
  className?: string;
}) {
  if (staleDays === null) {
    return (
      <Badge variant="destructive" className={className}>
        Hiç giriş yok
      </Badge>
    );
  }
  if (staleDays <= 0) {
    return (
      <Badge className={cn("bg-success/10 text-success", className)}>
        Bugün
      </Badge>
    );
  }
  if (staleDays === 1) {
    return (
      <Badge variant="secondary" className={className}>
        Dün
      </Badge>
    );
  }
  if (staleDays < 3) {
    return (
      <Badge variant="secondary" className={className}>
        {staleDays} gün önce
      </Badge>
    );
  }
  return (
    <Badge className={cn("bg-warning/10 text-warning", className)}>
      {staleDays} gün önce
    </Badge>
  );
}
