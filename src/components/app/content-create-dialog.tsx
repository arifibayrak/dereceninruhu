"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createContentItem } from "@/actions/icerik";
import { CONTENT_TYPE_LABELS, type ContentType } from "@/lib/content";
import { createContentSchema } from "@/lib/validation-icerik";
import type { ContentFormOptions } from "@/db/queries/icerik";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

type FormInput = z.input<typeof createContentSchema>;
type FormOutput = z.output<typeof createContentSchema>;

const TYPE_ITEMS = (
  Object.entries(CONTENT_TYPE_LABELS) as [ContentType, string][]
).map(([value, label]) => ({ value, label }));

export type AssignableStudent = { enrollmentId: number; label: string };

/** Koç: içerik ekleme diyaloğu — kütüphane ya da kişiye özel atama. */
export function ContentCreateDialog({
  options,
  students,
  fixedEnrollmentId,
}: {
  options: ContentFormOptions;
  students: AssignableStudent[];
  /** Kokpitten açılırsa: içerik bu öğrenciye atanmış olarak oluşur. */
  fixedEnrollmentId?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assignIds, setAssignIds] = useState<number[]>(
    fixedEnrollmentId ? [fixedEnrollmentId] : [],
  );

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(createContentSchema),
    defaultValues: {
      type: "video",
      title: "",
      url: "",
      body: "",
      examTemplateId: null,
      subjectId: null,
      topicId: null,
      isLibrary: !fixedEnrollmentId,
    },
  });
  const { errors } = form.formState;
  const type = useWatch({ control: form.control, name: "type" });
  const examTemplateId = useWatch({
    control: form.control,
    name: "examTemplateId",
  });
  const subjectId = useWatch({ control: form.control, name: "subjectId" });

  const subjectItems = useMemo(
    () =>
      options.subjects.filter(
        (s) =>
          examTemplateId == null || s.examTemplateId === Number(examTemplateId),
      ),
    [options.subjects, examTemplateId],
  );
  const topicItems = useMemo(
    () =>
      subjectId != null
        ? options.topics.filter((t) => t.subjectId === Number(subjectId))
        : [],
    [options.topics, subjectId],
  );

  const toggleAssign = (enrollmentId: number) => {
    setAssignIds((prev) =>
      prev.includes(enrollmentId)
        ? prev.filter((id) => id !== enrollmentId)
        : [...prev, enrollmentId],
    );
  };

  const onSubmit = async (values: FormOutput) => {
    setSubmitting(true);
    const res = await createContentItem({ ...values, enrollmentIds: assignIds });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("İçerik eklendi");
    setOpen(false);
    form.reset();
    setAssignIds(fixedEnrollmentId ? [fixedEnrollmentId] : []);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon data-icon="inline-start" />
        İçerik ekle
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>İçerik ekle</DialogTitle>
          <DialogDescription>
            YouTube videosu, PDF, not ya da bağlantı — kütüphaneye ya da belirli
            öğrencilere.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={errors.type ? true : undefined}>
                <FieldLabel htmlFor="ic-tip">Tür *</FieldLabel>
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <Select
                      items={TYPE_ITEMS}
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger id="ic-tip" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_ITEMS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.type]} />
              </Field>
              <Field data-invalid={errors.examTemplateId ? true : undefined}>
                <FieldLabel htmlFor="ic-sinav">Sınav</FieldLabel>
                <Controller
                  control={form.control}
                  name="examTemplateId"
                  render={({ field }) => (
                    <Select
                      items={[
                        { value: "tum", label: "Tüm sınavlar" },
                        ...options.exams.map((e) => ({
                          value: String(e.id),
                          label: e.code,
                        })),
                      ]}
                      value={field.value != null ? String(field.value) : "tum"}
                      onValueChange={(value) => {
                        field.onChange(
                          value === "tum" || value == null ? null : Number(value),
                        );
                        form.setValue("subjectId", null);
                        form.setValue("topicId", null);
                      }}
                    >
                      <SelectTrigger id="ic-sinav" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tum">Tüm sınavlar</SelectItem>
                        {options.exams.map((e) => (
                          <SelectItem key={e.id} value={String(e.id)}>
                            {e.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>

            <Field data-invalid={errors.title ? true : undefined}>
              <FieldLabel htmlFor="ic-baslik">Başlık *</FieldLabel>
              <Input
                id="ic-baslik"
                placeholder="Örn. Paragraf soru çözüm taktikleri"
                aria-invalid={errors.title ? true : undefined}
                {...form.register("title")}
              />
              <FieldError errors={[errors.title]} />
            </Field>

            {type !== "note" && (
              <Field data-invalid={errors.url ? true : undefined}>
                <FieldLabel htmlFor="ic-url">Bağlantı *</FieldLabel>
                <Input
                  id="ic-url"
                  inputMode="url"
                  placeholder="https://youtube.com/watch?v=…"
                  aria-invalid={errors.url ? true : undefined}
                  {...form.register("url")}
                />
                <FieldError errors={[errors.url]} />
                {type === "video" && (
                  <FieldDescription>
                    YouTube bağlantıları öğrenci tarafında küçük resimle görünür.
                  </FieldDescription>
                )}
              </Field>
            )}

            {type === "note" && (
              <Field data-invalid={errors.body ? true : undefined}>
                <FieldLabel htmlFor="ic-not">Not içeriği *</FieldLabel>
                <Textarea
                  id="ic-not"
                  rows={4}
                  placeholder="Öğrencinin okuyacağı not…"
                  aria-invalid={errors.body ? true : undefined}
                  {...form.register("body")}
                />
                <FieldError errors={[errors.body]} />
              </Field>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="ic-ders">Ders</FieldLabel>
                <Controller
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <Select
                      items={[
                        { value: "yok", label: "Ders seçme" },
                        ...subjectItems.map((s) => ({
                          value: String(s.id),
                          label: s.label,
                        })),
                      ]}
                      value={field.value != null ? String(field.value) : "yok"}
                      onValueChange={(value) => {
                        field.onChange(
                          value === "yok" || value == null ? null : Number(value),
                        );
                        form.setValue("topicId", null);
                      }}
                    >
                      <SelectTrigger id="ic-ders" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yok">Ders seçme</SelectItem>
                        {subjectItems.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="ic-konu">Konu</FieldLabel>
                <Controller
                  control={form.control}
                  name="topicId"
                  render={({ field }) => (
                    <Select
                      items={[
                        { value: "yok", label: "Konu seçme" },
                        ...topicItems.map((t) => ({
                          value: String(t.id),
                          label: t.name,
                        })),
                      ]}
                      value={field.value != null ? String(field.value) : "yok"}
                      onValueChange={(value) =>
                        field.onChange(
                          value === "yok" || value == null ? null : Number(value),
                        )
                      }
                    >
                      <SelectTrigger
                        id="ic-konu"
                        className="w-full"
                        disabled={topicItems.length === 0}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yok">Konu seçme</SelectItem>
                        {topicItems.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>Görünürlük</FieldLabel>
              <Controller
                control={form.control}
                name="isLibrary"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={field.value ?? true}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="size-4 accent-primary"
                    />
                    Kütüphanede herkese açık (sınav filtresine göre)
                  </label>
                )}
              />
              <FieldDescription>
                Kapalıysa yalnız aşağıda seçtiğin öğrenciler görür.
              </FieldDescription>
            </Field>

            {students.length > 0 && !fixedEnrollmentId && (
              <Field>
                <FieldLabel>Öğrencilere ata</FieldLabel>
                <div className="flex max-h-36 flex-col gap-1.5 overflow-y-auto rounded-lg border p-3">
                  {students.map((s) => (
                    <label
                      key={s.enrollmentId}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={assignIds.includes(s.enrollmentId)}
                        onChange={() => toggleAssign(s.enrollmentId)}
                        className="size-4 accent-primary"
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              </Field>
            )}

            <Button type="submit" disabled={submitting} className="self-start">
              {submitting ? "Ekleniyor…" : "İçeriği ekle"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
