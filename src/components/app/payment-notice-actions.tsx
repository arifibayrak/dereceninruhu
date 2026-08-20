"use client";

import { useState } from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { useRefresh } from "@/lib/use-refresh";
import { callAction } from "@/lib/action-client";
import { resolvePaymentNotice } from "@/actions/muhasebe";
import { Button } from "@/components/ui/button";

/**
 * Koç için havale bildirimi kararı: Onayla (→ gerçek ödeme kaydı) ya da Reddet.
 * Onaylarken tutarı değiştirmek istersen reddedip elle "Ödeme al" kullan.
 */
export function PaymentNoticeActions({ noticeId }: { noticeId: number }) {
  const { refresh } = useRefresh();
  const [busy, setBusy] = useState<null | "onayla" | "reddet">(null);

  const run = async (action: "onayla" | "reddet") => {
    setBusy(action);
    const res = await callAction(resolvePaymentNotice, { noticeId, action });
    setBusy(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(
      action === "onayla" ? "Onaylandı — ödeme işlendi." : "Bildirim reddedildi.",
    );
    refresh();
  };

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <Button
        size="xs"
        variant="outline"
        disabled={busy !== null}
        onClick={() => run("reddet")}
      >
        <XIcon data-icon="inline-start" />
        Reddet
      </Button>
      <Button size="xs" disabled={busy !== null} onClick={() => run("onayla")}>
        <CheckIcon data-icon="inline-start" />
        Onayla
      </Button>
    </div>
  );
}
