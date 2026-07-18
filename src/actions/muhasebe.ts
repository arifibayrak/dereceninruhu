"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { enrollments, feePlans, invoices, payments } from "@/db/schema";
import { startOfTrtDay } from "@/lib/dates";
import { resolveInvoiceStatus, type InvoiceStatus } from "@/lib/muhasebe";
import {
  createInvoiceSchema,
  recordPaymentSchema,
  updateInvoiceStatusSchema,
  upsertFeePlanSchema,
  voidInvoiceSchema,
} from "@/lib/validation-muhasebe";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireCoach,
  type ActionResult,
} from "@/actions/_guard";

/**
 * Faz 4 — muhasebe aksiyonları. Tamamı koç/yönetici (requireCoach);
 * öğrenciler finansal verileri hiç görmez. Money = integer kuruş.
 */

async function assertEnrollmentExists(enrollmentId: number) {
  const db = getDb();
  const row = await db.query.enrollments.findFirst({
    where: eq(enrollments.id, enrollmentId),
  });
  if (!row) throw new Error("Kayıt bulunamadı");
  return row;
}

/** Faturanın ödenen toplamından + vadesinden durumunu yeniden hesaplar. */
async function recomputeInvoiceStatus(
  invoiceId: number,
  now: Date = new Date(),
): Promise<InvoiceStatus | null> {
  const db = getDb();
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
  });
  if (!invoice) return null;
  const [paidRow] = await db
    .select({ paid: sql<number>`coalesce(sum(${payments.amountKurus}), 0)` })
    .from(payments)
    .where(eq(payments.invoiceId, invoiceId));
  const next = resolveInvoiceStatus({
    current: invoice.status,
    amountKurus: invoice.amountKurus,
    paidKurus: Number(paidRow?.paid ?? 0),
    dueOn: invoice.dueOn,
    now,
  });
  if (next !== invoice.status) {
    await db
      .update(invoices)
      .set({ status: next, updatedAt: new Date() })
      .where(eq(invoices.id, invoiceId));
  }
  return next;
}

/** Ücret planı — feePlanId verilirse günceller; yoksa eskiyi kapatıp açar. */
export async function upsertFeePlan(
  input: unknown,
): Promise<ActionResult<{ feePlanId: number }>> {
  return guarded(async () => {
    await requireCoach();
    const parsed = upsertFeePlanSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();
    await assertEnrollmentExists(v.enrollmentId);

    if (v.feePlanId) {
      const existing = await db.query.feePlans.findFirst({
        where: eq(feePlans.id, v.feePlanId),
      });
      if (!existing || existing.enrollmentId !== v.enrollmentId) {
        return actionError("Ücret planı bulunamadı.");
      }
      await db
        .update(feePlans)
        .set({
          billingType: v.billingType,
          amountKurus: v.amountTl,
          periodMonths: v.billingType === "aylık" ? null : (v.periodMonths ?? null),
          dueDay: v.dueDay ?? null,
          ...(v.isActive !== undefined ? { isActive: v.isActive } : {}),
          updatedAt: new Date(),
        })
        .where(eq(feePlans.id, v.feePlanId));
      return { ok: true, data: { feePlanId: v.feePlanId } };
    }

    // Tek aktif plan: yenisini açmadan öncekileri kapat.
    await db
      .update(feePlans)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(feePlans.enrollmentId, v.enrollmentId),
          eq(feePlans.isActive, true),
        ),
      );
    const [plan] = await db
      .insert(feePlans)
      .values({
        enrollmentId: v.enrollmentId,
        billingType: v.billingType,
        amountKurus: v.amountTl,
        periodMonths: v.billingType === "aylık" ? null : (v.periodMonths ?? null),
        dueDay: v.dueDay ?? null,
        isActive: true,
      })
      .returning({ id: feePlans.id });
    return { ok: true, data: { feePlanId: plan.id } };
  });
}

/** Fatura kes. */
export async function createInvoice(
  input: unknown,
): Promise<ActionResult<{ invoiceId: number }>> {
  return guarded(async () => {
    await requireCoach();
    const parsed = createInvoiceSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();
    await assertEnrollmentExists(v.enrollmentId);

    const activePlan = await db.query.feePlans.findFirst({
      where: and(
        eq(feePlans.enrollmentId, v.enrollmentId),
        eq(feePlans.isActive, true),
      ),
    });

    const [invoice] = await db
      .insert(invoices)
      .values({
        enrollmentId: v.enrollmentId,
        feePlanId: activePlan?.id ?? null,
        periodLabel: v.periodLabel?.trim() || null,
        amountKurus: v.amountTl,
        issuedOn: startOfTrtDay(v.issuedOn),
        dueOn: v.dueOn ? startOfTrtDay(v.dueOn) : null,
        status: v.status,
      })
      .returning({ id: invoices.id });
    return { ok: true, data: { invoiceId: invoice.id } };
  });
}

