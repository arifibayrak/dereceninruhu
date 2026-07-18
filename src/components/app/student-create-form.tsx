"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheckIcon, UserPlusIcon } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createStudent, type CreatedStudent } from "@/actions/students";
import {
  createStudentSchema,
  type CreateStudentInput,
} from "@/lib/validation";
import {
  CopyInviteButton,
  WaInviteButton,
} from "@/components/app/invite-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const EXAMS = [
  { value: "KPSS", label: "KPSS" },
  { value: "YKS", label: "YKS" },
  { value: "LGS", label: "LGS" },
] as const;

const TRACKS = [
  { value: "SAY", label: "Sayısal" },
  { value: "EA", label: "Eşit Ağırlık" },
  { value: "SOZ", label: "Sözel" },
] as const;

type FormInput = z.input<typeof createStudentSchema>;

type FieldName = keyof CreateStudentInput;

const FIELD_NAMES: FieldName[] = [
  "fullName",
  "phone",
  "examCode",
  "trackCode",
  "targetText",
  "grade",
  "field",
  "school",
  "dershane",
  "parentPhone",
];

/** Lead'den "Öğrenciye çevir" ile gelen ön dolgu (querystring). */
export type StudentPrefill = {
  fullName?: string;
  phone?: string;
  examCode?: "KPSS" | "YKS" | "LGS";
};

