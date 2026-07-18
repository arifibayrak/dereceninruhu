import { and, desc, eq, gte, inArray, lt, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  enrollments,
  feePlans,
  invoices,
  payments,
  students,
} from "@/db/schema";
import { startOfTrtDay } from "@/lib/dates";
import { trtMonthRange, type InvoiceStatus } from "@/lib/muhasebe";

/* -------------------------------------------------------------------------- */
/*  Ortak görünüm tipleri                                                     */
/* -------------------------------------------------------------------------- */

export type InvoiceRow = {
  id: number;
  enrollmentId: number;
  studentId: number;
  studentName: string;
  phone: string | null;
  periodLabel: string | null;
  amountKurus: number;
  paidKurus: number;
  balanceKurus: number;
  issuedOn: Date;
  dueOn: Date | null;
  status: InvoiceStatus;
  /** Açık + vadesi geçmiş (statüden bağımsız türetilir). */
  isOverdue: boolean;
};

export type PaymentRow = {
  id: number;
  enrollmentId: number;
  studentId: number;
  studentName: string;
  invoiceId: number | null;
  invoicePeriodLabel: string | null;
  amountKurus: number;
  paidOn: Date;
  method: "havale" | "nakit" | "kart" | "diğer";
  note: string | null;
};

const OPEN_STATUSES: InvoiceStatus[] = ["taslak", "gönderildi", "gecikmiş"];

function isOverdueRow(
  status: InvoiceStatus,
  balanceKurus: number,
  dueOn: Date | null,
  now: Date,
): boolean {
  if (status === "ödendi" || status === "iptal") return false;
  if (balanceKurus <= 0) return false;
  if (!dueOn) return false;
  return startOfTrtDay(dueOn).getTime() < startOfTrtDay(now).getTime();
}

/** Fatura başına ödenen toplamlar. */
async function paidByInvoice(
  invoiceIds: number[],
): Promise<Map<number, number>> {
  if (invoiceIds.length === 0) return new Map();
  const db = getDb();
  const rows = await db
    .select({
      invoiceId: payments.invoiceId,
      paid: sql<number>`coalesce(sum(${payments.amountKurus}), 0)`,
    })
    .from(payments)
    .where(inArray(payments.invoiceId, invoiceIds))
    .groupBy(payments.invoiceId);
  const map = new Map<number, number>();
  for (const r of rows) if (r.invoiceId != null) map.set(r.invoiceId, Number(r.paid));
  return map;
}

/* -------------------------------------------------------------------------- */
/*  Fatura listeleri                                                          */
/* -------------------------------------------------------------------------- */

/** Tüm faturalar (öğrenci adıyla), filtrelenebilir, yeniden eskiye. */
export async function listInvoices(opts?: {
  status?: InvoiceStatus | "açık";
  enrollmentId?: number;
  limit?: number;
  now?: Date;
}): Promise<InvoiceRow[]> {
  const db = getDb();
  const now = opts?.now ?? new Date();
  const conds = [];
  if (opts?.enrollmentId) conds.push(eq(invoices.enrollmentId, opts.enrollmentId));
  if (opts?.status === "açık") conds.push(inArray(invoices.status, OPEN_STATUSES));
  else if (opts?.status) conds.push(eq(invoices.status, opts.status));

  const rows = await db
    .select({
      id: invoices.id,
      enrollmentId: invoices.enrollmentId,
      studentId: students.id,
      studentName: students.fullName,
      phone: students.phone,
      periodLabel: invoices.periodLabel,
      amountKurus: invoices.amountKurus,
      issuedOn: invoices.issuedOn,
      dueOn: invoices.dueOn,
      status: invoices.status,
    })
    .from(invoices)
    .innerJoin(enrollments, eq(enrollments.id, invoices.enrollmentId))
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(invoices.issuedOn), desc(invoices.id))
    .limit(opts?.limit ?? 200);

  const paid = await paidByInvoice(rows.map((r) => r.id));
  return rows.map((r) => {
    const paidKurus = paid.get(r.id) ?? 0;
    const balanceKurus = Math.max(0, r.amountKurus - paidKurus);
    return {
      ...r,
      paidKurus,
      balanceKurus,
      isOverdue: isOverdueRow(r.status, balanceKurus, r.dueOn, now),
    };
  });
}

/** Gecikmiş (açık + vadesi geçmiş) faturalar — pano + hatırlatma listesi. */
export async function getOverdueInvoices(
  now: Date = new Date(),
): Promise<InvoiceRow[]> {
  const open = await listInvoices({ status: "açık", now });
  return open
    .filter((r) => r.isOverdue)
    .sort((a, b) => (a.dueOn?.getTime() ?? 0) - (b.dueOn?.getTime() ?? 0));
}

/** Gecikmiş fatura sayısı — koç panosu rozeti. */
export async function getOverdueInvoiceCount(
  now: Date = new Date(),
): Promise<number> {
  return (await getOverdueInvoices(now)).length;
}

/* -------------------------------------------------------------------------- */
/*  Ödemeler                                                                  */
/* -------------------------------------------------------------------------- */

