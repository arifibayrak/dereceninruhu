import { and, desc, eq, gte, inArray, isNull, lt, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  enrollments,
  feePlans,
  invoices,
  paymentNotices,
  payments,
  students,
} from "@/db/schema";
import { selectInChunks } from "@/lib/d1";
import { daysBetween, startOfTrtDay } from "@/lib/dates";
import {
  trtMonthRange,
  type BillingType,
  type InvoiceStatus,
  type PaymentNoticeStatus,
} from "@/lib/muhasebe";
import type { SessionViewer } from "@/lib/session";

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

/** Açık (henüz kapanmamış) fatura durumları — ödeme bekleyen. */
export const OPEN_STATUSES: InvoiceStatus[] = ["taslak", "gönderildi", "gecikmiş"];

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
  // D1: sorgu başına 100 parametre — fatura listesi uzadıkça parçalanır.
  // (Toplam fatura başına gruplandığı için parçalar çakışmadan birleşir.)
  const rows = await selectInChunks(invoiceIds, (part) =>
    db
      .select({
        invoiceId: payments.invoiceId,
        paid: sql<number>`coalesce(sum(${payments.amountKurus}), 0)`,
      })
      .from(payments)
      .where(inArray(payments.invoiceId, part))
      .groupBy(payments.invoiceId),
  );
  const map = new Map<number, number>();
  for (const r of rows) if (r.invoiceId != null) map.set(r.invoiceId, Number(r.paid));
  return map;
}

/* -------------------------------------------------------------------------- */
/*  Fatura listeleri                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Faturalar (öğrenci adıyla), filtrelenebilir, yeniden eskiye. `coachUserId`
 * verilirse yalnız o koça atanmış öğrencilerin faturaları döner (koç görünümü);
 * null/undefined ise tüm kadro (yönetici görünümü).
 */
export async function listInvoices(opts?: {
  status?: InvoiceStatus | "açık";
  enrollmentId?: number;
  coachUserId?: string | null;
  limit?: number;
  now?: Date;
}): Promise<InvoiceRow[]> {
  const db = getDb();
  const now = opts?.now ?? new Date();
  const conds = [isNull(students.deletedAt)];
  if (opts?.enrollmentId) conds.push(eq(invoices.enrollmentId, opts.enrollmentId));
  if (opts?.coachUserId)
    conds.push(eq(enrollments.coachUserId, opts.coachUserId));
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
  coachUserId?: string | null,
): Promise<InvoiceRow[]> {
  const open = await listInvoices({ status: "açık", now, coachUserId });
  return open
    .filter((r) => r.isOverdue)
    .sort((a, b) => (a.dueOn?.getTime() ?? 0) - (b.dueOn?.getTime() ?? 0));
}

/** Gecikmiş fatura sayısı — koç panosu rozeti. */
export async function getOverdueInvoiceCount(
  now: Date = new Date(),
  coachUserId?: string | null,
): Promise<number> {
  return (await getOverdueInvoices(now, coachUserId)).length;
}

/* -------------------------------------------------------------------------- */
/*  Ödemeler                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Ödeme listesi (öğrenci + fatura etiketiyle), yeniden eskiye. `coachUserId`
 * verilirse yalnız o koça atanmış öğrencilerin ödemeleri döner.
 */
