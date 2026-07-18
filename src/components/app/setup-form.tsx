"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { RocketIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { setupFirstAdmin } from "@/actions/setup";
import { authClient } from "@/lib/auth-client";
import { setupAdminSchema, type SetupAdminInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/** İlk kurulum formu — ilk yönetici (koç) hesabını oluşturur ve giriş yapar. */
export function SetupForm() {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<SetupAdminInput>({
    resolver: zodResolver(setupAdminSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const { errors } = form.formState;

  const onSubmit = async (values: SetupAdminInput) => {
    setSubmitting(true);
    const res = await setupFirstAdmin(values);
    if (!res.ok) {
      setSubmitting(false);
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

    const signInRes = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });
    if (signInRes.error) {
      toast.error("Hesap oluştu; giriş sayfasından devam et.");
      window.location.assign("/giris");
      return;
    }
    toast.success("Kurulum tamam! Hoş geldin 👋");
    window.location.assign("/koc");
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      noValidate
    >
      <Field data-invalid={errors.name ? true : undefined}>
        <FieldLabel htmlFor="kurulum-ad">Ad Soyad</FieldLabel>
        <Input
          id="kurulum-ad"
          autoComplete="name"
          placeholder="Örn. Ahmet Yılmaz"
          aria-invalid={errors.name ? true : undefined}
          className="h-11"
          {...form.register("name")}
        />
        <FieldError errors={[errors.name]} />
      </Field>
      <Field data-invalid={errors.email ? true : undefined}>
        <FieldLabel htmlFor="kurulum-eposta">E-posta</FieldLabel>
        <Input
          id="kurulum-eposta"
          type="email"
          autoComplete="email"
          placeholder="sen@dereceninruhu.com"
          aria-invalid={errors.email ? true : undefined}
          className="h-11"
          {...form.register("email")}
        />
        <FieldError errors={[errors.email]} />
        <FieldDescription>Bu e-posta ile giriş yapacaksın.</FieldDescription>
      </Field>
      <Field data-invalid={errors.password ? true : undefined}>
        <FieldLabel htmlFor="kurulum-sifre">Şifre</FieldLabel>
        <Input
          id="kurulum-sifre"
          type="password"
          autoComplete="new-password"
          placeholder="En az 6 karakter"
          aria-invalid={errors.password ? true : undefined}
          className="h-11"
          {...form.register("password")}
        />
        <FieldError errors={[errors.password]} />
      </Field>
      <Button type="submit" size="lg" disabled={submitting} className="h-11 w-full">
        <RocketIcon data-icon="inline-start" />
        {submitting ? "Kuruluyor…" : "Kurulumu tamamla"}
      </Button>
    </form>
  );
}