/** Yeni öğrenci formu + başarı ekranında davet linki ve WhatsApp gönderimi. */
export function StudentCreateForm({ prefill }: { prefill?: StudentPrefill }) {
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<
    (CreatedStudent & { fullName: string; phone: string }) | null
  >(null);

  const form = useForm<FormInput, unknown, CreateStudentInput>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      fullName: prefill?.fullName ?? "",
      phone: prefill?.phone ?? "",
      examCode: prefill?.examCode ?? "YKS",
      trackCode: undefined,
      targetText: "",
      grade: "",
      field: "",
      school: "",
      dershane: "",
      parentPhone: "",
    },
  });
  const { errors } = form.formState;
  const examCode = useWatch({ control: form.control, name: "examCode" });

  const onSubmit = async (values: CreateStudentInput) => {
    setSubmitting(true);
    const res = await createStudent(values);
    setSubmitting(false);
    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          if ((FIELD_NAMES as string[]).includes(name)) {
            form.setError(name as FieldName, { message });
          }
        }
      }
      toast.error(res.error);
      return;
    }
    toast.success("Öğrenci oluşturuldu", {
      description: `${values.fullName} kadroya eklendi.`,
    });
    setCreated({
      ...res.data,
      fullName: values.fullName,
      phone: values.phone ?? "",
    });
  };

  if (created) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleCheckIcon className="size-5 text-success" />
            {created.fullName} eklendi
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Davet linki</span>
            <div className="rounded-lg bg-muted/60 px-3 py-2 font-mono text-xs break-all">
              {created.invitePath}
            </div>
            <p className="text-xs text-muted-foreground">
              Öğrenci bu linkten PIN&apos;ini belirleyip hesabını açar.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CopyInviteButton invitePath={created.invitePath} size="sm" />
            {created.phone ? (
              <WaInviteButton
                phone={created.phone}
                studentName={created.fullName}
                invitePath={created.invitePath}
                size="sm"
              />
            ) : (
              <span className="text-xs text-muted-foreground">
                Telefon girilmediği için WhatsApp gönderimi kapalı.
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              render={<Link href={`/koc/ogrenciler/${created.studentId}`} />}
            >
              Öğrenci sayfasına git
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCreated(null);
                form.reset();
              }}
            >
              Yeni öğrenci ekle
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={errors.fullName ? true : undefined}>
          <FieldLabel htmlFor="ogr-ad">Ad Soyad *</FieldLabel>
          <Input
            id="ogr-ad"
            placeholder="Örn. Ayşe Yılmaz"
            aria-invalid={errors.fullName ? true : undefined}
            {...form.register("fullName")}
          />
          <FieldError errors={[errors.fullName]} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={errors.examCode ? true : undefined}>
            <FieldLabel htmlFor="ogr-sinav">Sınav *</FieldLabel>
            <Controller
              control={form.control}
              name="examCode"
              render={({ field }) => (
                <Select
                  items={[...EXAMS]}
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value !== "YKS") {
                      form.setValue("trackCode", undefined);
                      form.clearErrors("trackCode");
                    }
                  }}
                >
                  <SelectTrigger id="ogr-sinav" className="w-full">
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
            <FieldError errors={[errors.examCode]} />
          </Field>

          {examCode === "YKS" && (
            <Field data-invalid={errors.trackCode ? true : undefined}>
              <FieldLabel htmlFor="ogr-alan">Alan *</FieldLabel>
              <Controller
                control={form.control}
                name="trackCode"
                render={({ field }) => (
                  <Select
                    items={[...TRACKS]}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value ?? undefined)}
                  >
                    <SelectTrigger
                      id="ogr-alan"
                      className="w-full"
                      aria-invalid={errors.trackCode ? true : undefined}
                    >
                      <SelectValue placeholder="Alan seç" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRACKS.map((track) => (
                        <SelectItem key={track.value} value={track.value}>
                          {track.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.trackCode]} />
            </Field>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={errors.phone ? true : undefined}>
            <FieldLabel htmlFor="ogr-tel">Telefon</FieldLabel>
            <Input
              id="ogr-tel"
              inputMode="tel"
              placeholder="5XX XXX XX XX"
              aria-invalid={errors.phone ? true : undefined}
              {...form.register("phone")}
            />
            <FieldError errors={[errors.phone]} />
            <FieldDescription>
              WhatsApp daveti ve hatırlatmalar bu numaraya gider.
            </FieldDescription>
          </Field>
          <Field data-invalid={errors.parentPhone ? true : undefined}>
            <FieldLabel htmlFor="ogr-veli">Veli telefonu</FieldLabel>
            <Input
              id="ogr-veli"
              inputMode="tel"
              placeholder="5XX XXX XX XX"
              aria-invalid={errors.parentPhone ? true : undefined}
              {...form.register("parentPhone")}
            />
            <FieldError errors={[errors.parentPhone]} />
          </Field>
        </div>

        <Field data-invalid={errors.targetText ? true : undefined}>
          <FieldLabel htmlFor="ogr-hedef">Hedef</FieldLabel>
          <Input
            id="ogr-hedef"
            placeholder="Örn. İstanbul Adliyesi zabıt katipliği"
            aria-invalid={errors.targetText ? true : undefined}
            {...form.register("targetText")}
          />
          <FieldError errors={[errors.targetText]} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={errors.grade ? true : undefined}>
            <FieldLabel htmlFor="ogr-sinif">Sınıf / durum</FieldLabel>
            <Input
              id="ogr-sinif"
              placeholder="Örn. 12. sınıf / mezun"
              {...form.register("grade")}
            />
            <FieldError errors={[errors.grade]} />
          </Field>
          <Field data-invalid={errors.field ? true : undefined}>
            <FieldLabel htmlFor="ogr-bolum">Alan / bölüm</FieldLabel>
            <Input
              id="ogr-bolum"
              placeholder="Örn. Adalet"
              {...form.register("field")}
            />
            <FieldError errors={[errors.field]} />
          </Field>
          <Field data-invalid={errors.school ? true : undefined}>
            <FieldLabel htmlFor="ogr-okul">Okul</FieldLabel>
            <Input id="ogr-okul" {...form.register("school")} />
            <FieldError errors={[errors.school]} />
          </Field>
          <Field data-invalid={errors.dershane ? true : undefined}>
            <FieldLabel htmlFor="ogr-dershane">Dershane</FieldLabel>
            <Input id="ogr-dershane" {...form.register("dershane")} />
            <FieldError errors={[errors.dershane]} />
          </Field>
        </div>

        <Button type="submit" size="lg" disabled={submitting} className="self-start">
          <UserPlusIcon data-icon="inline-start" />
          {submitting ? "Oluşturuluyor…" : "Öğrenciyi oluştur"}
        </Button>
      </FieldGroup>
    </form>
  );
}