export async function listPayments(opts?: {
  enrollmentId?: number;
  coachUserId?: string | null;
  limit?: number;
}): Promise<PaymentRow[]> {
  const db = getDb();
  const conds = [isNull(students.deletedAt)];
  if (opts?.enrollmentId)
    conds.push(eq(payments.enrollmentId, opts.enrollmentId));
  if (opts?.coachUserId)
    conds.push(eq(enrollments.coachUserId, opts.coachUserId));
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
    .where(conds.length ? and(...conds) : undefined)
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

/**
 * /koc/muhasebe panosu — tek bakışta işletme durumu. `coachUserId` verilirse
 * yalnız o koça atanmış öğrencilerin muhasebesi (koç görünümü).
 */
export async function getMuhasebeDashboard(
  now: Date = new Date(),
  coachUserId?: string | null,
): Promise<MuhasebeDashboard> {
  const db = getDb();
  const { start, end } = trtMonthRange(now);
  const coachFilter = coachUserId
    ? eq(enrollments.coachUserId, coachUserId)
    : undefined;

  const [monthRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${payments.amountKurus}), 0)`,
    })
    .from(payments)
    .innerJoin(enrollments, eq(enrollments.id, payments.enrollmentId))
    .where(and(gte(payments.paidOn, start), lt(payments.paidOn, end), coachFilter));

  const [invoicedRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${invoices.amountKurus}), 0)`,
    })
    .from(invoices)
    .innerJoin(enrollments, eq(enrollments.id, invoices.enrollmentId))
    .where(and(ne(invoices.status, "iptal"), coachFilter));

  // Faturaya bağlı ödemeler (iptal faturaya bağlılar hariç) — tahsilat oranı.
  const [collectedRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${payments.amountKurus}), 0)`,
    })
    .from(payments)
    .innerJoin(invoices, eq(invoices.id, payments.invoiceId))
    .innerJoin(enrollments, eq(enrollments.id, payments.enrollmentId))
    .where(and(ne(invoices.status, "iptal"), coachFilter));

  const open = await listInvoices({ status: "açık", now, coachUserId });
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
    recentPayments: await listPayments({ limit: 8, coachUserId }),
  };
}

/* -------------------------------------------------------------------------- */
/*  Kadro geneli ödeme durumu (kadro tablosu rozeti)                          */
/* -------------------------------------------------------------------------- */

export type RosterPayment = {
  /** Açık faturaların toplam bakiyesi (kuruş). */
  outstandingKurus: number;
  /** Gecikmiş (vadesi geçmiş açık) faturaların bakiyesi (kuruş). */
  overdueKurus: number;
  isOverdue: boolean;
  /** Gecikmede geçen gün (en eski gecikmiş vadeye göre); değilse null. */
  overdueDays: number | null;
  /** Sıradaki vade — gelecekteki en yakın fatura vadesi ya da plan kesim günü. */
  nextDueOn: Date | null;
  /** Aktif ücret planı var mı. */
  hasPlan: boolean;
};

/**
 * Kadro geneli ödeme durumu: enrollmentId → durum. Satır başına sorgu YOK —
 * tek `listInvoices` (açık faturalar) + tek `feePlans` sorgusuyla türetilir.
 * Koç yalnız kendi kadrosunu; yönetici tüm kadroyu görür.
 */
export async function getRosterPayments(
  viewer: SessionViewer,
  now: Date = new Date(),
): Promise<Map<number, RosterPayment>> {
  const db = getDb();
  const coachUserId = viewer.role === "coach" ? viewer.id : null;
  const coachFilter = coachUserId
    ? eq(enrollments.coachUserId, coachUserId)
    : undefined;

  const planRows = await db
    .select({
      id: feePlans.id,
      enrollmentId: feePlans.enrollmentId,
      nextBillingOn: feePlans.nextBillingOn,
    })
    .from(feePlans)
    .innerJoin(enrollments, eq(enrollments.id, feePlans.enrollmentId))
    .where(and(eq(feePlans.isActive, true), coachFilter))
    .orderBy(feePlans.id);

  const out = new Map<number, RosterPayment>();
  // En son (en büyük id) aktif plan kazanır — getEnrollmentFinance ile tutarlı.
  for (const p of planRows) {
    out.set(p.enrollmentId, {
      outstandingKurus: 0,
      overdueKurus: 0,
      isOverdue: false,
      overdueDays: null,
      nextDueOn: p.nextBillingOn,
      hasPlan: true,
    });
  }

  const open = await listInvoices({ status: "açık", coachUserId, now });
  const earliestOverdue = new Map<number, Date>();
  const earliestFuture = new Map<number, Date>();
  for (const inv of open) {
    if (inv.balanceKurus <= 0) continue;
    const cur =
      out.get(inv.enrollmentId) ??
      ({
        outstandingKurus: 0,
        overdueKurus: 0,
        isOverdue: false,
        overdueDays: null,
        nextDueOn: null,
        hasPlan: false,
      } satisfies RosterPayment);
    cur.outstandingKurus += inv.balanceKurus;
    if (inv.isOverdue) {
      cur.overdueKurus += inv.balanceKurus;
      cur.isOverdue = true;
      if (inv.dueOn) {
        const prev = earliestOverdue.get(inv.enrollmentId);
        if (!prev || inv.dueOn < prev)
          earliestOverdue.set(inv.enrollmentId, inv.dueOn);
      }
    } else if (inv.dueOn) {
      const prev = earliestFuture.get(inv.enrollmentId);
      if (!prev || inv.dueOn < prev)
        earliestFuture.set(inv.enrollmentId, inv.dueOn);
    }
    out.set(inv.enrollmentId, cur);
  }

  for (const [enrollmentId, p] of out) {
    // Açık faturanın yaklaşan vadesi varsa onu tercih et (plan gününün önüne).
    const fut = earliestFuture.get(enrollmentId);
    if (fut && (!p.nextDueOn || fut < p.nextDueOn)) p.nextDueOn = fut;
    const od = earliestOverdue.get(enrollmentId);
    if (od) p.overdueDays = daysBetween(od, now);
  }

  return out;
}

/** Tek kayıt için ödeme durumu (kokpit KPI rozeti) — getRosterPayments'in tekli hâli. */
export async function getEnrollmentPayment(
  enrollmentId: number,
  now: Date = new Date(),
): Promise<RosterPayment | null> {
  const db = getDb();
  const plan = await db.query.feePlans.findFirst({
    where: and(
      eq(feePlans.enrollmentId, enrollmentId),
      eq(feePlans.isActive, true),
    ),
    orderBy: desc(feePlans.id),
  });
  const open = await listInvoices({ status: "açık", enrollmentId, now });
  if (!plan && open.length === 0) return null;

  let outstandingKurus = 0;
  let overdueKurus = 0;
  let isOverdue = false;
  let earliestOverdue: Date | null = null;
  let earliestFuture: Date | null = null;
  for (const inv of open) {
    if (inv.balanceKurus <= 0) continue;
    outstandingKurus += inv.balanceKurus;
    if (inv.isOverdue) {
      overdueKurus += inv.balanceKurus;
      isOverdue = true;
      if (inv.dueOn && (!earliestOverdue || inv.dueOn < earliestOverdue))
        earliestOverdue = inv.dueOn;
    } else if (inv.dueOn && (!earliestFuture || inv.dueOn < earliestFuture)) {
      earliestFuture = inv.dueOn;
    }
  }

  return {
    outstandingKurus,
    overdueKurus,
    isOverdue,
    overdueDays: earliestOverdue ? daysBetween(earliestOverdue, now) : null,
    nextDueOn: earliestFuture ?? plan?.nextBillingOn ?? null,
    hasPlan: plan != null,
  };
}

/* -------------------------------------------------------------------------- */
/*  Öğrenci (kayıt) bazlı finans görünümü                                     */
/* -------------------------------------------------------------------------- */

export type FeePlanRow = {
  id: number;
  billingType: BillingType;
  amountKurus: number;
  currency: string;
  periodMonths: number | null;
  dueDay: number | null;
  isActive: boolean;
  autoRenew: boolean;
  nextBillingOn: Date | null;
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
          autoRenew: plan.autoRenew,
          nextBillingOn: plan.nextBillingOn,
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

export async function getEnrollmentOptions(
  coachUserId?: string | null,
): Promise<EnrollmentOption[]> {
  const db = getDb();
  const rows = await db
    .select({
      enrollmentId: enrollments.id,
      studentId: students.id,
      label: students.fullName,
    })
    .from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .where(
      and(
        eq(enrollments.status, "active"),
        eq(students.status, "active"),
        coachUserId ? eq(enrollments.coachUserId, coachUserId) : undefined,
      ),
    )
    .orderBy(students.fullName);
  return rows;
}

/* -------------------------------------------------------------------------- */
/*  Havale / ödeme bildirimleri (öğrenci self-servis → koç onayı)             */
/* -------------------------------------------------------------------------- */

export type PaymentNoticeRow = {
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
  status: PaymentNoticeStatus;
  createdAt: Date;
};

/**
 * Ödeme bildirimleri (öğrenci + fatura etiketiyle), yeniden eskiye.
 * `enrollmentId` verilirse tek öğrenci (öğrenci kendi listesi); `coachUserId`
 * verilirse yalnız o koça atanmış öğrenciler (koç görünümü); `status` filtreler.
 */
export async function listPaymentNotices(opts?: {
  enrollmentId?: number;
  coachUserId?: string | null;
  status?: PaymentNoticeStatus;
  limit?: number;
}): Promise<PaymentNoticeRow[]> {
  const db = getDb();
  const conds = [isNull(students.deletedAt)];
  if (opts?.enrollmentId)
    conds.push(eq(paymentNotices.enrollmentId, opts.enrollmentId));
  if (opts?.coachUserId)
    conds.push(eq(enrollments.coachUserId, opts.coachUserId));
  if (opts?.status) conds.push(eq(paymentNotices.status, opts.status));

  const rows = await db
    .select({
      id: paymentNotices.id,
      enrollmentId: paymentNotices.enrollmentId,
      studentId: students.id,
      studentName: students.fullName,
      invoiceId: paymentNotices.invoiceId,
      invoicePeriodLabel: invoices.periodLabel,
      amountKurus: paymentNotices.amountKurus,
      paidOn: paymentNotices.paidOn,
      method: paymentNotices.method,
      note: paymentNotices.note,
      status: paymentNotices.status,
      createdAt: paymentNotices.createdAt,
    })
    .from(paymentNotices)
    .innerJoin(enrollments, eq(enrollments.id, paymentNotices.enrollmentId))
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .leftJoin(invoices, eq(invoices.id, paymentNotices.invoiceId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(paymentNotices.createdAt), desc(paymentNotices.id))
    .limit(opts?.limit ?? 100);
  return rows;
}

/** Onay bekleyen bildirimler — koç panosu gelen kutusu. */
export async function listPendingPaymentNotices(
  coachUserId?: string | null,
): Promise<PaymentNoticeRow[]> {
  return listPaymentNotices({ status: "bekliyor", coachUserId });
}

/** Onay bekleyen bildirim sayısı — pano rozeti. */
export async function countPendingPaymentNotices(
  coachUserId?: string | null,
): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(paymentNotices)
    .innerJoin(enrollments, eq(enrollments.id, paymentNotices.enrollmentId))
    .where(
      and(
        eq(paymentNotices.status, "bekliyor"),
        coachUserId ? eq(enrollments.coachUserId, coachUserId) : undefined,
      ),
    );
  return Number(row?.n ?? 0);
}
