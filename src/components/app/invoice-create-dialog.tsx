"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReceiptTextIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createInvoice } from "@/actions/muhasebe";
import { trDayKey } from "@/lib/dates";
import { createInvoiceSchema } from "@/lib/validation-muhasebe";
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

type FormInput = z.input<typeof createInvoiceSchema>;
type FormOutput = z.output<typeof createInvoiceSchema>;

export type StudentOption = { enrollmentId: number; label: string };

const STATUS_ITEMS = [
  { value: "gönderildi", label: "Gönderildi" },
  { value: "taslak", label: "Taslak" },
] as const;

/**
 * Fatura kesme diyaloğu. `students` verilirse öğrenci seçtirir;
 * `fixedEnrollmentId` verilirse (kokpit) seçim gizlenir.
 */
export function InvoiceCreateDialog({
  students,
  fixedEnrollmentId,
  defaultAmountTl,
  defaultPeriodLabel,
  triggerLabel = "Fatura kes",
}: {
  students?: StudentOption[];
  fixedEnrollmentId?: number;
  defaultAmountTl?: string;
  defaultPeriodLabel?: string;
  triggerLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const todayKey = trDayKey(new Date());

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      enrollmentId: fixedEnrollmentId,
      periodLabel: defaultPeriodLabel ?? "",
      amountTl: defaultAmountTl ?? "",
      issuedOn: todayKey,
      dueOn: "",
      status: "gönderildi",
    },
  });
  const { errors } = form.formState;

  const onSubmit = async (values: FormOutput) => {
    setSubmitting(true);
    const res = await createInvoice(values);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Fatura oluşturuldu");
    setOpen(false);
    form.reset();
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <ReceiptTextIcon data-icon="inline-start" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fatura kes</DialogTitle>
          <DialogDescription>
            Tutarı ₺ olarak gir; sistem kuruş hassasiyetinde saklar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {!fixedEnrollmentId && (
              <Field data-invalid={errors.enrollmentId ? true : undefined}>
                <FieldLabel htmlFor="fat-ogrenci">Öğrenci *</FieldLabel>
                <Controller
                  control={form.control}
                  name="enrollmentId"
                  render={({ field }) => (
                    <Select
                      items={(students ?? []).map((s) => ({
                        value: String(s.enrollmentId),
                        label: s.label,
                      }))}
                      value={field.value != null ? String(field.value) : null}
                      onValueChange={(value) =>
                        field.onChange(value != null ? Number(value) : undefined)
                      }
                    >
                      <SelectTrigger
                        id="fat-ogrenci"
                        className="w-full"
                        aria-invalid={errors.enrollmentId ? true : undefined}
                      >
                        <SelectValue placeholder="Öğrenci seç" />
                      </SelectTrigger>
                      <SelectContent>
                        {(students ?? []).map((s) => (
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

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={errors.amountTl ? true : undefined}>
                <FieldLabel htmlFor="fat-tutar">Tutar (₺) *</FieldLabel>
                <Input
                  id="fat-tutar"
                  inputMode="decimal"
                  placeholder="Örn. 2.500"
                  aria-invalid={errors.amountTl ? true : undefined}
                  {...form.register("amountTl")}
                />
                <FieldError errors={[errors.amountTl]} />
              </Field>
              <Field data-invalid={errors.periodLabel ? true : undefined}>
                <FieldLabel htmlFor="fat-donem">Dönem</FieldLabel>
                <Input
                  id="fat-donem"
                  placeholder="Örn. Temmuz 2026"
                  {...form.register("periodLabel")}
                />
                <FieldError errors={[errors.periodLabel]} />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={errors.issuedOn ? true : undefined}>
                <FieldLabel htmlFor="fat-tarih">Fatura tarihi *</FieldLabel>
                <Input
                  id="fat-tarih"
                  type="date"
                  aria-invalid={errors.issuedOn ? true : undefined}
                  {...form.register("issuedOn")}
                />
                <FieldError errors={[errors.issuedOn]} />
              </Field>
              <Field data-invalid={errors.dueOn ? true : undefined}>
                <FieldLabel htmlFor="fat-vade">Vade tarihi</FieldLabel>
                <Controller
                  control={form.control}
                  name="dueOn"
                  render={({ field }) => (
                    <Input
                      id="fat-vade"
                      type="date"
                      value={typeof field.value === "string" ? field.value : ""}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? null : e.target.value)
                      }
                    />
                  )}
                />
                <FieldError errors={[errors.dueOn]} />
                <FieldDescription>
                  Boş bırakılırsa gecikme takibi yapılmaz.
                </FieldDescription>
              </Field>
            </div>

            <Field data-invalid={errors.status ? true : undefined}>
              <FieldLabel htmlFor="fat-durum">Durum</FieldLabel>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select
                    items={[...STATUS_ITEMS]}
                    value={field.value ?? "gönderildi"}
                    onValueChange={(value) => field.onChange(value)}
                  >
                    <SelectTrigger id="fat-durum" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_ITEMS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.status]} />
            </Field>

            <Button type="submit" disabled={submitting} className="self-start">
              {submitting ? "Oluşturuluyor…" : "Faturayı oluştur"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
