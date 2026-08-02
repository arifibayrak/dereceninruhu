"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldPlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { callAction } from "@/lib/action-client";
import { createAdmin } from "@/actions/admin";
import {
  createAdminSchema,
  type CreateAdminInput,
} from "@/lib/validation-admin";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/** Yönetici ekle — yalnız mevcut yönetici yeni yönetici hesabı açabilir. */
export function AdminAddForm() {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<CreateAdminInput>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const { errors } = form.formState;

  const onSubmit = async (values: CreateAdminInput) => {
    setSubmitting(true);
    const res = await callAction(createAdmin, values);
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
    toast.success("Yönetici hesabı oluşturuldu", {
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
        <FieldLabel htmlFor="yonetici-ad">Ad Soyad</FieldLabel>
        <Input
          id="yonetici-ad"
          autoComplete="off"
          placeholder="Örn. Ahmet Yılmaz"
          aria-invalid={errors.name ? true : undefined}
          {...form.register("name")}
        />
        <FieldError errors={[errors.name]} />
      </Field>
      <Field data-invalid={errors.email ? true : undefined}>
        <FieldLabel htmlFor="yonetici-eposta">E-posta</FieldLabel>
        <Input
          id="yonetici-eposta"
          type="email"
          autoComplete="off"
          placeholder="yonetici@dereceninruhu.com"
          aria-invalid={errors.email ? true : undefined}
          {...form.register("email")}
        />
        <FieldError errors={[errors.email]} />
      </Field>
      <Field data-invalid={errors.password ? true : undefined}>
        <FieldLabel htmlFor="yonetici-sifre">Geçici şifre</FieldLabel>
        <Input
          id="yonetici-sifre"
          type="password"
          autoComplete="new-password"
          placeholder="En az 6 karakter"
          aria-invalid={errors.password ? true : undefined}
          {...form.register("password")}
        />
        <FieldError errors={[errors.password]} />
        <FieldDescription>
          Yöneticiler tüm öğrencileri görür ve ekibi yönetir; şifreyi güvenli
          bir kanaldan ilet.
        </FieldDescription>
      </Field>
      <Button type="submit" disabled={submitting} className="self-start">
        <ShieldPlusIcon data-icon="inline-start" />
        {submitting ? "Oluşturuluyor…" : "Yönetici ekle"}
      </Button>
    </form>
  );
}
