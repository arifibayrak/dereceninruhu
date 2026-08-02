"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { callAction } from "@/lib/action-client";
import { createCoach } from "@/actions/setup";
import { createCoachSchema, type CreateCoachInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * Koç ekle — ikinci koç hesabını oluşturur (koç/yönetici yetkisi gerekir).
 * Koç başvurusundan "Koça çevir" ile gelindiğinde ad/e-posta ön-dolu olur.
 */
export function CoachAddForm({
  initialName = "",
  initialEmail = "",
}: {
  initialName?: string;
  initialEmail?: string;
} = {}) {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<CreateCoachInput>({
    resolver: zodResolver(createCoachSchema),
    defaultValues: {
      name: initialName,
      email: initialEmail,
      password: "",
      phone: "",
      telegram: "",
      instagram: "",
      iban: "",
    },
  });
  const { errors } = form.formState;

  const onSubmit = async (values: CreateCoachInput) => {
    setSubmitting(true);
    const res = await callAction(createCoach, values);
    setSubmitting(false);
    if (!res.ok) {
      if (res.fieldErrors) {
        const known = [
          "name",
          "email",
          "password",
          "phone",
          "telegram",
          "instagram",
          "iban",
        ] as const;
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          if ((known as readonly string[]).includes(name)) {
            form.setError(name as (typeof known)[number], { message });
          }
        }
      }
      toast.error(res.error);
      return;
    }
    toast.success("Koç hesabı oluşturuldu", {
      description: `${values.email} artık giriş yapabilir.`,
    });
    form.reset();
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <Field data-invalid={errors.name ? true : undefined}>
        <FieldLabel htmlFor="koc-ad">Ad Soyad</FieldLabel>
        <Input
          id="koc-ad"
          autoComplete="off"
          placeholder="Örn. Arif Bayrak"
          aria-invalid={errors.name ? true : undefined}
          {...form.register("name")}
        />
        <FieldError errors={[errors.name]} />
      </Field>
      <Field data-invalid={errors.email ? true : undefined}>
        <FieldLabel htmlFor="koc-eposta">E-posta</FieldLabel>
        <Input
          id="koc-eposta"
          type="email"
          autoComplete="off"
          placeholder="koc@dereceninruhu.com"
          aria-invalid={errors.email ? true : undefined}
          {...form.register("email")}
        />
        <FieldError errors={[errors.email]} />
      </Field>
      <Field data-invalid={errors.password ? true : undefined}>
        <FieldLabel htmlFor="koc-sifre">Geçici şifre</FieldLabel>
        <Input
          id="koc-sifre"
          type="password"
          autoComplete="new-password"
          placeholder="En az 6 karakter"
          aria-invalid={errors.password ? true : undefined}
          {...form.register("password")}
        />
        <FieldError errors={[errors.password]} />
        <FieldDescription>
          Şifreyi yeni koça güvenli bir kanaldan ilet.
        </FieldDescription>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={errors.phone ? true : undefined}>
          <FieldLabel htmlFor="koc-tel">Telefon</FieldLabel>
          <Input
            id="koc-tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="5XX XXX XX XX"
            aria-invalid={errors.phone ? true : undefined}
            {...form.register("phone")}
          />
          <FieldError errors={[errors.phone]} />
        </Field>
        <Field data-invalid={errors.telegram ? true : undefined}>
          <FieldLabel htmlFor="koc-telegram">Telegram</FieldLabel>
          <Input
            id="koc-telegram"
            autoComplete="off"
            placeholder="@kullaniciadi"
            aria-invalid={errors.telegram ? true : undefined}
            {...form.register("telegram")}
          />
          <FieldError errors={[errors.telegram]} />
        </Field>
        <Field data-invalid={errors.instagram ? true : undefined}>
          <FieldLabel htmlFor="koc-instagram">Instagram</FieldLabel>
          <Input
            id="koc-instagram"
            autoComplete="off"
            placeholder="@kullaniciadi"
            aria-invalid={errors.instagram ? true : undefined}
            {...form.register("instagram")}
          />
          <FieldError errors={[errors.instagram]} />
        </Field>
        <Field data-invalid={errors.iban ? true : undefined}>
          <FieldLabel htmlFor="koc-iban">IBAN</FieldLabel>
          <Input
            id="koc-iban"
            autoComplete="off"
            placeholder="TR__ ____ ____ ____ ____ __"
            aria-invalid={errors.iban ? true : undefined}
            {...form.register("iban")}
          />
          <FieldError errors={[errors.iban]} />
        </Field>
      </div>

      <Button type="submit" disabled={submitting} className="self-start">
        <UserPlusIcon data-icon="inline-start" />
        {submitting ? "Oluşturuluyor…" : "Koç ekle"}
      </Button>
    </form>
  );
}
