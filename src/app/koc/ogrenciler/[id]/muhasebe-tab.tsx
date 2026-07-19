import { getEnrollmentFinance } from "@/db/queries/muhasebe";
import { formatKurus } from "@/lib/format";
import {
  BILLING_TYPE_LABELS,
  kurusToTryInput,
  PAYMENT_METHOD_LABELS,
  trMonthLabel,
} from "@/lib/muhasebe";
import { buildPaymentStudentOptions } from "@/lib/muhasebe-view";
import { FeePlanDialog } from "@/components/app/fee-plan-dialog";
import { InvoiceCreateDialog } from "@/components/app/invoice-create-dialog";
import {
  InvoiceStatusBadge,
  InvoiceStatusMenu,
} from "@/components/app/invoice-status-menu";
import { PaymentRecordDialog } from "@/components/app/payment-record-dialog";
import { StatTile } from "@/components/brand/stat-tile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Kokpit "Muhasebe" sekmesi — ücret planı + fatura/ödeme geçmişi + tahsilat. */
export async function MuhasebeTab({
  enrollmentId,
  studentName,
}: {
  enrollmentId: number;
  studentName: string;
}) {
  const now = new Date();
  const finance = await getEnrollmentFinance(enrollmentId, now);
  const paymentStudents = buildPaymentStudentOptions(
    [{ enrollmentId, studentId: 0, label: studentName }],
    finance.invoices.filter(
      (i) => i.status !== "ödendi" && i.status !== "iptal" && i.balanceKurus > 0,
    ),
  );

  const plan = finance.activePlan;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Toplam fatura"
          value={formatKurus(finance.totalInvoicedKurus)}
          hint="İptaller hariç"
        />
        <StatTile
          label="Toplam ödenen"
          value={formatKurus(finance.totalPaidKurus)}
          hint="Tüm ödemeler"
        />
        <StatTile
          label="Kalan bakiye"
          value={formatKurus(finance.outstandingKurus)}
          hint="Açık faturalar"
        />
        <StatTile
          label="Plan"
          value={plan ? formatKurus(plan.amountKurus) : "—"}
          hint={
            plan
              ? `${BILLING_TYPE_LABELS[plan.billingType]}${
                  plan.dueDay ? ` · vade ayın ${plan.dueDay}'i` : ""
                }`
              : "Ücret planı yok"
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FeePlanDialog
          enrollmentId={enrollmentId}
          plan={
            plan
              ? {
                  feePlanId: plan.id,
                  billingType: plan.billingType,
                  amountTl: kurusToTryInput(plan.amountKurus),
                  periodMonths: plan.periodMonths,
                  dueDay: plan.dueDay,
                  autoRenew: plan.autoRenew,
                  nextBillingOn: plan.nextBillingOn,
                }
              : null
          }
        />
        <InvoiceCreateDialog
          fixedEnrollmentId={enrollmentId}
          defaultAmountTl={plan ? kurusToTryInput(plan.amountKurus) : undefined}
          defaultPeriodLabel={trMonthLabel(now)}
        />
        <PaymentRecordDialog
          students={paymentStudents}
          fixedEnrollmentId={enrollmentId}
          triggerVariant="outline"
        />
      </div>

      {plan &&
        (plan.billingType === "haftalık" || plan.billingType === "aylık") && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs">
            {plan.autoRenew ? (
              <span className="text-muted-foreground">
                🔁 Otomatik {BILLING_TYPE_LABELS[plan.billingType].toLowerCase()}{" "}
                fatura açık
                {plan.nextBillingOn
                  ? ` · sonraki: ${dateFmt.format(plan.nextBillingOn)}`
                  : ""}
              </span>
            ) : (
              <span className="text-muted-foreground">
                ⏸️ Otomatik faturalama durduruldu — plandan tekrar açabilirsin.
              </span>
            )}
          </div>
        )}

      <Card>
        <CardHeader>
          <CardTitle>Faturalar</CardTitle>
          <CardDescription>
            Bu öğrencinin fatura geçmişi ve kalan bakiyeleri.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {finance.invoices.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
              Henüz fatura kesilmedi.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dönem</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Vade</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="text-right">Kalan</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finance.invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">
                        {inv.periodLabel?.trim() || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {dateFmt.format(inv.issuedOn)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-muted-foreground",
                          inv.isOverdue && "font-medium text-destructive",
                        )}
                      >
                        {inv.dueOn ? dateFmt.format(inv.dueOn) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatKurus(inv.amountKurus)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {inv.status === "iptal"
                          ? "—"
                          : formatKurus(inv.balanceKurus)}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge
                          status={inv.status}
                          isOverdue={inv.isOverdue}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <InvoiceStatusMenu
                          invoiceId={inv.id}
                          status={inv.status}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ödemeler</CardTitle>
          <CardDescription>Alınan tahsilatlar, yeniden eskiye.</CardDescription>
        </CardHeader>
        <CardContent>
          {finance.payments.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
              Henüz ödeme alınmadı.
            </div>
          ) : (
            <ul className="flex flex-col divide-y">
              {finance.payments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium">
                      {dateFmt.format(p.paidOn)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {PAYMENT_METHOD_LABELS[p.method]}
                      {p.invoicePeriodLabel ? ` · ${p.invoicePeriodLabel}` : ""}
                      {p.note?.trim() ? ` · ${p.note}` : ""}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-success">
                    +{formatKurus(p.amountKurus)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
