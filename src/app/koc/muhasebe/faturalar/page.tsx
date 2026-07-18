import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import {
  getEnrollmentOptions,
  listInvoices,
} from "@/db/queries/muhasebe";
import { formatKurus } from "@/lib/format";
import { trMonthLabel, type InvoiceStatus } from "@/lib/muhasebe";
import { InvoiceCreateDialog } from "@/components/app/invoice-create-dialog";
import {
  InvoiceStatusBadge,
  InvoiceStatusMenu,
} from "@/components/app/invoice-status-menu";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Faturalar" };

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const FILTERS = [
  { value: "", label: "Tümü" },
  { value: "açık", label: "Açık" },
  { value: "gecikmiş", label: "Gecikmiş" },
  { value: "ödendi", label: "Ödendi" },
  { value: "taslak", label: "Taslak" },
  { value: "iptal", label: "İptal" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

export default async function FaturalarPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>;
}) {
  const { durum } = await searchParams;
  const filter: FilterValue = (
    FILTERS.some((f) => f.value === durum) ? durum : ""
  ) as FilterValue;
  const now = new Date();

  // "gecikmiş" statüden değil vadeden türetilir → açık faturalardan süz.
  const [allInvoices, options] = await Promise.all([
    listInvoices({
      status:
        filter === ""
          ? undefined
          : filter === "gecikmiş"
            ? "açık"
            : (filter as InvoiceStatus | "açık"),
      now,
    }),
    getEnrollmentOptions(),
  ]);
  const invoices =
    filter === "gecikmiş"
      ? allInvoices.filter((i) => i.isOverdue)
      : allInvoices;

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
          <h1 className="font-heading text-title">Faturalar</h1>
          <InvoiceCreateDialog
            students={options.map((o) => ({
              enrollmentId: o.enrollmentId,
              label: o.label,
            }))}
            defaultPeriodLabel={trMonthLabel(now)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={
              f.value === ""
                ? "/koc/muhasebe/faturalar"
                : `/koc/muhasebe/faturalar?durum=${encodeURIComponent(f.value)}`
            }
            className={cn(
              "inline-flex h-7 items-center rounded-full px-3 text-xs font-medium ring-1 ring-foreground/10 transition-colors",
              filter === f.value
                ? "bg-secondary text-secondary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {invoices.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
          Bu filtrede fatura yok.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Öğrenci</TableHead>
                <TableHead>Dönem</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Vade</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead className="text-right">Kalan</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="pr-4 text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="pl-4 font-medium">
                    <Link
                      href={`/koc/ogrenciler/${inv.studentId}?tab=muhasebe`}
                      className="hover:text-primary"
                    >
                      {inv.studentName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
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
                    {inv.status === "iptal" ? "—" : formatKurus(inv.balanceKurus)}
                  </TableCell>
                  <TableCell>
                    <InvoiceStatusBadge
                      status={inv.status}
                      isOverdue={inv.isOverdue}
                    />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <InvoiceStatusMenu invoiceId={inv.id} status={inv.status} />
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
