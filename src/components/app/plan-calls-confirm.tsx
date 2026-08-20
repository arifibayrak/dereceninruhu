"use client";

import { useState } from "react";
import { CalendarCheckIcon, CheckCircle2Icon } from "lucide-react";
import { toast } from "sonner";

import { useRefresh } from "@/lib/use-refresh";
import { callAction } from "@/lib/action-client";
import { markCallsScheduled } from "@/actions/gorusme";
import { Button } from "@/components/ui/button";

/**
 * "Görüşmemi planladım" onayı. Gömülü takvimde saat seçtikten sonra öğrenci
 * onaylar → `markCallsScheduled` çağrılır, gerekli-adım nudge'ı kapanır. Zaten
 * planlanmışsa sakin bir "Planlandı ✓" durumu gösterir (yeniden planlama serbest).
 */
export function PlanCallsConfirm({ planned }: { planned: boolean }) {
  const { refresh } = useRefresh();
  const [submitting, setSubmitting] = useState(false);

  if (planned) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-success/10 p-3.5 text-sm text-success">
        <CheckCircle2Icon className="size-4 shrink-0" />
        <span>
          Planlandı ✓ — dilediğinde yukarıdaki takvimden yeniden
          planlayabilirsin.
        </span>
      </div>
    );
  }

  const onConfirm = async () => {
    setSubmitting(true);
    const res = await callAction(markCallsScheduled);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Görüşmen planlandı olarak işaretlendi");
    refresh();
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-muted/60 p-3.5">
      <p className="text-sm text-muted-foreground">
        Takvimden görüşme saatini seçtikten sonra buradan onayla — böylece
        planladığını biliriz.
      </p>
      <Button onClick={onConfirm} disabled={submitting} className="self-start">
        <CalendarCheckIcon data-icon="inline-start" />
        {submitting ? "Kaydediliyor…" : "Görüşmemi planladım"}
      </Button>
    </div>
  );
}
