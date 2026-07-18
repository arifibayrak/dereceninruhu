"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { upsertFeePlan } from "@/actions/muhasebe";
import { BILLING_TYPE_LABELS, type BillingType } from "@/lib/muhasebe";
import { upsertFeePlanSchema } from "@/lib/validation-muhasebe";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BILLING_ITEMS = (
  Object.entries(BILLING_TYPE_LABELS) as [BillingType, string][]
).map(([value, label]) => ({ value, label }));

type FormInput = z.input<typeof upsertFeePlanSchema>;
type FormOutput = z.output<typeof upsertFeePlanSchema>;

export type FeePlanDefaults = {
  feePlanId: number;
  billingType: BillingType;
  amountTl: string;
  periodMonths: number | null;
  dueDay: number | null;
};

/** Kokpit muhasebe sekmesi — ücret planı oluştur/düzenle diyaloğu. */
export function FeePlanDialog({
  enrollmentId,
  plan,
}: {
  enrollmentId: number;
  plan: FeePlanDefaults | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(upsertFeePlanSchema),
    defaultValues: {
      feePlanId: plan?.feePlanId,
      enrollmentId,
      billingType: plan?.billingType ?? "aylık",
      amountTl: plan?.amountTl ?? "",
      periodMonths: plan?.periodMonths ?? undefined,
      dueDay: plan?.dueDay ?? undefined,
    },
  });
  const { errors } = form.formState;
  const billingType = useWatch({ control: form.control, name: "billingType" });

  const onSubmit = async (values: FormOutput) => {
    setSubmitting(true);
    const res = await upsertFeePlan(values);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(plan ? "Ücret planı güncellendi" : "Ücret planı oluşturuldu");
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={plan ? "outline" : "default"} size="sm" />}>
        {plan ? (
          <PencilIcon data-icon="inline-start" />
        ) : (
          <PlusIcon data-icon="inline-start" />
        )}
        {plan ? "Planı düzenle" : "Ücret planı oluştur"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{plan ? "Ücret planını düzenle" : "Ücret planı"}</DialogTitle>
          <DialogDescription>
            Faturalar bu plandaki tutarı öntanımlı alır.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={errors.billingType ? true : undefined}>
              <FieldLabel htmlFor="plan-tip">Ücretlendirme *</FieldLabel>
              <Controller
                control={form.control}
                name="billingType"
                render={({ field }) => (
                  <Select
                    items={BILLING_ITEMS}
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                  >
                    <SelectTrigger id="plan-tip" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BILLING_ITEMS.map((b) => (
                        <SelectItem key={b.value} value={b.value}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.billingType]} />
            </Field>

            <Field data-invalid={errors.amountTl ? true : undefined}>
              <FieldLabel htmlFor="plan-tutar">Tutar (₺) *</FieldLabel>
              <Input
                id="plan-tutar"
                inputMode="decimal"
                placeholder="Örn. 2.500"
                aria-invalid={errors.amountTl ? true : undefined}
                {...form.register("amountTl")}
              />
              <FieldError errors={[errors.amountTl]} />
              <FieldDescription>
                {billingType === "aylık"
                  ? "Aylık ücret."
                  : billingType === "paket"
                    ? "Paketin toplam ücreti."
                    : "Tek seferlik toplam ücret."}
              </FieldDescription>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              {billingType === "paket" && (
                <Field data-invalid={errors.periodMonths ? true : undefined}>
                  <FieldLabel htmlFor="plan-donem">Dönem (ay) *</FieldLabel>
                  <Input
                    id="plan-donem"
                    type="number"
                    min={1}
                    max={36}
                    placeholder="Örn. 6"
                    aria-invalid={errors.periodMonths ? true : undefined}
                    {...form.register("periodMonths")}
                  />
                  <FieldError errors={[errors.periodMonths]} />
                </Field>
              )}
              <Field data-invalid={errors.dueDay ? true : undefined}>
                <FieldLabel htmlFor="plan-vade">Vade günü</FieldLabel>
                <Input
                  id="plan-vade"
                  type="number"
                  min={1}
                  max={28}
                  placeholder="Örn. 5"
                  aria-invalid={errors.dueDay ? true : undefined}
                  {...form.register("dueDay")}
                />
                <FieldError errors={[errors.dueDay]} />
                <FieldDescription>Ayın kaçında fatura vadesi dolsun (1–28).</FieldDescription>
              </Field>
            </div>

            <Button type="submit" disabled={submitting} className="self-start">
              {submitting ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
