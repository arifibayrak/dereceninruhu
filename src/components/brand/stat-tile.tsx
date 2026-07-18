import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const deltaFormat = new Intl.NumberFormat("tr-TR", {
  signDisplay: "exceptZero",
  maximumFractionDigits: 2,
});

type StatTileProps = {
  /** Örn. "Toplam Net" */
  label: string;
  /** Önceden biçimlenmiş değer, örn. "48,75" — TR virgül kullanın. */
  value: string;
  /** Değişim; pozitif = yeşil yukarı, negatif = kırmızı aşağı, 0 = nötr. */
  delta?: number;
  /** Delta ekine küçük birim, örn. " net". */
  deltaSuffix?: string;
  /** Alt açıklama, örn. "Son 4 deneme ortalaması". */
  hint?: string;
  className?: string;
};

/** KPI kutusu — panolarda net/deneme/saat özetleri için. Mobil öncelikli. */
export function StatTile({
  label,
  value,
  delta,
  deltaSuffix = "",
  hint,
  className,
}: StatTileProps) {
  const direction =
    delta === undefined
      ? undefined
      : delta > 0
        ? ("up" as const)
        : delta < 0
          ? ("down" as const)
          : ("flat" as const);

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1.5 rounded-xl bg-card p-4 ring-1 ring-foreground/10",
        className
      )}
    >
      <span className="truncate text-[13px] font-medium text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-heading text-[1.75rem] leading-none font-bold tracking-tight tabular-nums">
          {value}
        </span>
        {direction !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums",
              direction === "up" && "bg-success/10 text-success",
              direction === "down" && "bg-destructive/10 text-destructive",
              direction === "flat" && "bg-muted text-muted-foreground"
            )}
          >
            {direction === "up" && <ArrowUpRightIcon className="size-3" />}
            {direction === "down" && <ArrowDownRightIcon className="size-3" />}
            {direction === "flat" && <MinusIcon className="size-3" />}
            {deltaFormat.format(delta ?? 0)}
            {deltaSuffix}
          </span>
        )}
      </div>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}
