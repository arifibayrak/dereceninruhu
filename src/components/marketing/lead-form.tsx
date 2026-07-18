"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheckIcon, SendIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createLead } from "@/actions/leads";
import { createLeadSchema, type CreateLeadInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";

const EXAMS = [
  { value: "LGS", label: "LGS" },
  { value: "YKS", label: "YKS" },
  { value: "KPSS", label: "KPSS" },
  { value: "Diğer", label: "Diğer / henüz kararsızım" },
] as const;

type FormInput = z.input<typeof createLeadSchema>;

const FIELD_NAMES = ["name", "phone", "exam", "message"] as const;
type FieldName = (typeof FIELD_NAMES)[number];

/** Public ön görüşme talep formu — auth yok; başarıda teşekkür ekranı. */
export function LeadForm() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<FormInput, unknown, CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      name: "",
      phone: "",
      exam: "YKS",
      message: "",
      website: "",
    },
  });
  const { errors } = form.formState;

  const onSubmit = async (values: CreateLeadInput) => {
    setSubmitting(true);
    const res = await createLead(values);
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
            Talebin bize ulaştı 🎉
          </h3>
          <p className="max-w-sm text-sm text-pretty text-muted-foreground">
            Teşekkürler! Genellikle aynı gün içinde WhatsApp veya telefonla
            dönüş yapıyoruz. Ücretsiz ön görüşmede hedefini ve yol haritanı
            birlikte konuşacağız.
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
          Yeni talep gönder
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor="lead-ad">Ad Soyad *</FieldLabel>
          <Input
            id="lead-ad"
            placeholder="Örn. Ayşe Yılmaz"
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            {...form.register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={errors.phone ? true : undefined}>
            <FieldLabel htmlFor="lead-tel">Telefon *</FieldLabel>
            <Input
              id="lead-tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="5XX XXX XX XX"
              aria-invalid={errors.phone ? true : undefined}
              {...form.register("phone")}
            />
            <FieldError errors={[errors.phone]} />
            <FieldDescription>
              Sana bu numaradan WhatsApp ile ulaşacağız.
            </FieldDescription>
          </Field>

          <Field data-invalid={errors.exam ? true : undefined}>
            <FieldLabel htmlFor="lead-sinav">Hangi sınava hazırlanıyorsun? *</FieldLabel>
            <Controller
              control={form.control}
              name="exam"
              render={({ field }) => (
                <Select
                  items={[...EXAMS]}
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger id="lead-sinav" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAMS.map((exam) => (
                      <SelectItem key={exam.value} value={exam.value}>
                        {exam.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.exam]} />
          </Field>
        </div>

        <Field data-invalid={errors.message ? true : undefined}>
          <FieldLabel htmlFor="lead-mesaj">Mesajın (isteğe bağlı)</FieldLabel>
          <Textarea
            id="lead-mesaj"
            rows={4}
            placeholder="Hedefin, sınıfın/durumun ya da sormak istediklerin…"
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
          {submitting ? "Gönderiliyor…" : "Ücretsiz ön görüşme iste"}
        </Button>
        <p className="text-xs text-pretty text-muted-foreground">
          Bilgilerin yalnızca ön görüşme için kullanılır; üçüncü kişilerle asla
          paylaşılmaz.
        </p>
      </FieldGroup>
    </form>
  );
}
