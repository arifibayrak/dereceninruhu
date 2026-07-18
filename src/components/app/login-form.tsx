"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogInIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { normalizePhone, phoneToEmail } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const loginFormSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "Telefon numaranı (veya koç e-postanı) gir."),
  pin: z.string().min(4, "PIN en az 4 karakter olmalı."),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

/** Telefon + PIN girişi; koçlar e-posta + şifre ile de girebilir. */
export function LoginForm() {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { identifier: "", pin: "" },
  });
  const { errors } = form.formState;

  const onSubmit = async (values: LoginFormValues) => {
    let email: string;
    if (values.identifier.includes("@")) {
      email = values.identifier;
    } else {
      const phone = normalizePhone(values.identifier);
      if (!/^5\d{9}$/.test(phone)) {
        form.setError("identifier", {
          message: "Geçerli bir cep telefonu girin (5XX XXX XX XX).",
        });
        return;
      }
      email = phoneToEmail(phone);
    }

    setSubmitting(true);
    const res = await authClient.signIn.email({ email, password: values.pin });
    if (res.error) {
      setSubmitting(false);
      form.setError("pin", { message: "Telefon/e-posta veya PIN hatalı." });
      return;
    }

    let role = (res.data?.user as { role?: string } | undefined)?.role;
    if (!role) {
      const session = await authClient.getSession();
      role = (session.data?.user as { role?: string } | undefined)?.role;
    }
    toast.success("Hoş geldin!");
    window.location.assign(role === "coach" || role === "admin" ? "/koc" : "/ogrenci");
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      noValidate
    >
      <Field data-invalid={errors.identifier ? true : undefined}>
        <FieldLabel htmlFor="giris-telefon">Telefon numarası</FieldLabel>
        <Input
          id="giris-telefon"
          inputMode="tel"
          autoComplete="username"
          placeholder="5XX XXX XX XX"
          aria-invalid={errors.identifier ? true : undefined}
          className="h-11"
          {...form.register("identifier")}
        />
        <FieldError errors={[errors.identifier]} />
        <FieldDescription>Koçlar e-posta adresiyle giriş yapar.</FieldDescription>
      </Field>
      <Field data-invalid={errors.pin ? true : undefined}>
        <FieldLabel htmlFor="giris-pin">PIN</FieldLabel>
        <Input
          id="giris-pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          placeholder="••••"
          aria-invalid={errors.pin ? true : undefined}
          className="h-11"
          {...form.register("pin")}
        />
        <FieldError errors={[errors.pin]} />
      </Field>
      <Button type="submit" size="lg" disabled={submitting} className="h-11 w-full">
        <LogInIcon data-icon="inline-start" />
        {submitting ? "Giriş yapılıyor…" : "Giriş yap"}
      </Button>
    </form>
  );
}
