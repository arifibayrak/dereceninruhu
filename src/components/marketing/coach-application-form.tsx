"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheckIcon, SendIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createCoachApplication } from "@/actions/coach-applications";
import {
  createCoachApplicationSchema,
  type CreateCoachApplicationInput,
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
import { Textarea } from "@/components/ui/textarea";

const FIELD_NAMES = [
  "name",
  "phone",
  "email",
  "subjects",
  "experience",
  "link",
  "message",
] as const;
type FieldName = (typeof FIELD_NAMES)[number];

/** Public koç başvuru formu — auth yok; başarıda teşekkür ekranı. */
export function CoachApplicationForm() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<CreateCoachApplicationInput>({
    resolver: zodResolver(createCoachApplicationSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      subjects: "",
      experience: "",
      link: "",
      message: "",
      website: "",
    },
  });
  const { errors } = form.formState;

  const onSubmit = async (values: CreateCoachApplicationInput) => {
    setSubmitting(true);
    const res = await createCoachApplication(values);
    setSubmitting(false);
    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          if ((FIELD_NAMES as readonly string[]).includes(name)) {
            form.setError(name as FieldName, { message });
          }
        }
      }
      toast.error(res.error);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success/10">
          <CircleCheckIcon className="size-7 text-success" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h3 className="font-heading text-lg font-semibold">
            Başvurun bize ulaştı 🙌
          </h3>
          <p className="max-w-sm text-sm text-pretty text-muted-foreground">
            İlgin için teşekkürler! Koç kadromuzu özenle ve seçici kuruyoruz.
            Başvurunu değerlendirip uygun görürsek bir tanışma görüşmesi için
            sana WhatsApp&apos;tan döneceğiz.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSent(false);
            form.reset();
          }}
        >
          Yeni başvuru gönder
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor="app-ad">Ad Soyad *</FieldLabel>
          <Input
            id="app-ad"
            placeholder="Örn. Zeynep Aydın"
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            {...form.register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={errors.phone ? true : undefined}>
            <FieldLabel htmlFor="app-tel">Telefon *</FieldLabel>
            <Input
              id="app-tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="5XX XXX XX XX"
              aria-invalid={errors.phone ? true : undefined}
              {...form.register("phone")}
            />
            <FieldError errors={[errors.phone]} />
          </Field>

          <Field data-invalid={errors.email ? true : undefined}>
            <FieldLabel htmlFor="app-eposta">E-posta (isteğe bağlı)</FieldLabel>
            <Input
              id="app-eposta"
              type="email"
              autoComplete="email"
              placeholder="ad@ornek.com"
              aria-invalid={errors.email ? true : undefined}
              {...form.register("email")}
            />
            <FieldError errors={[errors.email]} />
          </Field>
        </div>

        <Field data-invalid={errors.subjects ? true : undefined}>
          <FieldLabel htmlFor="app-brans">Branş / uzmanlık *</FieldLabel>
          <Input
            id="app-brans"
            placeholder="Örn. Matematik, Geometri · YKS-TYT"
            aria-invalid={errors.subjects ? true : undefined}
            {...form.register("subjects")}
          />
          <FieldError errors={[errors.subjects]} />
        </Field>

        <Field data-invalid={errors.experience ? true : undefined}>
          <FieldLabel htmlFor="app-deneyim">
            Deneyimin (isteğe bağlı)
          </FieldLabel>
          <Textarea
            id="app-deneyim"
            rows={3}
            placeholder="Kaç yıldır koçluk/öğretmenlik yapıyorsun, hangi sınavlarda?"
            aria-invalid={errors.experience ? true : undefined}
            {...form.register("experience")}
          />
          <FieldError errors={[errors.experience]} />
        </Field>

        <Field data-invalid={errors.link ? true : undefined}>
          <FieldLabel htmlFor="app-link">CV / LinkedIn (isteğe bağlı)</FieldLabel>
          <Input
            id="app-link"
            inputMode="url"
            placeholder="https://…"
            aria-invalid={errors.link ? true : undefined}
            {...form.register("link")}
          />
          <FieldError errors={[errors.link]} />
          <FieldDescription>
            Özgeçmişin ya da profilinin bağlantısını ekleyebilirsin.
          </FieldDescription>
        </Field>

        <Field data-invalid={errors.message ? true : undefined}>
          <FieldLabel htmlFor="app-mesaj">
            Neden Derecenin Ruhu? (isteğe bağlı)
          </FieldLabel>
          <Textarea
            id="app-mesaj"
            rows={4}
            placeholder="Kendini kısaca tanıt; neden bizimle çalışmak istediğini yaz…"
            aria-invalid={errors.message ? true : undefined}
            {...form.register("message")}
          />
          <FieldError errors={[errors.message]} />
        </Field>

        {/* Bal küpü — botlar doldurur, insanlar görmez. */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
          {...form.register("website")}
        />

        <Button type="submit" size="lg" disabled={submitting}>
          <SendIcon data-icon="inline-start" />
          {submitting ? "Gönderiliyor…" : "Başvuruyu gönder"}
        </Button>
        <p className="text-xs text-pretty text-muted-foreground">
          Başvurun yalnızca değerlendirme için kullanılır; üçüncü kişilerle
          paylaşılmaz.
        </p>
      </FieldGroup>
    </form>
  );
}
