"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { BanknoteIcon } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { callAction } from "@/lib/action-client";
import { recordPayment } from "@/actions/muhasebe";
import { trDayKey } from "@/lib/dates";
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/muhasebe";
import { recordPaymentSchema } from "@/lib/validation-muhasebe";
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

type FormInput = z.input<typeof recordPaymentSchema>;
type FormOutput = z.output<typeof recordPaymentSchema>;

export type OpenInvoiceOption = {
  id: number;
  label: string;
  /** Kalan bakiye, form öndoldurması için ₺ metni. */
  balanceTl: string;
};

export type PaymentStudentOption = {
  enrollmentId: number;
  label: string;
  openInvoices: OpenInvoiceOption[];
};

const METHOD_ITEMS = (
  Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]
).map(([value, label]) => ({ value, label }));

/**
 * Ödeme kaydı diyaloğu. Öğrenci seçilince açık faturaları listelenir;
 * fatura seçilince tutar kalan bakiye ile öndolar. Faturasız ödeme de olur.
 */
export function PaymentRecordDialog({
  students,
  fixedEnrollmentId,
  defaultInvoiceId,
  triggerLabel = "Ödeme al",
  triggerVariant = "default",
}: {
  students: PaymentStudentOption[];
  fixedEnrollmentId?: number;
  defaultInvoiceId?: number;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const todayKey = trDayKey(new Date());

  const defaultStudent = fixedEnrollmentId
    ? students.find((s) => s.enrollmentId === fixedEnrollmentId)
    : undefined;
  const defaultInvoice = defaultInvoiceId
    ? defaultStudent?.openInvoices.find((i) => i.id === defaultInvoiceId)
    : undefined;

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      enrollmentId: fixedEnrollmentId,
      invoiceId: defaultInvoiceId ?? null,
      amountTl: defaultInvoice?.balanceTl ?? "",
      paidOn: todayKey,
      method: "havale",
      note: "",
    },
  });
  const { errors } = form.formState;
  const enrollmentId = useWatch({ control: form.control, name: "enrollmentId" });

  const selectedStudent = useMemo(
    () => students.find((s) => s.enrollmentId === Number(enrollmentId)),
    [students, enrollmentId],
  );

  const onSubmit = async (values: FormOutput) => {
    setSubmitting(true);
    const res = await callAction(recordPayment, values);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(
      res.data.invoiceStatus === "ödendi"
        ? "Ödeme kaydedildi — fatura kapandı 🎉"
        : "Ödeme kaydedildi",
    );
    setOpen(false);
    form.reset();
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant={triggerVariant} />}>
        <BanknoteIcon data-icon="inline-start" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ödeme kaydet</DialogTitle>
          <DialogDescription>
            Fatura seçersen tutar kalan bakiyeyle dolar; faturasız ödeme de
            kaydedebilirsin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {!fixedEnrollmentId && (
              <Field data-invalid={errors.enrollmentId ? true : undefined}>
                <FieldLabel htmlFor="ode-ogrenci">Öğrenci *</FieldLabel>
                <Controller
                  control={form.control}
                  name="enrollmentId"
                  render={({ field }) => (
                    <Select
                      items={students.map((s) => ({
                        value: String(s.enrollmentId),
                        label: s.label,
                      }))}
                      value={field.value != null ? String(field.value) : null}
                      onValueChange={(value) => {
                        field.onChange(value != null ? Number(value) : undefined);
                        form.setValue("invoiceId", null);
                      }}
                    >
                      <SelectTrigger
                        id="ode-ogrenci"
                        className="w-full"
                        aria-invalid={errors.enrollmentId ? true : undefined}
                      >
                        <SelectValue placeholder="Öğrenci seç" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem
                            key={s.enrollmentId}
                            value={String(s.enrollmentId)}
                          >
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.enrollmentId]} />
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="ode-fatura">Fatura</FieldLabel>
              <Controller
                control={form.control}
                name="invoiceId"
                render={({ field }) => (
                  <Select
                    items={[
                      { value: "yok", label: "Faturasız ödeme" },
                      ...(selectedStudent?.openInvoices ?? []).map((i) => ({
                        value: String(i.id),
                        label: i.label,
                      })),
                    ]}
                    value={field.value != null ? String(field.value) : "yok"}
                    onValueChange={(value) => {
                      if (value === "yok" || value == null) {
                        field.onChange(null);
                        return;
                      }
                      field.onChange(Number(value));
                      const inv = selectedStudent?.openInvoices.find(
                        (i) => i.id === Number(value),
                      );
                      if (inv) form.setValue("amountTl", inv.balanceTl);
                    }}
                  >
                    <SelectTrigger id="ode-fatura" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yok">Faturasız ödeme</SelectItem>
                      {(selectedStudent?.openInvoices ?? []).map((i) => (
                        <SelectItem key={i.id} value={String(i.id)}>
                          {i.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldDescription>
                Yalnız açık (ödenmemiş) faturalar listelenir.
              </FieldDescription>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={errors.amountTl ? true : undefined}>
                <FieldLabel htmlFor="ode-tutar">Tutar (₺) *</FieldLabel>
                <Input
                  id="ode-tutar"
                  inputMode="decimal"
                  placeholder="Örn. 2.500"
                  aria-invalid={errors.amountTl ? true : undefined}
                  {...form.register("amountTl")}
                />
                <FieldError errors={[errors.amountTl]} />
              </Field>
              <Field data-invalid={errors.paidOn ? true : undefined}>
                <FieldLabel htmlFor="ode-tarih">Ödeme tarihi *</FieldLabel>
                <Input
                  id="ode-tarih"
                  type="date"
                  aria-invalid={errors.paidOn ? true : undefined}
                  {...form.register("paidOn")}
                />
                <FieldError errors={[errors.paidOn]} />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={errors.method ? true : undefined}>
                <FieldLabel htmlFor="ode-yontem">Yöntem *</FieldLabel>
                <Controller
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <Select
                      items={METHOD_ITEMS}
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger id="ode-yontem" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {METHOD_ITEMS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.method]} />
              </Field>
              <Field data-invalid={errors.note ? true : undefined}>
                <FieldLabel htmlFor="ode-not">Not / referans</FieldLabel>
                <Input
                  id="ode-not"
                  placeholder="Örn. dekont no"
                  {...form.register("note")}
                />
                <FieldError errors={[errors.note]} />
              </Field>
            </div>

            <Button type="submit" disabled={submitting} className="self-start">
              {submitting ? "Kaydediliyor…" : "Ödemeyi kaydet"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
