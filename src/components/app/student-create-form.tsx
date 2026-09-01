"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheckIcon, UserPlusIcon } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { callAction } from "@/lib/action-client";
import { createStudent, type CreatedStudent } from "@/actions/students";
import {
  trackFieldLabel,
  trackFieldPossessive,
  tracksFor,
} from "@/lib/tracks";
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

type FormInput = z.input<typeof createStudentSchema>;

type FieldName = keyof CreateStudentInput;

const FIELD_NAMES: FieldName[] = [
  "fullName",
  "phone",
  "examCode",
  "trackCode",
  "secondaryExamCode",
  "secondaryTrackCode",
  "targetText",
  "grade",
  "field",
  "school",
  "dershane",
  "parentPhone",
  "email",
  "telegram",
  "city",
  "birthYear",
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
      secondaryExamCode: "",
      secondaryTrackCode: "",
      targetText: "",
      grade: "",
      field: "",
      school: "",
      dershane: "",
      parentPhone: "",
      email: "",
      telegram: "",
      city: "",
      birthYear: "",
    },
  });
  const { errors } = form.formState;
  const examCode = useWatch({ control: form.control, name: "examCode" });
  const secondaryExamCode = useWatch({
    control: form.control,
    name: "secondaryExamCode",
  });
  /* Bölüm = YKS'de alan, KPSS'de düzey; LGS bölümsüz (liste boş → alan gizli). */
  const tracks = tracksFor(examCode);
  const secondaryTracks = tracksFor(secondaryExamCode);

  const onSubmit = async (values: CreateStudentInput) => {
    setSubmitting(true);
    const res = await callAction(createStudent, values);
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
                    // Bölüm listesi sınava özgü — sınav değişince seçim düşer.
                    form.setValue("trackCode", undefined);
                    form.clearErrors("trackCode");
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

          {tracks.length > 0 && (
            <Field data-invalid={errors.trackCode ? true : undefined}>
              <FieldLabel htmlFor="ogr-alan">
                {trackFieldLabel(examCode)} *
              </FieldLabel>
              <Controller
                control={form.control}
                name="trackCode"
                render={({ field }) => (
                  <Select
                    items={tracks}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value ?? undefined)}
                  >
                    <SelectTrigger
                      id="ogr-alan"
                      className="w-full"
                      aria-invalid={errors.trackCode ? true : undefined}
                    >
                      <SelectValue
                        placeholder={`${trackFieldLabel(examCode)} seç`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {tracks.map((track) => (
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

        {/* İkinci sınav — aynı dönemde iki sınava hazırlananlar için. */}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={errors.secondaryExamCode ? true : undefined}>
            <FieldLabel htmlFor="ogr-sinav-2">İkinci sınav</FieldLabel>
            <Controller
              control={form.control}
              name="secondaryExamCode"
              render={({ field }) => (
                <Select
                  items={[
                    { value: "", label: "Yok" },
                    ...EXAMS.filter((e) => e.value !== examCode),
                  ]}
                  value={field.value ?? ""}
                  onValueChange={(value) => {
                    field.onChange(value ?? "");
                    form.setValue("secondaryTrackCode", "");
                    form.clearErrors("secondaryTrackCode");
                  }}
                >
                  <SelectTrigger id="ogr-sinav-2" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Yok</SelectItem>
                    {EXAMS.filter((e) => e.value !== examCode).map((exam) => (
                      <SelectItem key={exam.value} value={exam.value}>
                        {exam.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldDescription>
              Öğrenci iki sınava birden hazırlanıyorsa seç — program ve soru
              takibi iki sınavın derslerini de gösterir.
            </FieldDescription>
            <FieldError errors={[errors.secondaryExamCode]} />
          </Field>

          {secondaryTracks.length > 0 && (
            <Field data-invalid={errors.secondaryTrackCode ? true : undefined}>
              <FieldLabel htmlFor="ogr-alan-2">
                İkinci sınavın {trackFieldPossessive(secondaryExamCode)} *
              </FieldLabel>
              <Controller
                control={form.control}
                name="secondaryTrackCode"
                render={({ field }) => (
                  <Select
                    items={secondaryTracks}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger
                      id="ogr-alan-2"
                      className="w-full"
                      aria-invalid={
                        errors.secondaryTrackCode ? true : undefined
                      }
                    >
                      <SelectValue
                        placeholder={`${trackFieldLabel(secondaryExamCode)} seç`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {secondaryTracks.map((track) => (
                        <SelectItem key={track.value} value={track.value}>
                          {track.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.secondaryTrackCode]} />
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

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={errors.email ? true : undefined}>
            <FieldLabel htmlFor="ogr-email">E-posta</FieldLabel>
            <Input
              id="ogr-email"
              type="email"
              inputMode="email"
              placeholder="ornek@eposta.com"
              aria-invalid={errors.email ? true : undefined}
              {...form.register("email")}
            />
            <FieldError errors={[errors.email]} />
          </Field>
          <Field data-invalid={errors.telegram ? true : undefined}>
            <FieldLabel htmlFor="ogr-telegram">Telegram</FieldLabel>
            <Input
              id="ogr-telegram"
              placeholder="@kullaniciadi"
              aria-invalid={errors.telegram ? true : undefined}
              {...form.register("telegram")}
            />
            <FieldError errors={[errors.telegram]} />
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
          <Field data-invalid={errors.city ? true : undefined}>
            <FieldLabel htmlFor="ogr-sehir">Şehir</FieldLabel>
            <Input
              id="ogr-sehir"
              placeholder="Örn. İstanbul"
              {...form.register("city")}
            />
            <FieldError errors={[errors.city]} />
          </Field>
          <Field data-invalid={errors.birthYear ? true : undefined}>
            <FieldLabel htmlFor="ogr-dogum">Doğum yılı</FieldLabel>
            <Input
              id="ogr-dogum"
              type="number"
              inputMode="numeric"
              placeholder="Örn. 2008"
              aria-invalid={errors.birthYear ? true : undefined}
              {...form.register("birthYear")}
            />
            <FieldError errors={[errors.birthYear]} />
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
