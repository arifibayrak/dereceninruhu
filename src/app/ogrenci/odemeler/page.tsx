import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BanknoteIcon, ReceiptTextIcon } from "lucide-react";

import { getEnrollmentDetailByUserId } from "@/db/queries/enrollment";
import {
  getEnrollmentFinance,
  listPaymentNotices,
  type PaymentNoticeRow,
} from "@/db/queries/muhasebe";
import type { InvoiceRow } from "@/db/queries/muhasebe";
import { formatKurus } from "@/lib/format";
import {
  BILLING_TYPE_LABELS,
  INVOICE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_NOTICE_STATUS_LABELS,
  type InvoiceStatus,
  type PaymentNoticeStatus,
} from "@/lib/muhasebe";
import { toOpenInvoiceOption } from "@/lib/muhasebe-view";
import { getCurrentUser, type Role } from "@/lib/session";
import { NoEnrollmentCard } from "@/components/app/no-enrollment";
import { PaymentNoticeDialog } from "@/components/app/payment-notice-dialog";
import { StatTile } from "@/components/brand/stat-tile";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Ödemelerim" };

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
  year: "numeric",
});

function InvoiceStatusBadge({
  status,
  isOverdue,
}: {
  status: InvoiceStatus;
  isOverdue: boolean;
}) {
  const label = isOverdue ? "Gecikmiş" : INVOICE_STATUS_LABELS[status];
  if (status === "ödendi") {
    return (
      <Badge variant="outline" className="border-success/40 text-success">
        Ödendi
      </Badge>
    );
  }
  if (isOverdue || status === "gecikmiş") {
    return <Badge variant="destructive">{label}</Badge>;
  }
  if (status === "iptal") {
    return <Badge variant="secondary">İptal</Badge>;
  }
  return <Badge variant="secondary">{label}</Badge>;
}

const NOTICE_BADGE: Record<PaymentNoticeStatus, { className: string }> = {
  bekliyor: { className: "border-gold/50 text-gold" },
  onaylandı: { className: "border-success/40 text-success" },
  reddedildi: { className: "text-muted-foreground" },
};

function NoticeStatusBadge({ status }: { status: PaymentNoticeStatus }) {
  return (
    <Badge variant="outline" className={NOTICE_BADGE[status].className}>
      {PAYMENT_NOTICE_STATUS_LABELS[status]}
    </Badge>
  );
}

export default async function OgrenciOdemelerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const role = (user as { role?: Role }).role ?? "student";

  const detail = await getEnrollmentDetailByUserId(user.id);
  if (!detail) {
    return <NoEnrollmentCard isCoach={role === "coach" || role === "admin"} />;
  }
  const enrollmentId = detail.enrollment.id;

  const [finance, notices] = await Promise.all([
    getEnrollmentFinance(enrollmentId),
    listPaymentNotices({ enrollmentId, limit: 20 }),
  ]);

  const openInvoices = finance.invoices
    .filter(
      (i: InvoiceRow) =>
        i.status !== "iptal" && i.status !== "ödendi" && i.balanceKurus > 0,
    )
    .map(toOpenInvoiceOption);

  const pendingNotices = notices.filter((n) => n.status === "bekliyor");
  const historyNotices = notices.filter((n) => n.status !== "bekliyor");
  const { activePlan } = finance;

  return (
    <div data-tour="odemeler-bakiye" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-xl font-semibold">Ödemelerim</h1>
          <p className="text-sm text-muted-foreground">
            Bakiyeni gör, gönderdiğin ödemeyi bildir. Onayı koçun verir.
          </p>
        </div>
        <PaymentNoticeDialog
          enrollmentId={enrollmentId}
          openInvoices={openInvoices}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Kalan bakiye"
          value={formatKurus(finance.outstandingKurus)}
          hint="Açık fatura bakiyesi"
        />
        <StatTile
          label="Toplam ödenen"
          value={formatKurus(finance.totalPaidKurus)}
          hint="Bugüne kadar"
        />
      </div>

      {activePlan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {/* Paket bağlıysa "ne için ödüyorum" sorusu burada cevaplanır. */}
              {activePlan.packageName ?? "Ücret planın"}
            </CardTitle>
            <CardDescription>
              {BILLING_TYPE_LABELS[activePlan.billingType]}
              {activePlan.billingType === "paket" && activePlan.periodMonths
                ? ` · ${activePlan.periodMonths} ay`
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold tabular-nums">
              {formatKurus(activePlan.amountKurus)}
            </span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Faturalar</CardTitle>
          <CardDescription>
            Açık faturalar için “Bildir” ile ödemeni haber ver.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {finance.invoices.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
              <ReceiptTextIcon className="size-4 shrink-0" />
              Henüz fatura yok.
            </div>
          ) : (
            <ul className="flex flex-col divide-y">
              {finance.invoices.map((inv) => {
                const canNotify =
                  inv.status !== "iptal" &&
                  inv.status !== "ödendi" &&
                  inv.balanceKurus > 0;
                return (
                  <li
                    key={inv.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium">
                        {inv.periodLabel?.trim() ||
                          dateFmt.format(inv.issuedOn)}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <InvoiceStatusBadge
                          status={inv.status}
                          isOverdue={inv.isOverdue}
                        />
                        {inv.dueOn ? `Vade ${dateFmt.format(inv.dueOn)}` : null}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-semibold tabular-nums">
                        {formatKurus(inv.amountKurus)}
                      </span>
                      {inv.balanceKurus > 0 && inv.status !== "iptal" ? (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          kalan {formatKurus(inv.balanceKurus)}
                        </span>
                      ) : null}
                    </div>
                    {canNotify ? (
                      <PaymentNoticeDialog
                        enrollmentId={enrollmentId}
                        openInvoices={openInvoices}
                        defaultInvoiceId={inv.id}
                        triggerLabel="Bildir"
                        triggerVariant="outline"
                        triggerSize="xs"
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {pendingNotices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bekleyen bildirimlerin</CardTitle>
            <CardDescription>
              Koçunun onayını bekliyor. Onaylanınca bakiyene işlenir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NoticeList rows={pendingNotices} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ödeme geçmişi</CardTitle>
          <CardDescription>Onaylanan tahsilatların.</CardDescription>
        </CardHeader>
        <CardContent>
          {finance.payments.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
              <BanknoteIcon className="size-4 shrink-0" />
              Henüz ödeme kaydı yok.
            </div>
          ) : (
            <ul className="flex flex-col divide-y">
              {finance.payments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {dateFmt.format(p.paidOn)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {PAYMENT_METHOD_LABELS[p.method]}
                      {p.invoicePeriodLabel ? ` · ${p.invoicePeriodLabel}` : ""}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-success">
                    +{formatKurus(p.amountKurus)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {historyNotices.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Geçmiş bildirimlerin
              </p>
              <NoticeList rows={historyNotices} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NoticeList({ rows }: { rows: PaymentNoticeRow[] }) {
  return (
    <ul className="flex flex-col divide-y">
      {rows.map((n) => (
        <li
          key={n.id}
          className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-medium tabular-nums">
              {formatKurus(n.amountKurus)}
            </span>
            <span className="text-xs text-muted-foreground">
              {dateFmt.format(n.paidOn)}
              {n.invoicePeriodLabel ? ` · ${n.invoicePeriodLabel}` : ""}
            </span>
          </div>
          <NoticeStatusBadge status={n.status} />
        </li>
      ))}
    </ul>
  );
}
