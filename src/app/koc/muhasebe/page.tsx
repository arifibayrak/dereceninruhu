import type { Metadata } from "next";
import Link from "next/link";
import {
  BanknoteIcon,
  BellRingIcon,
  CircleCheckIcon,
  FileSpreadsheetIcon,
  MessageCircleIcon,
  ReceiptTextIcon,
} from "lucide-react";

import {
  getEnrollmentOptions,
  getMuhasebeDashboard,
  listInvoices,
  listPendingPaymentNotices,
} from "@/db/queries/muhasebe";
import { formatKurus } from "@/lib/format";
import { getViewer } from "@/lib/session";
import { PAYMENT_METHOD_LABELS, trMonthLabel } from "@/lib/muhasebe";
import { buildPaymentStudentOptions } from "@/lib/muhasebe-view";
import { buildWaLink, waTemplates } from "@/lib/whatsapp";
import { BillingRunButton } from "@/components/app/billing-run-button";
import { PaymentNoticeActions } from "@/components/app/payment-notice-actions";
import { PaymentRecordDialog } from "@/components/app/payment-record-dialog";
import { StatTile } from "@/components/brand/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Muhasebe" };

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
});

const pctFmt = new Intl.NumberFormat("tr-TR", {
  style: "percent",
  maximumFractionDigits: 0,
});

export default async function MuhasebePage() {
  const now = new Date();
  const viewer = await getViewer();
  // Koç yalnız kendi öğrencilerinin muhasebesini görür; yönetici tümünü.
  const coachUserId = viewer?.role === "coach" ? viewer.id : null;
  const isAdmin = viewer?.role === "admin";
  const [dash, options, openInvoices, pendingNotices] = await Promise.all([
    getMuhasebeDashboard(now, coachUserId),
    getEnrollmentOptions(coachUserId),
    listInvoices({ status: "açık", now, coachUserId }),
    listPendingPaymentNotices(coachUserId),
  ]);
  const paymentStudents = buildPaymentStudentOptions(options, openInvoices);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            <span aria-hidden className="size-1.5 rounded-full bg-gold" />
            {trMonthLabel(now)}
          </span>
          <h1 className="font-heading text-title">Muhasebe</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/koc/muhasebe/faturalar" />}
          >
            <ReceiptTextIcon data-icon="inline-start" />
            Faturalar
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/koc/muhasebe/odemeler" />}
          >
            <BanknoteIcon data-icon="inline-start" />
            Ödemeler
          </Button>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/koc/muhasebe/mutabakat" />}
            >
              <FileSpreadsheetIcon data-icon="inline-start" />
              Ekstre mutabakatı
            </Button>
          )}
          {isAdmin && <BillingRunButton />}
          <PaymentRecordDialog students={paymentStudents} />
        </div>
      </div>

      <div data-tour="muhasebe-kutular" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Bu ay gelir"
          value={formatKurus(dash.monthRevenueKurus)}
          hint={trMonthLabel(now)}
        />
        <StatTile
          label="Tahsil edilmemiş"
          value={formatKurus(dash.outstandingKurus)}
          hint="Açık fatura bakiyesi"
        />
        <StatTile
          label="Tahsilat oranı"
          value={
            dash.collectionRate !== null ? pctFmt.format(dash.collectionRate) : "—"
          }
          hint="Kesilen faturalarda"
        />
        <StatTile
          label="Gecikmiş"
          value={String(dash.overdue.length)}
          hint="Vadesi geçen fatura"
        />
      </div>

      {pendingNotices.length > 0 && (
        <Card className="border-gold/40 bg-gold/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRingIcon className="size-4 text-gold" />
              Bekleyen ödeme bildirimleri
              <Badge variant="secondary">{pendingNotices.length}</Badge>
            </CardTitle>
            <CardDescription>
              Öğrencilerin bildirdiği havale/ödemeler. Onayla — gerçek ödeme
              kaydına döner; tutarı değiştirmek istersen reddedip elle
              &quot;Ödeme al&quot; kullan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y">
              {pendingNotices.map((n) => (
                <li
                  key={n.id}
                  className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/koc/ogrenciler/${n.studentId}/muhasebe`}
                      className="truncate text-sm font-medium hover:text-primary"
                    >
                      {n.studentName}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {dateFmt.format(n.paidOn)} · {PAYMENT_METHOD_LABELS[n.method]}
                      {n.invoicePeriodLabel ? ` · ${n.invoicePeriodLabel}` : ""}
                      {n.note ? ` · ${n.note}` : ""}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatKurus(n.amountKurus)}
                  </span>
                  <PaymentNoticeActions noticeId={n.id} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gecikmiş ödemeler</CardTitle>
            <CardDescription>
              Vadesi geçen açık faturalar — tek dokunuşla WhatsApp&apos;tan
              hatırlat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dash.overdue.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-success/10 p-4 text-sm text-success">
                <CircleCheckIcon className="size-4 shrink-0" />
                Harika — gecikmiş ödeme yok.
              </div>
            ) : (
              <ul className="flex flex-col divide-y">
                {dash.overdue.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link
                        href={`/koc/ogrenciler/${inv.studentId}/muhasebe`}
                        className="truncate text-sm font-medium hover:text-primary"
                      >
                        {inv.studentName}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {inv.periodLabel?.trim() || "Fatura"}
                        {inv.dueOn ? ` · vade ${dateFmt.format(inv.dueOn)}` : ""}
                      </span>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-destructive">
                      {formatKurus(inv.balanceKurus)}
                    </span>
                    {inv.phone ? (
                      <Button
                        variant="outline"
                        size="xs"
                        render={
                          <a
                            href={buildWaLink(
                              inv.phone,
                              waTemplates.odemeGecikti({
                                studentName: inv.studentName.split(" ")[0],
                                amountTry: formatKurus(inv.balanceKurus),
                              }),
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        }
                      >
                        <MessageCircleIcon data-icon="inline-start" />
                        Hatırlat
                      </Button>
                    ) : (
                      <Badge variant="outline">Telefon yok</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Son ödemeler</CardTitle>
            <CardDescription>En son alınan tahsilatlar.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {dash.recentPayments.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
                <BanknoteIcon className="size-4 shrink-0" />
                Henüz ödeme kaydı yok.
              </div>
            ) : (
              <ul className="flex flex-col divide-y">
                {dash.recentPayments.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link
                        href={`/koc/ogrenciler/${p.studentId}/muhasebe`}
                        className="truncate text-sm font-medium hover:text-primary"
                      >
                        {p.studentName}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {dateFmt.format(p.paidOn)}
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
            <Button
              variant="ghost"
              size="sm"
              className="self-end"
              render={<Link href="/koc/muhasebe/odemeler" />}
            >
              Tüm ödemeler →
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
