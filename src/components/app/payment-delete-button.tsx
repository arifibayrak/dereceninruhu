"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { callAction } from "@/lib/action-client";
import { deletePayment } from "@/actions/muhasebe";
import { Button } from "@/components/ui/button";

/** Yanlış girilen ödemeyi siler (onaylı); bağlı fatura yeniden hesaplanır. */
export function PaymentDeleteButton({ paymentId }: { paymentId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const remove = () => {
    if (!window.confirm("Bu ödeme kaydı silinsin mi?")) return;
    startTransition(async () => {
      const res = await callAction(deletePayment, paymentId);
      if (res.ok) {
        toast.success("Ödeme silindi");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Ödemeyi sil"
      disabled={pending}
      onClick={remove}
      className="text-muted-foreground hover:text-destructive"
    >
      <Trash2Icon />
    </Button>
  );
}
