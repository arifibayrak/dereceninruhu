"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";

import { callAction } from "@/lib/action-client";
import { updateInvoiceStatus, voidInvoice } from "@/actions/muhasebe";
import {
  INVOICE_STATUS_LABELS,
  type InvoiceStatus,
} from "@/lib/muhasebe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** Durum rozeti — renkleri tek yerden. */
export function InvoiceStatusBadge({
  status,
  isOverdue,
}: {
  status: InvoiceStatus;
  isOverdue?: boolean;
}) {
  const effective: InvoiceStatus =
    isOverdue && status !== "ödendi" && status !== "iptal" ? "gecikmiş" : status;
  return (
    <Badge
      variant="outline"
      className={cn(
        effective === "ödendi" && "border-transparent bg-success/10 text-success",
        effective === "gecikmiş" &&
          "border-transparent bg-destructive/10 text-destructive",
        effective === "gönderildi" &&
          "border-transparent bg-secondary text-secondary-foreground",
        effective === "taslak" && "border-transparent bg-warning/10 text-warning",
        effective === "iptal" && "text-muted-foreground line-through",
      )}
    >
      {INVOICE_STATUS_LABELS[effective]}
    </Badge>
  );
}

const TRANSITIONS: { status: InvoiceStatus; label: string }[] = [
  { status: "gönderildi", label: "Gönderildi işaretle" },
  { status: "ödendi", label: "Ödendi işaretle" },
  { status: "gecikmiş", label: "Gecikmiş işaretle" },
  { status: "taslak", label: "Taslağa çevir" },
];

/** Fatura satırı aksiyon menüsü — durum geçişleri + iptal. */
export function InvoiceStatusMenu({
  invoiceId,
  status,
}: {
  invoiceId: number;
  status: InvoiceStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const setStatus = (next: InvoiceStatus) => {
    startTransition(async () => {
      const res = await callAction(updateInvoiceStatus, { invoiceId, status: next });
      if (res.ok) {
        toast.success(`Fatura ${INVOICE_STATUS_LABELS[next].toLocaleLowerCase("tr")} olarak işaretlendi`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const doVoid = () => {
    startTransition(async () => {
      const res = await callAction(voidInvoice, { invoiceId });
      if (res.ok) {
        toast.success("Fatura iptal edildi");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Fatura işlemleri"
            disabled={pending}
          />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Durum</DropdownMenuLabel>
        {TRANSITIONS.filter((t) => t.status !== status).map((t) => (
          <DropdownMenuItem key={t.status} onClick={() => setStatus(t.status)}>
            {t.label}
          </DropdownMenuItem>
        ))}
        {status !== "iptal" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={doVoid}>
              Faturayı iptal et
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
