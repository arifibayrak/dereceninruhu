import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import {
  getEnrollmentOptions,
  listInvoices,
  listPayments,
} from "@/db/queries/muhasebe";
import { formatKurus } from "@/lib/format";
import { getViewer } from "@/lib/session";
import { PAYMENT_METHOD_LABELS } from "@/lib/muhasebe";
import { buildPaymentStudentOptions } from "@/lib/muhasebe-view";
import { PaymentDeleteButton } from "@/components/app/payment-delete-button";
import { PaymentRecordDialog } from "@/components/app/payment-record-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Ödemeler" };

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function OdemelerPage() {
  const now = new Date();
  const viewer = await getViewer();
  const coachUserId = viewer?.role === "coach" ? viewer.id : null;
  const [payments, options, openInvoices] = await Promise.all([
    listPayments({ coachUserId }),
    getEnrollmentOptions(coachUserId),
    listInvoices({ status: "açık", now, coachUserId }),
  ]);
  const paymentStudents = buildPaymentStudentOptions(options, openInvoices);
  const totalKurus = payments.reduce((acc, p) => acc + p.amountKurus, 0);

  return (
    <>
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          render={<Link href="/koc/muhasebe" />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Muhasebe
        </Button>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-title">Ödemeler</h1>
            <p className="text-sm text-muted-foreground">
              {payments.length} kayıt · toplam {formatKurus(totalKurus)}
            </p>
          </div>
          <PaymentRecordDialog students={paymentStudents} />
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
          Henüz ödeme kaydı yok. &quot;Ödeme al&quot; ile ilk tahsilatı gir.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Öğrenci</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Fatura</TableHead>
                <TableHead>Yöntem</TableHead>
                <TableHead>Not</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead className="pr-4 text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="pl-4 font-medium">
                    <Link
                      href={`/koc/ogrenciler/${p.studentId}?tab=muhasebe`}
                      className="hover:text-primary"
                    >
                      {p.studentName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dateFmt.format(p.paidOn)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.invoiceId
                      ? p.invoicePeriodLabel?.trim() || `#${p.invoiceId}`
                      : "Faturasız"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {PAYMENT_METHOD_LABELS[p.method]}
                  </TableCell>
                  <TableCell className="max-w-40 truncate text-muted-foreground">
                    {p.note?.trim() || "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-success">
                    +{formatKurus(p.amountKurus)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <PaymentDeleteButton paymentId={p.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
