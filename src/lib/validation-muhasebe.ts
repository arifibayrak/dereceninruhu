import { z } from "zod";
import { parseTryToKurus } from "@/lib/muhasebe";

/**
 * Faz 4 — muhasebe Zod şemaları. UI ₺ metni girer; şema kuruş'a çevirir
 * (money = integer kuruş, asla float — bkz. AGENTS.md).
 */

/** "2.500,50" → 250050 kuruş; geçersizse alan hatası üretir. */
export const tlToKurusSchema = z
  .string()
  .trim()
  .min(1, "Tutar gerekli.")
  .transform((v, ctx) => {
    const kurus = parseTryToKurus(v);
    if (kurus === null) {
      ctx.addIssue({ code: "custom", message: "Geçerli bir tutar girin (örn. 2.500 veya 2500,50)." });
      return z.NEVER;
    }
    return kurus;
  });

/** Pozitif tutar (0 ₺ fatura/ödeme yok). */
export const positiveTlToKurusSchema = tlToKurusSchema.refine((k) => k > 0, {
  message: "Tutar 0'dan büyük olmalı.",
});

export const billingTypeSchema = z.enum(["aylık", "paket", "tek_seferlik"]);
export const invoiceStatusSchema = z.enum([
  "taslak",
  "gönderildi",
  "ödendi",
  "gecikmiş",
  "iptal",
]);
export const paymentMethodSchema = z.enum(["havale", "nakit", "kart", "diğer"]);

/** Ücret planı — kayıt başına tek aktif plan; verilirse feePlanId günceller. */
export const upsertFeePlanSchema = z
  .object({
    feePlanId: z.coerce.number().int().positive().optional(),
    enrollmentId: z.coerce.number().int().positive(),
    billingType: billingTypeSchema,
    amountTl: positiveTlToKurusSchema,
    periodMonths: z.coerce.number().int().min(1).max(36).nullish(),
    dueDay: z.coerce.number().int().min(1).max(28).nullish(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => v.billingType !== "paket" || v.periodMonths != null, {
    message: "Paket planlarda dönem (ay) gerekli.",
    path: ["periodMonths"],
  });
export type UpsertFeePlanInput = z.input<typeof upsertFeePlanSchema>;

/** Fatura kesme. */
export const createInvoiceSchema = z.object({
  enrollmentId: z.coerce.number().int().positive(),
  periodLabel: z.string().trim().max(60).optional().or(z.literal("")),
  amountTl: positiveTlToKurusSchema,
  issuedOn: z.coerce.date(),
  dueOn: z.coerce.date().nullish(),
  status: z.enum(["taslak", "gönderildi"]).default("gönderildi"),
});
export type CreateInvoiceInput = z.input<typeof createInvoiceSchema>;

/** Fatura durumu — elle geçişler (ödendi'yi ödeme kaydı üretir ama serbest). */
export const updateInvoiceStatusSchema = z.object({
  invoiceId: z.coerce.number().int().positive(),
  status: invoiceStatusSchema,
});
export type UpdateInvoiceStatusInput = z.input<typeof updateInvoiceStatusSchema>;

/** Fatura iptali. */
export const voidInvoiceSchema = z.object({
  invoiceId: z.coerce.number().int().positive(),
});

/** Ödeme kaydı — faturasız (serbest) ödeme de olabilir. */
export const recordPaymentSchema = z.object({
  enrollmentId: z.coerce.number().int().positive(),
  invoiceId: z.coerce.number().int().positive().nullish(),
  amountTl: positiveTlToKurusSchema,
  paidOn: z.coerce.date(),
  method: paymentMethodSchema,
  note: z.string().trim().max(200).optional().or(z.literal("")),
});
export type RecordPaymentInput = z.input<typeof recordPaymentSchema>;
