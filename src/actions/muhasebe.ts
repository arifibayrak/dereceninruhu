"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  enrollments,
  feePlans,
  invoices,
  paymentNotices,
  payments,
} from "@/db/schema";
import { startOfTrtDay } from "@/lib/dates";
import { generateDueInvoices, type BillingRunResult } from "@/lib/billing";
import { formatKurus } from "@/lib/format";
import { notifyAfterResponse } from "@/lib/notify";
import {
  resolveInvoiceStatus,
  type InvoiceStatus,
  type PaymentNoticeStatus,
} from "@/lib/muhasebe";
import {
  createInvoiceSchema,
  createPaymentNoticeSchema,
  recordPaymentSchema,
  resolvePaymentNoticeSchema,
  updateInvoiceStatusSchema,
  upsertFeePlanSchema,
  voidInvoiceSchema,
} from "@/lib/validation-muhasebe";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireAdmin,
  requireCoach,
  requireUser,
  type ActionResult,
  type SessionUser,
} from "@/actions/_guard";
import { assertEnrollmentAccess as assertOwnEnrollment } from "@/actions/_access";

/**
 * Faz 4 — muhasebe aksiyonları. Tamamı koç/yönetici (requireCoach);
 * öğrenciler finansal verileri hiç görmez. Money = integer kuruş.
 * Koç yalnız KENDİ öğrencilerinin muhasebesine dokunabilir; yönetici hepsine.
 */

async function assertEnrollmentAccess(enrollmentId: number, user: SessionUser) {
  const db = getDb();
  const row = await db.query.enrollments.findFirst({
    where: eq(enrollments.id, enrollmentId),
  });
  if (!row) throw new Error("Kayıt bulunamadı");
  if (user.role === "coach" && row.coachUserId !== user.id) {
    throw new Error("Bu öğrenci sana atanmadı");
  }
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
    const user = await requireCoach();
    const parsed = upsertFeePlanSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();
    await assertEnrollmentAccess(v.enrollmentId, user);

    if (v.feePlanId) {
      const existing = await db.query.feePlans.findFirst({
        where: eq(feePlans.id, v.feePlanId),
      });
      if (!existing || existing.enrollmentId !== v.enrollmentId) {
        return actionError("Ücret planı bulunamadı.");
      }
      const recurring =
        v.billingType === "haftalık" || v.billingType === "aylık";
      const nextBillingOn = recurring
        ? v.firstBillingOn
          ? startOfTrtDay(v.firstBillingOn)
          : (existing.nextBillingOn ?? startOfTrtDay(new Date()))
        : null;
      await db
        .update(feePlans)
        .set({
          enrollmentPackageId: v.enrollmentPackageId ?? null,
          billingType: v.billingType,
          amountKurus: v.amountTl,
          periodMonths:
            v.billingType === "paket" ? (v.periodMonths ?? null) : null,
          dueDay: v.dueDay ?? null,
          autoRenew: v.autoRenew ?? existing.autoRenew,
          nextBillingOn,
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
    const recurring = v.billingType === "haftalık" || v.billingType === "aylık";
    const nextBillingOn = recurring
      ? startOfTrtDay(v.firstBillingOn ?? new Date())
      : null;
    const [plan] = await db
      .insert(feePlans)
      .values({
        enrollmentId: v.enrollmentId,
        enrollmentPackageId: v.enrollmentPackageId ?? null,
        billingType: v.billingType,
        amountKurus: v.amountTl,
        periodMonths:
          v.billingType === "paket" ? (v.periodMonths ?? null) : null,
        dueDay: v.dueDay ?? null,
        autoRenew: v.autoRenew ?? true,
        nextBillingOn,
        isActive: true,
      })
      .returning({ id: feePlans.id });
    return { ok: true, data: { feePlanId: plan.id } };
  });
}

/**
 * Vadesi gelen otomatik faturaları ELLE üretir (yönetici). Cron da aynı motoru
 * çağırır; idempotent olduğundan iki tetikleyici çakışmaz.
 */
export async function runBillingNow(): Promise<
  ActionResult<BillingRunResult>
> {
  return guarded<BillingRunResult>(async () => {
    await requireAdmin();
    const result = await generateDueInvoices(new Date());
    revalidatePath("/koc/muhasebe");
    revalidatePath("/koc/muhasebe/faturalar");
    return { ok: true, data: result };
  });
}

/** Fatura kes. */
export async function createInvoice(
  input: unknown,
): Promise<ActionResult<{ invoiceId: number }>> {
  return guarded(async () => {
    const user = await requireCoach();
    const parsed = createInvoiceSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();
    await assertEnrollmentAccess(v.enrollmentId, user);

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
    const user = await requireCoach();
    const parsed = updateInvoiceStatusSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const v = parsed.data;
    const db = getDb();
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, v.invoiceId),
    });
    if (!invoice) return actionError("Fatura bulunamadı.");
    await assertEnrollmentAccess(invoice.enrollmentId, user);
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
    const user = await requireCoach();
    const parsed = voidInvoiceSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const db = getDb();
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, parsed.data.invoiceId),
    });
    if (!invoice) return actionError("Fatura bulunamadı.");
    await assertEnrollmentAccess(invoice.enrollmentId, user);
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
    await assertEnrollmentAccess(v.enrollmentId, user);

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
    const user = await requireCoach();
    const db = getDb();
    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, paymentId),
    });
    if (!payment) return actionError("Ödeme bulunamadı.");
    await assertEnrollmentAccess(payment.enrollmentId, user);
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

