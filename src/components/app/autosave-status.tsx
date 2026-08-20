"use client";

import { CheckIcon, CircleAlertIcon, LoaderIcon } from "lucide-react";

import type { AutosaveStatus } from "@/components/app/use-question-autosave";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Otomatik kaydın tek görsel karşılığı — eski "Kaydet" düğmesinin yerinde durur.
 *
 * Başarıda toast ÇIKMAZ: her hücrede bildirim balonu ekranı boğardı. Sessiz
 * başarı + satır içi işaret, `resource-question-logger`'daki mevcut sözleşmenin
 * aynısı. Toast yalnız hataya ayrılmıştır.
 */
export function AutosaveStatus({
  status,
  onRetry,
  className,
}: {
  status: AutosaveStatus;
  onRetry: () => void;
  className?: string;
}) {
  if (status === "hata") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          <CircleAlertIcon className="size-3.5" aria-hidden />
          Kaydedilemedi
        </span>
        <Button size="sm" variant="outline" onClick={onRetry}>
          Tekrar dene
        </Button>
      </div>
    );
  }

  const busy = status === "bekliyor" || status === "kaydediliyor";

  return (
    <span
      aria-live="polite"
      className={cn(
        "flex items-center gap-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      {busy && (
        <>
          <LoaderIcon className="size-3.5 animate-spin" aria-hidden />
          Kaydediliyor…
        </>
      )}
      {status === "kaydedildi" && (
        <>
          <CheckIcon className="size-3.5 text-success" aria-hidden />
          Kaydedildi
        </>
      )}
      {status === "hazir" && "Girdiklerin kendiliğinden kaydedilir"}
    </span>
  );
}
