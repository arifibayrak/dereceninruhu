/**
 * Otomatik yinelenen faturalama motoru (abonelik). Sunucu-only (getDb kullanır).
 * Koç durdurmadıkça (autoRenew) haftalık/aylık planlar için, her dönemin
 * gününde fatura kendiliğinden kesilir. Idempotent — bkz. generateDueInvoices.
 */
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { feePlans, invoices } from "@/db/schema";
import { startOfTrtDay } from "@/lib/dates";
import {
  advanceBillingDate,
  billingPeriodLabel,
  RECURRING_BILLING_TYPES,
} from "@/lib/muhasebe";

export type BillingRunResult = {
  plansProcessed: number;
  invoicesCreated: number;
};

// Gecikmiş dönemleri toparlarken sonsuz döngü koruması (aylık ~2 yıl).
const MAX_CATCHUP_CYCLES = 24;

/**
 * Vadesi gelen (nextBillingOn ≤ bugün) tüm aktif + otomatik yenilenen
 * haftalık/aylık planlar için fatura üretir; nextBillingOn'u bir sonraki döneme
 * ilerletir. Idempotent: (feePlanId + periodLabel) zaten varsa kopya kesmez, bu
 * yüzden günde birden çok kez güvenle çalıştırılabilir.
 */
export async function generateDueInvoices(
  now: Date = new Date(),
): Promise<BillingRunResult> {
  const db = getDb();
  const today = startOfTrtDay(now);

  const plans = await db
    .select()
    .from(feePlans)
    .where(
      and(
        eq(feePlans.isActive, true),
        eq(feePlans.autoRenew, true),
        inArray(feePlans.billingType, RECURRING_BILLING_TYPES),
      ),
    );

  let invoicesCreated = 0;
  let plansProcessed = 0;

  for (const plan of plans) {
    if (!plan.nextBillingOn) continue;
    if (plan.billingType !== "haftalık" && plan.billingType !== "aylık") {
      continue;
    }

    let cursor = startOfTrtDay(plan.nextBillingOn);
    let cycles = 0;
    let advanced = false;

    while (cursor.getTime() <= today.getTime() && cycles < MAX_CATCHUP_CYCLES) {
      const label = billingPeriodLabel(cursor, plan.billingType);
      const existing = await db.query.invoices.findFirst({
        where: and(
          eq(invoices.feePlanId, plan.id),
          eq(invoices.periodLabel, label),
        ),
      });
      if (!existing) {
        await db.insert(invoices).values({
          enrollmentId: plan.enrollmentId,
          feePlanId: plan.id,
          periodLabel: label,
          amountKurus: plan.amountKurus,
          issuedOn: cursor,
          dueOn: cursor,
          status: "gönderildi",
        });
        invoicesCreated++;
      }
      cursor = advanceBillingDate(cursor, plan.billingType);
      advanced = true;
      cycles++;
    }

    if (advanced) {
      await db
        .update(feePlans)
        .set({ nextBillingOn: cursor, updatedAt: new Date() })
        .where(eq(feePlans.id, plan.id));
      plansProcessed++;
    }
  }

  return { plansProcessed, invoicesCreated };
}
