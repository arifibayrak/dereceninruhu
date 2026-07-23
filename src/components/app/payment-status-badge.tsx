import type { RosterPayment } from "@/db/queries/muhasebe";
import { formatKurus } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const dueFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
});

/**
 * Ödeme durumu rozeti (kadro tablosu + kokpit): Ödendi / Gecikmiş / Borç /
 * Plan yok — tutar ve (varsa) vade tarihiyle. Renk kodu StalenessBadge stiliyle.
 */
export function PaymentStatusBadge({
  payment,
  className,
}: {
  payment: RosterPayment | null;
  className?: string;
}) {
  if (!payment) {
    return (
      <Badge
        variant="outline"
        className={cn("text-muted-foreground", className)}
      >
        Plan yok
      </Badge>
    );
  }

  if (payment.isOverdue) {
    return (
      <div className={cn("flex flex-col items-start gap-0.5", className)}>
        <Badge variant="destructive">
          Gecikmiş
          {payment.overdueDays != null ? ` · ${payment.overdueDays} gün` : ""}
        </Badge>
        <span className="text-xs font-medium tabular-nums text-destructive">
          {formatKurus(payment.overdueKurus)}
        </span>
      </div>
    );
  }

  if (payment.outstandingKurus > 0) {
    return (
      <div className={cn("flex flex-col items-start gap-0.5", className)}>
        <Badge className="bg-warning/10 text-warning">Borç</Badge>
        <span className="text-xs tabular-nums text-muted-foreground">
          {formatKurus(payment.outstandingKurus)}
          {payment.nextDueOn ? ` · ${dueFmt.format(payment.nextDueOn)}` : ""}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-start gap-0.5", className)}>
      <Badge className="bg-success/10 text-success">Ödendi</Badge>
      {payment.nextDueOn && (
        <span className="text-xs tabular-nums text-muted-foreground">
          Sonraki: {dueFmt.format(payment.nextDueOn)}
        </span>
      )}
    </div>
  );
}
