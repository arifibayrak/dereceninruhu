"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";

import { callAction } from "@/lib/action-client";
import { runBillingNow } from "@/actions/muhasebe";
import { Button } from "@/components/ui/button";

/**
 * Yönetici — vadesi gelen otomatik faturaları elle üretir. Cron da aynı motoru
 * çağırır; idempotent olduğu için elle + zamanlanmış tetik çakışmaz.
 */
export function BillingRunButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    const res = await callAction(runBillingNow);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    const { invoicesCreated, plansProcessed } = res.data;
    toast.success(
      invoicesCreated > 0
        ? `${invoicesCreated} otomatik fatura kesildi (${plansProcessed} plan).`
        : "Vadesi gelen fatura yok — her şey güncel.",
    );
    router.refresh();
  };

  return (
    <Button variant="outline" size="sm" disabled={busy} onClick={run}>
      <RefreshCwIcon data-icon="inline-start" />
      {busy ? "Çalışıyor…" : "Otomatik faturalar"}
    </Button>
  );
}
