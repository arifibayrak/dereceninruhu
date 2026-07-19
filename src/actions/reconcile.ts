"use server";

import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import { enrollments, invoices, payments } from "@/db/schema";
import { getEnrollmentOptions, OPEN_STATUSES } from "@/db/queries/muhasebe";
import {
  matchSender,
  parseStatementCsv,
  type RosterEntry,
} from "@/lib/reconcile";
import { extractTransfersFromText } from "@/lib/ai/statement";
import { startOfTrtDay } from "@/lib/dates";
import { resolveInvoiceStatus } from "@/lib/muhasebe";
import {
  actionError,
  guarded,
  requireAdmin,
  type ActionResult,
} from "@/actions/_guard";

/**
 * Banka ekstresi mutabakatı (YALNIZ YÖNETİCİ). İki adım, stateless:
 *  1) previewStatement — CSV/tablo ya da serbest-metin ayrıştır, gelen havaleleri
 *     gönderen adına göre kadroyla eşleştir. HİÇBİR ŞEY YAZMAZ.
 *  2) commitReconciliation — koç önizlemede onayladığı satırları `payments`
 *     tablosuna 'havale' olarak kaydeder. Aynı gün+tutar+öğrenci varsa atlar.
 */

export type PreviewTransfer = {
  index: number;
  date: string | null;
  amountKurus: number;
  senderName: string;
  /** Otomatik eşleşen kayıt (belirsizse null → koç seçer). */
  matchedEnrollmentId: number | null;
  matchedLabel: string | null;
  /** Aynı skorla birden çok öğrenciye uydu — koç seçmeli. */
  ambiguous: boolean;
};

export type ReconcilePreview = {
  transfers: PreviewTransfer[];
  roster: RosterEntry[];
  warnings: string[];
};

const previewSchema = z.object({
  text: z.string().trim().min(1).max(200_000),
  mode: z.enum(["csv", "text"]),
});

export async function previewStatement(
  input: unknown,
): Promise<ActionResult<ReconcilePreview>> {
  return guarded(async () => {
    await requireAdmin();
    const parsed = previewSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const { text, mode } = parsed.data;

    // Yönetici: tüm aktif kadro (gizli/pasif öğrenciler zaten hariç).
    const roster = await getEnrollmentOptions(null);

    const warnings: string[] = [];
    let transfers;
    if (mode === "csv") {
      const res = parseStatementCsv(text);
      transfers = res.transfers;
      warnings.push(...res.warnings);
    } else {
      transfers = await extractTransfersFromText(text);
      if (transfers.length === 0) {
        warnings.push("Metinden gelen işlem çıkarılamadı — CSV/tablo yapıştırmayı dene.");
      }
    }

    const preview: PreviewTransfer[] = transfers.map((t, i) => {
      const m = matchSender(t.senderName, roster);
      const matched = !m.ambiguous ? m.match : null;
      return {
        index: i,
        date: t.date,
        amountKurus: t.amountKurus,
        senderName: t.senderName,
        matchedEnrollmentId: matched?.enrollmentId ?? null,
        matchedLabel: matched?.label ?? null,
        ambiguous: m.ambiguous,
      };
    });

    return { ok: true, data: { transfers: preview, roster, warnings } };
  });
}

/** Kaydın EN ESKİ açık (bakiyesi kalan) faturası — otomatik eşleme hedefi. */
async function findOldestOpenInvoiceId(
  enrollmentId: number,
): Promise<number | null> {
  const db = getDb();
  const open = await db
    .select({ id: invoices.id, amountKurus: invoices.amountKurus })
    .from(invoices)
    .where(
      and(
        eq(invoices.enrollmentId, enrollmentId),
        inArray(invoices.status, OPEN_STATUSES),
      ),
    )
    .orderBy(asc(invoices.issuedOn), asc(invoices.id));
  if (open.length === 0) return null;

  const ids = open.map((o) => o.id);
  const paidRows = await db
    .select({
      invoiceId: payments.invoiceId,
      paid: sql<number>`coalesce(sum(${payments.amountKurus}), 0)`,
    })
    .from(payments)
    .where(inArray(payments.invoiceId, ids))
    .groupBy(payments.invoiceId);
  const paidBy = new Map<number, number>();
  for (const r of paidRows) {
    if (r.invoiceId != null) paidBy.set(r.invoiceId, Number(r.paid));
  }
  // En eskiden yeniye: ilk bakiyesi kalan faturayı döndür.
  for (const inv of open) {
    if (inv.amountKurus - (paidBy.get(inv.id) ?? 0) > 0) return inv.id;
  }
  return null;
}

/** Faturanın ödeme durumunu yeniden hesapla (ödeme bağlandıktan sonra). */
async function recomputeInvoice(invoiceId: number, now: Date): Promise<void> {
  const db = getDb();
  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
  });
  if (!invoice) return;
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
}

const commitSchema = z.object({
  rows: z
    .array(
      z.object({
        enrollmentId: z.coerce.number().int().positive(),
        amountKurus: z.coerce.number().int().positive(),
        paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD olmalı"),
        senderName: z.string().trim().max(200).optional().default(""),
      }),
    )
    .min(1, "En az bir satır seç.")
    .max(500),
});

export async function commitReconciliation(
  input: unknown,
): Promise<ActionResult<{ recorded: number; skipped: number; linked: number }>> {
  return guarded(async () => {
    const user = await requireAdmin();
    const parsed = commitSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const db = getDb();
    const now = new Date();

    let recorded = 0;
    let skipped = 0;
    let linked = 0;
    for (const row of parsed.data.rows) {
      const enr = await db.query.enrollments.findFirst({
        where: eq(enrollments.id, row.enrollmentId),
        columns: { id: true },
      });
      if (!enr) {
        skipped++;
        continue;
      }
      const paidOn = startOfTrtDay(new Date(row.paidOn));

      // İdempotensi: aynı öğrenci + tutar + gün + havale zaten varsa tekrar yazma
      // (ekstre yanlışlıkla iki kez yüklenirse ödemeler çiftlenmesin).
      const dup = await db.query.payments.findFirst({
        where: and(
          eq(payments.enrollmentId, row.enrollmentId),
          eq(payments.amountKurus, row.amountKurus),
          eq(payments.paidOn, paidOn),
          eq(payments.method, "havale"),
        ),
        columns: { id: true },
      });
      if (dup) {
        skipped++;
        continue;
      }

      // Ödemeyi öğrencinin EN ESKİ açık faturasına otomatik bağla (varsa).
      const invoiceId = await findOldestOpenInvoiceId(row.enrollmentId);

      await db.insert(payments).values({
        enrollmentId: row.enrollmentId,
        invoiceId,
        amountKurus: row.amountKurus,
        paidOn,
        method: "havale",
        receivedByUserId: user.id,
        note: row.senderName ? `Ekstre mutabakatı · ${row.senderName}` : "Ekstre mutabakatı",
      });
      recorded++;
      if (invoiceId) {
        await recomputeInvoice(invoiceId, now);
        linked++;
      }
    }

    revalidatePath("/koc/muhasebe");
    revalidatePath("/koc/muhasebe/odemeler");
    revalidatePath("/koc/muhasebe/faturalar");
    return { ok: true, data: { recorded, skipped, linked } };
  });
}
