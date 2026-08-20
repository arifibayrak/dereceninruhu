"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useRefresh } from "@/lib/use-refresh";
import { callAction } from "@/lib/action-client";
import { updateMyContact } from "@/actions/setup";
import {
  updateMyContactSchema,
  type UpdateMyContactInput,
} from "@/lib/validation";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/** Koç kendi iletişim/ödeme bilgisini düzenler (users tablosu; özel). */
export function CoachContactForm({
  initial,
}: {
  initial: UpdateMyContactInput;
}) {
  const { refresh } = useRefresh();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<UpdateMyContactInput>({
    resolver: zodResolver(updateMyContactSchema),
    defaultValues: {
      phone: initial.phone ?? "",
      telegram: initial.telegram ?? "",
      instagram: initial.instagram ?? "",
      calBookingUrl: initial.calBookingUrl ?? "",
      iban: initial.iban ?? "",
    },
  });
  const { errors } = form.formState;

  const onSubmit = async (values: UpdateMyContactInput) => {
    setSubmitting(true);
    const res = await callAction(updateMyContact, values);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("İletişim bilgilerin güncellendi");
    form.reset(values);
    refresh();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={errors.phone ? true : undefined}>
            <FieldLabel htmlFor="koc-c-tel">Telefon</FieldLabel>
            <Input
              id="koc-c-tel"
              inputMode="tel"
              placeholder="5XX XXX XX XX"
              aria-invalid={errors.phone ? true : undefined}
              {...form.register("phone")}
            />
            <FieldError errors={[errors.phone]} />
          </Field>
          <Field data-invalid={errors.telegram ? true : undefined}>
            <FieldLabel htmlFor="koc-c-telegram">Telegram</FieldLabel>
            <Input
              id="koc-c-telegram"
              placeholder="@kullaniciadi"
              aria-invalid={errors.telegram ? true : undefined}
              {...form.register("telegram")}
            />
            <FieldError errors={[errors.telegram]} />
          </Field>
          <Field data-invalid={errors.instagram ? true : undefined}>
            <FieldLabel htmlFor="koc-c-instagram">Instagram</FieldLabel>
            <Input
              id="koc-c-instagram"
              placeholder="@kullaniciadi"
              aria-invalid={errors.instagram ? true : undefined}
              {...form.register("instagram")}
            />
            <FieldError errors={[errors.instagram]} />
          </Field>
          <Field
            className="sm:col-span-2"
            data-invalid={errors.calBookingUrl ? true : undefined}
          >
            <FieldLabel htmlFor="koc-c-cal">Görüşme takvimi (Cal linki)</FieldLabel>
            <Input
              id="koc-c-cal"
              inputMode="url"
              placeholder="https://cal.com/kullaniciadi/haftalik"
              aria-invalid={errors.calBookingUrl ? true : undefined}
              {...form.register("calBookingUrl")}
            />
            <FieldError errors={[errors.calBookingUrl]} />
            <FieldDescription>
              Öğrencilerinin randevu alabilmesi için Cal.com görüşme linkini
              yapıştır — takvimin öğrencinin uygulamasına gömülü gelir.
            </FieldDescription>
          </Field>
          <Field
            className="sm:col-span-2"
            data-invalid={errors.iban ? true : undefined}
          >
            <FieldLabel htmlFor="koc-c-iban">IBAN</FieldLabel>
            <Input
              id="koc-c-iban"
              placeholder="TR__ ____ ____ ____ ____ __"
              aria-invalid={errors.iban ? true : undefined}
              {...form.register("iban")}
            />
            <FieldError errors={[errors.iban]} />
            <FieldDescription>
              Ödeme için — yalnız yönetim panelinde görünür, herkese açık değil.
            </FieldDescription>
          </Field>
        </div>
        <Button type="submit" disabled={submitting} className="self-start">
          <SaveIcon data-icon="inline-start" />
          {submitting ? "Kaydediliyor…" : "İletişimi kaydet"}
        </Button>
      </FieldGroup>
    </form>
  );
}
