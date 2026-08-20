"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { useRefresh } from "@/lib/use-refresh";
import { callAction } from "@/lib/action-client";
import { updateMyProfile, updateStudent } from "@/actions/students";
import {
  updateStudentProfileSchema,
  type UpdateStudentProfileInput,
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

type FormInput = z.input<typeof updateStudentProfileSchema>;

const FIELD_NAMES: (keyof UpdateStudentProfileInput)[] = [
  "fullName",
  "phone",
  "parentPhone",
  "targetText",
  "grade",
  "field",
  "school",
  "dershane",
  "email",
  "telegram",
  "city",
  "birthYear",
];

export type StudentProfileFormProps = {
  /** "coach": bir öğrencinin profili; "self": öğrenci kendi profili. */
  variant: "coach" | "self";
  /** variant="coach" için gerekli — düzenlenen öğrencinin id'si. */
  studentId?: number;
  initial: UpdateStudentProfileInput;
};

/** Öğrenci profili düzenleme formu (koç ve öğrenci self-servis ortak). */
export function StudentProfileForm({
  variant,
  studentId,
  initial,
}: StudentProfileFormProps) {
  const { refresh } = useRefresh();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormInput, unknown, UpdateStudentProfileInput>({
    resolver: zodResolver(updateStudentProfileSchema),
    defaultValues: {
      fullName: initial.fullName ?? "",
      phone: initial.phone ?? "",
      parentPhone: initial.parentPhone ?? "",
      targetText: initial.targetText ?? "",
      grade: initial.grade ?? "",
      field: initial.field ?? "",
      school: initial.school ?? "",
      dershane: initial.dershane ?? "",
      email: initial.email ?? "",
      telegram: initial.telegram ?? "",
      city: initial.city ?? "",
      birthYear: initial.birthYear ?? "",
    },
  });
  const { errors } = form.formState;

  const onSubmit = async (values: UpdateStudentProfileInput) => {
    setSubmitting(true);
    const res =
      variant === "coach"
        ? await callAction(updateStudent, studentId as number, values)
        : await callAction(updateMyProfile, values);
    setSubmitting(false);

    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          if ((FIELD_NAMES as string[]).includes(name)) {
            form.setError(name as keyof UpdateStudentProfileInput, { message });
          }
        }
      }
      toast.error(res.error);
      return;
    }

    toast.success("Profil güncellendi");
    form.reset(values);
    refresh();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={errors.fullName ? true : undefined}>
          <FieldLabel htmlFor="prof-ad">Ad Soyad *</FieldLabel>
          <Input
            id="prof-ad"
            aria-invalid={errors.fullName ? true : undefined}
            {...form.register("fullName")}
          />
          <FieldError errors={[errors.fullName]} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={errors.phone ? true : undefined}>
            <FieldLabel htmlFor="prof-tel">Telefon</FieldLabel>
            <Input
              id="prof-tel"
              inputMode="tel"
              placeholder="5XX XXX XX XX"
              aria-invalid={errors.phone ? true : undefined}
              {...form.register("phone")}
            />
            <FieldError errors={[errors.phone]} />
            {variant === "self" && (
              <FieldDescription>
                İletişim numarası. Giriş için kullandığın numara değişmez.
              </FieldDescription>
            )}
          </Field>
          <Field data-invalid={errors.parentPhone ? true : undefined}>
            <FieldLabel htmlFor="prof-veli">Veli telefonu</FieldLabel>
            <Input
              id="prof-veli"
              inputMode="tel"
              placeholder="5XX XXX XX XX"
              aria-invalid={errors.parentPhone ? true : undefined}
              {...form.register("parentPhone")}
            />
            <FieldError errors={[errors.parentPhone]} />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={errors.email ? true : undefined}>
            <FieldLabel htmlFor="prof-email">E-posta</FieldLabel>
            <Input
              id="prof-email"
              type="email"
              inputMode="email"
              placeholder="ornek@eposta.com"
              aria-invalid={errors.email ? true : undefined}
              {...form.register("email")}
            />
            <FieldError errors={[errors.email]} />
          </Field>
          <Field data-invalid={errors.telegram ? true : undefined}>
            <FieldLabel htmlFor="prof-telegram">Telegram</FieldLabel>
            <Input
              id="prof-telegram"
              placeholder="@kullaniciadi"
              aria-invalid={errors.telegram ? true : undefined}
              {...form.register("telegram")}
            />
            <FieldError errors={[errors.telegram]} />
          </Field>
        </div>

        <Field data-invalid={errors.targetText ? true : undefined}>
          <FieldLabel htmlFor="prof-hedef">Hedef</FieldLabel>
          <Input
            id="prof-hedef"
            placeholder="Örn. İstanbul Adliyesi zabıt katipliği"
            aria-invalid={errors.targetText ? true : undefined}
            {...form.register("targetText")}
          />
          <FieldError errors={[errors.targetText]} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={errors.grade ? true : undefined}>
            <FieldLabel htmlFor="prof-sinif">Sınıf / durum</FieldLabel>
            <Input
              id="prof-sinif"
              placeholder="Örn. 12. sınıf / mezun"
              {...form.register("grade")}
            />
            <FieldError errors={[errors.grade]} />
          </Field>
          <Field data-invalid={errors.field ? true : undefined}>
            <FieldLabel htmlFor="prof-bolum">Alan / bölüm</FieldLabel>
            <Input
              id="prof-bolum"
              placeholder="Örn. Adalet"
              {...form.register("field")}
            />
            <FieldError errors={[errors.field]} />
          </Field>
          <Field data-invalid={errors.school ? true : undefined}>
            <FieldLabel htmlFor="prof-okul">Okul</FieldLabel>
            <Input id="prof-okul" {...form.register("school")} />
            <FieldError errors={[errors.school]} />
          </Field>
          <Field data-invalid={errors.dershane ? true : undefined}>
            <FieldLabel htmlFor="prof-dershane">Dershane</FieldLabel>
            <Input id="prof-dershane" {...form.register("dershane")} />
            <FieldError errors={[errors.dershane]} />
          </Field>
          <Field data-invalid={errors.city ? true : undefined}>
            <FieldLabel htmlFor="prof-sehir">Şehir</FieldLabel>
            <Input
              id="prof-sehir"
              placeholder="Örn. İstanbul"
              {...form.register("city")}
            />
            <FieldError errors={[errors.city]} />
          </Field>
          <Field data-invalid={errors.birthYear ? true : undefined}>
            <FieldLabel htmlFor="prof-dogum">Doğum yılı</FieldLabel>
            <Input
              id="prof-dogum"
              type="number"
              inputMode="numeric"
              placeholder="Örn. 2008"
              aria-invalid={errors.birthYear ? true : undefined}
              {...form.register("birthYear")}
            />
            <FieldError errors={[errors.birthYear]} />
          </Field>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="self-start"
        >
          <SaveIcon data-icon="inline-start" />
          {submitting ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </FieldGroup>
    </form>
  );
}
