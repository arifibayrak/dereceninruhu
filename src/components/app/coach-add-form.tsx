"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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

/** Koç ekle — ikinci koç hesabını oluşturur (koç/yönetici yetkisi gerekir). */
export function CoachAddForm() {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<CreateCoachInput>({
    resolver: zodResolver(createCoachSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const { errors } = form.formState;

  const onSubmit = async (values: CreateCoachInput) => {
    setSubmitting(true);
    const res = await createCoach(values);
    setSubmitting(false);
    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          if (name === "name" || name === "email" || name === "password") {
            form.setError(name, { message });
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
      <Button type="submit" disabled={submitting} className="self-start">
        <UserPlusIcon data-icon="inline-start" />
        {submitting ? "Oluşturuluyor…" : "Koç ekle"}
      </Button>
    </form>
  );
}
