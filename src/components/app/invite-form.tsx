"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { SparklesIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { acceptInvite } from "@/actions/invite";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const pinFormSchema = z
  .object({
    pin: z.string().regex(/^\d{4,6}$/, "PIN 4-6 rakam olmalı."),
    pinConfirm: z.string(),
  })
  .refine((v) => v.pin === v.pinConfirm, {
    message: "PIN'ler eşleşmiyor.",
    path: ["pinConfirm"],
  });

type PinFormValues = z.infer<typeof pinFormSchema>;

/** Davet kabulü: PIN belirle → hesabı oluştur → otomatik giriş. */
export function InviteForm({ inviteCode }: { inviteCode: string }) {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<PinFormValues>({
    resolver: zodResolver(pinFormSchema),
    defaultValues: { pin: "", pinConfirm: "" },
  });
  const { errors } = form.formState;

  const onSubmit = async (values: PinFormValues) => {
    setSubmitting(true);
    const res = await acceptInvite({
      inviteCode,
      pin: values.pin,
      pinConfirm: values.pinConfirm,
    });
    if (!res.ok) {
      setSubmitting(false);
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          if (name === "pin" || name === "pinConfirm") {
            form.setError(name, { message });
          }
        }
      }
      toast.error(res.error);
      return;
    }

    const signInRes = await authClient.signIn.email({
      email: res.data.email,
      password: values.pin,
    });
    if (signInRes.error) {
      setSubmitting(false);
      toast.error("Hesap oluştu ama giriş başarısız. Giriş sayfasını dene.");
      window.location.assign("/giris");
      return;
    }
    toast.success("Hesabın hazır! Hoş geldin 🎉");
    window.location.assign("/ogrenci");
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      noValidate
    >
      <Field data-invalid={errors.pin ? true : undefined}>
        <FieldLabel htmlFor="davet-pin">PIN belirle</FieldLabel>
        <Input
          id="davet-pin"
          type="password"
          inputMode="numeric"
          maxLength={6}
          autoComplete="new-password"
          placeholder="4-6 rakam"
          aria-invalid={errors.pin ? true : undefined}
          className="h-11"
          {...form.register("pin")}
        />
        <FieldError errors={[errors.pin]} />
        <FieldDescription>
          Bu PIN ile telefon numaran üzerinden giriş yapacaksın.
        </FieldDescription>
      </Field>
      <Field data-invalid={errors.pinConfirm ? true : undefined}>
        <FieldLabel htmlFor="davet-pin2">PIN tekrar</FieldLabel>
        <Input
          id="davet-pin2"
          type="password"
          inputMode="numeric"
          maxLength={6}
          autoComplete="new-password"
          placeholder="Aynı PIN"
          aria-invalid={errors.pinConfirm ? true : undefined}
          className="h-11"
          {...form.register("pinConfirm")}
        />
        <FieldError errors={[errors.pinConfirm]} />
      </Field>
      <Button type="submit" size="lg" disabled={submitting} className="h-11 w-full">
        <SparklesIcon data-icon="inline-start" />
        {submitting ? "Hesap oluşturuluyor…" : "Başlayalım"}
      </Button>
    </form>
  );
}
