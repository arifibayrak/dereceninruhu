"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { BellRingIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createPaymentNotice } from "@/actions/muhasebe";
import { trDayKey } from "@/lib/dates";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/muhasebe";
import { createPaymentNoticeSchema } from "@/lib/validation-muhasebe";
import type { OpenInvoiceOption } from "@/components/app/payment-record-dialog";
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

type FormInput = z.input<typeof createPaymentNoticeSchema>;
type FormOutput = z.output<typeof createPaymentNoticeSchema>;

const METHOD_ITEMS = (
  Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]
).map(([value, label]) => ({ value, label }));

/**
 * Öğrenci "havale/ödeme bildirimi" diyaloğu. Gönderdiğin ödemeyi bildirirsin;
 * koçun onaylayınca hesabına işlenir. Fatura seçersen tutar bakiyeyle öndolar.
 */
export function PaymentNoticeDialog({
  enrollmentId,
  openInvoices,
  defaultInvoiceId,
  triggerLabel = "Ödeme bildir",
  triggerVariant = "default",
  triggerSize = "sm",
}: {
  enrollmentId: number;
  openInvoices: OpenInvoiceOption[];
  defaultInvoiceId?: number;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline";
  triggerSize?: "sm" | "xs";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const todayKey = trDayKey(new Date());

  const defaultInvoice = defaultInvoiceId
    ? openInvoices.find((i) => i.id === defaultInvoiceId)
    : undefined;

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(createPaymentNoticeSchema),
    defaultValues: {
      enrollmentId,
      invoiceId: defaultInvoiceId ?? null,
      amountTl: defaultInvoice?.balanceTl ?? "",
      paidOn: todayKey,
      method: "havale",
      note: "",
    },
  });
  const { errors } = form.formState;

  const invoiceItems = useMemo(
    () => [
      { value: "yok", label: "Faturasız bildirim" },
      ...openInvoices.map((i) => ({ value: String(i.id), label: i.label })),
    ],
    [openInvoices],
  );

  const onSubmit = async (values: FormOutput) => {
    setSubmitting(true);
    const res = await createPaymentNotice(values);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Bildirim gönderildi — koçun onayladığında işlenecek.");
    setOpen(false);
    form.reset();
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button size={triggerSize} variant={triggerVariant} />}
      >
        <BellRingIcon data-icon="inline-start" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ödeme bildir</DialogTitle>
          <DialogDescription>
            Gönderdiğin havale/ödemeyi bildir. Koçun onaylayınca hesabına
            işlenir — bu adım ödemeyi tek başına tamamlamaz.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {openInvoices.length > 0 && (
              <Field>
                <FieldLabel htmlFor="bildir-fatura">Fatura</FieldLabel>
                <Controller
                  control={form.control}
                  name="invoiceId"
                  render={({ field }) => (
                    <Select
                      items={invoiceItems}
                      value={field.value != null ? String(field.value) : "yok"}
                      onValueChange={(value) => {
                        if (value === "yok" || value == null) {
                          field.onChange(null);
                          return;
                        }
                        field.onChange(Number(value));
                        const inv = openInvoices.find(
                          (i) => i.id === Number(value),
                        );
                        if (inv) form.setValue("amountTl", inv.balanceTl);
                      }}
                    >
                      <SelectTrigger id="bildir-fatura" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {invoiceItems.map((i) => (
                          <SelectItem key={i.value} value={i.value}>
                            {i.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldDescription>
                  Hangi fatura için? Seçince tutar bakiyeyle dolar.
                </FieldDescription>
              </Field>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={errors.amountTl ? true : undefined}>
                <FieldLabel htmlFor="bildir-tutar">Tutar (₺) *</FieldLabel>
                <Input
                  id="bildir-tutar"
                  inputMode="decimal"
                  placeholder="Örn. 2.500"
                  aria-invalid={errors.amountTl ? true : undefined}
                  {...form.register("amountTl")}
                />
                <FieldError errors={[errors.amountTl]} />
              </Field>
              <Field data-invalid={errors.paidOn ? true : undefined}>
                <FieldLabel htmlFor="bildir-tarih">Gönderim tarihi *</FieldLabel>
                <Input
                  id="bildir-tarih"
                  type="date"
                  aria-invalid={errors.paidOn ? true : undefined}
                  {...form.register("paidOn")}
                />
                <FieldError errors={[errors.paidOn]} />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={errors.method ? true : undefined}>
                <FieldLabel htmlFor="bildir-yontem">Yöntem *</FieldLabel>
                <Controller
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <Select
                      items={METHOD_ITEMS}
                      value={field.value ?? "havale"}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger id="bildir-yontem" className="w-full">
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
                <FieldLabel htmlFor="bildir-not">Not / dekont no</FieldLabel>
                <Input
                  id="bildir-not"
                  placeholder="Örn. dekont referansı"
                  {...form.register("note")}
                />
                <FieldError errors={[errors.note]} />
              </Field>
            </div>

            <Button type="submit" disabled={submitting} className="self-start">
              {submitting ? "Gönderiliyor…" : "Bildirimi gönder"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