/** Ödeme listesi (öğrenci + fatura etiketiyle), yeniden eskiye. */
export async function listPayments(opts?: {
  enrollmentId?: number;
  limit?: number;
}): Promise<PaymentRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: payments.id,
      enrollmentId: payments.enrollmentId,
      studentId: students.id,
      studentName: students.fullName,
      invoiceId: payments.invoiceId,
      invoicePeriodLabel: invoices.periodLabel,
      amountKurus: payments.amountKurus,
      paidOn: payments.paidOn,
      method: payments.method,
      note: payments.note,
    })
    .from(payments)
    .innerJoin(enrollments, eq(enrollments.id, payments.enrollmentId))
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .leftJoin(invoices, eq(invoices.id, payments.invoiceId))
    .where(
      opts?.enrollmentId
        ? eq(payments.enrollmentId, opts.enrollmentId)
        : undefined,
    )
    .orderBy(desc(payments.paidOn), desc(payments.id))
    .limit(opts?.limit ?? 200);
  return rows;
}

/* -------------------------------------------------------------------------- */
/*  İşletme panosu                                                            */
/* -------------------------------------------------------------------------- */

export type MuhasebeDashboard = {
  /** Bu TRT ayında alınan ödemeler (kuruş). */
  monthRevenueKurus: number;
  /** Açık faturaların toplam bakiyesi (kuruş). */
  outstandingKurus: number;
  /** Kesilen (iptal olmayan) faturaların tahsil edilme oranı 0..1; fatura yoksa null. */
  collectionRate: number | null;
  overdue: InvoiceRow[];
  recentPayments: PaymentRow[];
};

/** /koc/muhasebe panosu — tek bakışta işletme durumu. */
export async function getMuhasebeDashboard(
  now: Date = new Date(),
): Promise<MuhasebeDashboard> {
  const db = getDb();
  const { start, end } = trtMonthRange(now);

  const [monthRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${payments.amountKurus}), 0)`,
    })
    .from(payments)
    .where(and(gte(payments.paidOn, start), lt(payments.paidOn, end)));

  const [invoicedRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${invoices.amountKurus}), 0)`,
    })
    .from(invoices)
    .where(ne(invoices.status, "iptal"));

  // Faturaya bağlı ödemeler (iptal faturaya bağlılar hariç) — tahsilat oranı.
  const [collectedRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${payments.amountKurus}), 0)`,
    })
    .from(payments)
    .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
    .where(ne(invoices.status, "iptal"));

  const open = await listInvoices({ status: "açık", now });
  const outstandingKurus = open.reduce((acc, r) => acc + r.balanceKurus, 0);
  const overdue = open
    .filter((r) => r.isOverdue)
    .sort((a, b) => (a.dueOn?.getTime() ?? 0) - (b.dueOn?.getTime() ?? 0));

  const invoiced = Number(invoicedRow?.total ?? 0);
  const collected = Math.min(Number(collectedRow?.total ?? 0), invoiced);

  return {
    monthRevenueKurus: Number(monthRow?.total ?? 0),
    outstandingKurus,
    collectionRate: invoiced > 0 ? collected / invoiced : null,
    overdue,
    recentPayments: await listPayments({ limit: 8 }),
  };
}

/* -------------------------------------------------------------------------- */
/*  Öğrenci (kayıt) bazlı finans görünümü                                     */
/* -------------------------------------------------------------------------- */

export type FeePlanRow = {
  id: number;
  billingType: "aylık" | "paket" | "tek_seferlik";
  amountKurus: number;
  currency: string;
  periodMonths: number | null;
  dueDay: number | null;
  isActive: boolean;
};

export type EnrollmentFinance = {
  activePlan: FeePlanRow | null;
  invoices: InvoiceRow[];
  payments: PaymentRow[];
  totalInvoicedKurus: number;
  totalPaidKurus: number;
  /** Açık faturaların bakiyesi. */
  outstandingKurus: number;
};

/** Kokpit muhasebe sekmesi — plan + fatura/ödeme geçmişi + bakiye. */
export async function getEnrollmentFinance(
  enrollmentId: number,
  now: Date = new Date(),
): Promise<EnrollmentFinance> {
  const db = getDb();
  const plan = await db.query.feePlans.findFirst({
    where: and(
      eq(feePlans.enrollmentId, enrollmentId),
      eq(feePlans.isActive, true),
    ),
    orderBy: desc(feePlans.id),
  });

  const invoiceRows = await listInvoices({ enrollmentId, now });
  const paymentRows = await listPayments({ enrollmentId });

  const nonVoid = invoiceRows.filter((r) => r.status !== "iptal");
  return {
    activePlan: plan
      ? {
          id: plan.id,
          billingType: plan.billingType,
          amountKurus: plan.amountKurus,
          currency: plan.currency,
          periodMonths: plan.periodMonths,
          dueDay: plan.dueDay,
          isActive: plan.isActive,
        }
      : null,
    invoices: invoiceRows,
    payments: paymentRows,
    totalInvoicedKurus: nonVoid.reduce((acc, r) => acc + r.amountKurus, 0),
    totalPaidKurus: paymentRows.reduce((acc, r) => acc + r.amountKurus, 0),
    outstandingKurus: nonVoid
      .filter((r) => r.status !== "ödendi")
      .reduce((acc, r) => acc + r.balanceKurus, 0),
  };
}

/** Aktif kadro — fatura/ödeme formlarındaki öğrenci seçimi. */
export type EnrollmentOption = {
  enrollmentId: number;
  studentId: number;
  label: string;
};

export async function getEnrollmentOptions(): Promise<EnrollmentOption[]> {
  const db = getDb();
  const rows = await db
    .select({
      enrollmentId: enrollments.id,
      studentId: students.id,
      label: students.fullName,
    })
    .from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .where(and(eq(enrollments.status, "active"), eq(students.status, "active")))
    .orderBy(students.fullName);
  return rows;
}