/* -------------------------------------------------------------------------- */
/*  Öğrenci self-servis: havale / ödeme bildirimi + koç onayı                 */
/* -------------------------------------------------------------------------- */

/**
 * Öğrenci havale/ödeme bildirir (self-servis). Yetki: kullanıcı yalnız KENDİ
 * kaydına bildirim açabilir (assertOwnEnrollment; koç/yönetici de geçer).
 * Ödeme HENÜZ oluşmaz — koç onaylayınca gerçek `payments` satırına döner.
 */
export async function createPaymentNotice(
  input: unknown,
): Promise<ActionResult<{ noticeId: number }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = createPaymentNoticeSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();
    // Öğrenci yalnız kendi kaydına; koç/yönetici serbest.
    await assertOwnEnrollment(db, v.enrollmentId, user);

    if (v.invoiceId) {
      const invoice = await db.query.invoices.findFirst({
        where: eq(invoices.id, v.invoiceId),
      });
      if (!invoice || invoice.enrollmentId !== v.enrollmentId) {
        return actionError("Fatura bu kayda ait değil.");
      }
    }

    const [notice] = await db
      .insert(paymentNotices)
      .values({
        enrollmentId: v.enrollmentId,
        invoiceId: v.invoiceId ?? null,
        amountKurus: v.amountTl,
        paidOn: startOfTrtDay(v.paidOn),
        method: v.method,
        note: v.note?.trim() || null,
        status: "bekliyor",
      })
      .returning({ id: paymentNotices.id });

    notifyAfterResponse({
      title: "Yeni ödeme bildirimi",
      lines: [
        `Öğrenci: ${user.name}`,
        `Tutar: ${formatKurus(v.amountTl)}`,
        `Yöntem: ${v.method}`,
        ...(v.note?.trim() ? [`Not: ${v.note.trim()}`] : []),
      ],
      url: "/koc/muhasebe",
    });

    // Koç panosuna "düşsün"; öğrenci kendi listesini de tazelesin.
    revalidatePath("/koc/muhasebe");
    revalidatePath("/ogrenci/odemeler");
    return { ok: true, data: { noticeId: notice.id } };
  });
}

/**
 * Koç kararı: bildirimi onayla (→ gerçek ödeme + fatura durumunu yeniden
 * hesapla) ya da reddet. Koç yalnız kendi öğrencilerinin bildirimlerine bakar.
 */
export async function resolvePaymentNotice(
  input: unknown,
): Promise<ActionResult<{ noticeId: number; status: PaymentNoticeStatus }>> {
  return guarded<{ noticeId: number; status: PaymentNoticeStatus }>(async () => {
    const user = await requireCoach();
    const parsed = resolvePaymentNoticeSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const { noticeId, action } = parsed.data;
    const db = getDb();

    const notice = await db.query.paymentNotices.findFirst({
      where: eq(paymentNotices.id, noticeId),
    });
    if (!notice) return actionError("Bildirim bulunamadı.");
    await assertEnrollmentAccess(notice.enrollmentId, user);
    if (notice.status !== "bekliyor") {
      return actionError("Bu bildirim zaten sonuçlandı.");
    }

    if (action === "reddet") {
      await db
        .update(paymentNotices)
        .set({
          status: "reddedildi",
          resolvedByUserId: user.id,
          updatedAt: new Date(),
        })
        .where(eq(paymentNotices.id, noticeId));
      revalidatePath("/koc/muhasebe");
      revalidatePath("/ogrenci/odemeler");
      return { ok: true, data: { noticeId, status: "reddedildi" } };
    }

    // Onayla → gerçek ödeme oluştur. İptal/başka kayda ait faturaya bağlama.
    let invoiceId = notice.invoiceId;
    if (invoiceId) {
      const invoice = await db.query.invoices.findFirst({
        where: eq(invoices.id, invoiceId),
      });
      if (!invoice || invoice.enrollmentId !== notice.enrollmentId) {
        invoiceId = null;
      } else if (invoice.status === "iptal") {
        return actionError("İptal edilmiş faturaya ödeme onaylanamaz.");
      }
    }

    const [payment] = await db
      .insert(payments)
      .values({
        enrollmentId: notice.enrollmentId,
        invoiceId: invoiceId ?? null,
        amountKurus: notice.amountKurus,
        paidOn: notice.paidOn,
        method: notice.method,
        receivedByUserId: user.id,
        note: notice.note?.trim()
          ? `Havale bildirimi: ${notice.note.trim()}`
          : "Havale bildiriminden onaylandı",
      })
      .returning({ id: payments.id });

    await db
      .update(paymentNotices)
      .set({
        status: "onaylandı",
        resolvedPaymentId: payment.id,
        resolvedByUserId: user.id,
        updatedAt: new Date(),
      })
      .where(eq(paymentNotices.id, noticeId));

    if (invoiceId) await recomputeInvoiceStatus(invoiceId);
    revalidatePath("/koc/muhasebe");
    revalidatePath("/ogrenci/odemeler");
    return { ok: true, data: { noticeId, status: "onaylandı" } };
  });
}