/** Fatura durumunu elle değiştir (gönderildi/gecikmiş/ödendi/…). */
export async function updateInvoiceStatus(
  input: unknown,
): Promise<ActionResult<{ invoiceId: number; status: InvoiceStatus }>> {
  return guarded(async () => {
    await requireCoach();
    const parsed = updateInvoiceStatusSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const v = parsed.data;
    const db = getDb();
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, v.invoiceId),
    });
    if (!invoice) return actionError("Fatura bulunamadı.");
    await db
      .update(invoices)
      .set({ status: v.status, updatedAt: new Date() })
      .where(eq(invoices.id, v.invoiceId));
    return { ok: true, data: { invoiceId: v.invoiceId, status: v.status } };
  });
}

/** Faturayı iptal et (geçmiş korunur; ödemeler silinmez). */
export async function voidInvoice(
  input: unknown,
): Promise<ActionResult<{ invoiceId: number }>> {
  return guarded(async () => {
    await requireCoach();
    const parsed = voidInvoiceSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const db = getDb();
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, parsed.data.invoiceId),
    });
    if (!invoice) return actionError("Fatura bulunamadı.");
    if (invoice.status === "ödendi") {
      return actionError("Ödenmiş fatura iptal edilemez.");
    }
    await db
      .update(invoices)
      .set({ status: "iptal", updatedAt: new Date() })
      .where(eq(invoices.id, invoice.id));
    return { ok: true, data: { invoiceId: invoice.id } };
  });
}

/** Ödeme kaydet; bağlı faturanın durumunu bakiye + vadeden yeniden hesaplar. */
export async function recordPayment(
  input: unknown,
): Promise<ActionResult<{ paymentId: number; invoiceStatus: InvoiceStatus | null }>> {
  return guarded(async () => {
    const user = await requireCoach();
    const parsed = recordPaymentSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();
    await assertEnrollmentExists(v.enrollmentId);

    if (v.invoiceId) {
      const invoice = await db.query.invoices.findFirst({
        where: eq(invoices.id, v.invoiceId),
      });
      if (!invoice || invoice.enrollmentId !== v.enrollmentId) {
        return actionError("Fatura bu öğrenciye ait değil.");
      }
      if (invoice.status === "iptal") {
        return actionError("İptal edilmiş faturaya ödeme alınamaz.");
      }
    }

    const [payment] = await db
      .insert(payments)
      .values({
        enrollmentId: v.enrollmentId,
        invoiceId: v.invoiceId ?? null,
        amountKurus: v.amountTl,
        paidOn: startOfTrtDay(v.paidOn),
        method: v.method,
        receivedByUserId: user.id,
        note: v.note?.trim() || null,
      })
      .returning({ id: payments.id });

    const invoiceStatus = v.invoiceId
      ? await recomputeInvoiceStatus(v.invoiceId)
      : null;
    return { ok: true, data: { paymentId: payment.id, invoiceStatus } };
  });
}

/** Yanlış girilen ödemeyi sil; bağlı faturayı yeniden hesaplar. */
export async function deletePayment(
  paymentId: number,
): Promise<ActionResult<{ paymentId: number }>> {
  return guarded(async () => {
    await requireCoach();
    const db = getDb();
    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, paymentId),
    });
    if (!payment) return actionError("Ödeme bulunamadı.");
    await db.delete(payments).where(eq(payments.id, paymentId));
    if (payment.invoiceId) {
      // Ödeme silinince tam ödenmişlik bozulabilir — durumu geri türet.
      const db2 = getDb();
      const invoice = await db2.query.invoices.findFirst({
        where: eq(invoices.id, payment.invoiceId),
      });
      if (invoice && invoice.status === "ödendi") {
        await db2
          .update(invoices)
          .set({ status: "gönderildi", updatedAt: new Date() })
          .where(and(eq(invoices.id, invoice.id), ne(invoices.status, "iptal")));
      }
      await recomputeInvoiceStatus(payment.invoiceId);
    }
    return { ok: true, data: { paymentId } };
  });
}
