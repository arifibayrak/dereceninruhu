"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { upsertPrivateLesson } from "@/actions/paketler";
import { callAction } from "@/lib/action-client";
import { trDayKey } from "@/lib/dates";
import {
  instructorValueOf,
  LESSON_DURATION_OPTIONS,
  LESSON_STATUS_LABELS,
  parseInstructorValue,
} from "@/lib/ozel-ders";
import { useRefresh } from "@/lib/use-refresh";
import { upsertPrivateLessonSchema } from "@/lib/validation-paket";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

type FormInput = z.input<typeof upsertPrivateLessonSchema>;
type FormOutput = z.output<typeof upsertPrivateLessonSchema>;

export type LessonDefaults = {
  id: number;
  enrollmentPackageId: number | null;
  subjectId: number | null;
  instructorUserId: string | null;
  instructorProfileId: number | null;
  scheduledAt: Date | null;
  heldAt: Date | null;
  durationMinutes: number;
  status: "scheduled" | "held" | "cancelled" | "missed";
  countsAgainstQuota: boolean;
  note: string | null;
  studentVisibleNote: string | null;
};

const STATUS_ITEMS = (
  Object.entries(LESSON_STATUS_LABELS) as [
    LessonDefaults["status"],
    string,
  ][]
).map(([value, label]) => ({ value, label }));

const NONE = "yok";

/**
 * Özel ders kaydı — koç/öğretmen işlenen ya da planlanan dersi buradan girer.
 *
 * Kota YALNIZ "İşlendi" durumundan düşer (bkz. `@/lib/ozel-ders`), o yüzden
 * "İşlendi" seçilince ders tarihi zorunlu olur. "Hakkı yakmasın" kutusu telafi
 * ve ücretsiz tanıtım dersleri içindir: kayıt görünür kalır, saat düşmez.
 */
export function PrivateLessonDialog({
  enrollmentId,
  packages,
  subjects,
  instructors,
  lesson,
}: {
  enrollmentId: number;
  packages: { id: number; name: string }[];
  subjects: { id: number; name: string }[];
  instructors: { value: string; label: string }[];
  lesson?: LessonDefaults;
}) {
  const { refresh } = useRefresh();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(upsertPrivateLessonSchema),
    defaultValues: {
      lessonId: lesson?.id,
      enrollmentId,
      enrollmentPackageId: lesson?.enrollmentPackageId ?? undefined,
      subjectId: lesson?.subjectId ?? undefined,
      instructorUserId: lesson?.instructorUserId ?? undefined,
      instructorProfileId: lesson?.instructorProfileId ?? undefined,
      scheduledAt: lesson?.scheduledAt
        ? trDayKey(lesson.scheduledAt)
        : undefined,
      heldAt: lesson?.heldAt ? trDayKey(lesson.heldAt) : undefined,
      durationMinutes: lesson?.durationMinutes ?? 60,
      status: lesson?.status ?? "scheduled",
      countsAgainstQuota: lesson?.countsAgainstQuota ?? true,
      note: lesson?.note ?? "",
      studentVisibleNote: lesson?.studentVisibleNote ?? "",
    },
  });
  const { errors } = form.formState;
  const status = useWatch({ control: form.control, name: "status" });

  const [instructor, setInstructor] = useState(
    instructorValueOf(
      lesson?.instructorUserId ?? null,
      lesson?.instructorProfileId ?? null,
    ),
  );

  const onInstructorChange = (value: string) => {
    setInstructor(value === NONE ? "" : value);
    // Seçici tek değer taşır; iki kolona burada ayrılır.
    const parsed = parseInstructorValue(value === NONE ? null : value);
    form.setValue("instructorUserId", parsed.instructorUserId ?? undefined);
    form.setValue(
      "instructorProfileId",
      parsed.instructorProfileId ?? undefined,
    );
  };

  const onSubmit = async (values: FormOutput) => {
    setSubmitting(true);
    const res = await callAction(upsertPrivateLesson, values);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(lesson ? "Ders güncellendi" : "Ders eklendi");
    setOpen(false);
    refresh();
  };

  const packageItems = [
    { value: NONE, label: "Pakete bağlı değil (ekstra ders)" },
    ...packages.map((p) => ({ value: String(p.id), label: p.name })),
  ];
  const subjectItems = [
    { value: NONE, label: "Ders seçilmedi" },
    ...subjects.map((s) => ({ value: String(s.id), label: s.name })),
  ];
  const instructorItems = [
    { value: NONE, label: "Eğitmen seçilmedi" },
    ...instructors,
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={lesson ? "ghost" : "default"}
            size={lesson ? "icon-sm" : "sm"}
          />
        }
      >
        {lesson ? (
          <PencilIcon />
        ) : (
          <>
            <PlusIcon data-icon="inline-start" />
            Ders ekle
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{lesson ? "Dersi düzenle" : "Özel ders"}</DialogTitle>
          <DialogDescription>
            Kalan saat yalnız &quot;İşlendi&quot; işaretli derslerden düşer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="ders-paket">Hangi paketten</FieldLabel>
              <Controller
                control={form.control}
                name="enrollmentPackageId"
                render={({ field }) => (
                  <Select
                    items={packageItems}
                    value={field.value ? String(field.value) : NONE}
                    onValueChange={(v) =>
                      field.onChange(v === NONE ? undefined : Number(v))
                    }
                  >
                    <SelectTrigger id="ders-paket" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {packageItems.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldDescription>
                Pakete bağlanmayan ders hiçbir sayacı yakmaz.
              </FieldDescription>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="ders-ders">Ders</FieldLabel>
                <Controller
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <Select
                      items={subjectItems}
                      value={field.value ? String(field.value) : NONE}
                      onValueChange={(v) =>
                        field.onChange(v === NONE ? undefined : Number(v))
                      }
                    >
                      <SelectTrigger id="ders-ders" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectItems.map((sItem) => (
                          <SelectItem key={sItem.value} value={sItem.value}>
                            {sItem.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="ders-egitmen">Eğitmen</FieldLabel>
                <Select
                  items={instructorItems}
                  value={instructor || NONE}
                  onValueChange={(v) => onInstructorChange(v as string)}
                >
                  <SelectTrigger id="ders-egitmen" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {instructorItems.map((it) => (
                      <SelectItem key={it.value} value={it.value}>
                        {it.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  &quot;(dış)&quot; = uygulamada hesabı olmayan öğretmen.
                </FieldDescription>
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={errors.status ? true : undefined}>
                <FieldLabel htmlFor="ders-durum">Durum *</FieldLabel>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select
                      items={STATUS_ITEMS}
                      value={field.value}
                      onValueChange={(v) => field.onChange(v)}
                    >
                      <SelectTrigger id="ders-durum" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_ITEMS.map((sItem) => (
                          <SelectItem key={sItem.value} value={sItem.value}>
                            {sItem.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.status]} />
              </Field>

              <Field data-invalid={errors.durationMinutes ? true : undefined}>
                <FieldLabel htmlFor="ders-sure">Süre (dakika) *</FieldLabel>
                <Input
                  id="ders-sure"
                  inputMode="numeric"
                  aria-invalid={errors.durationMinutes ? true : undefined}
                  {...form.register("durationMinutes")}
                />
                <FieldError errors={[errors.durationMinutes]} />
                <div className="flex flex-wrap gap-1.5">
                  {LESSON_DURATION_OPTIONS.map((m) => (
                    <Button
                      key={m}
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => form.setValue("durationMinutes", m)}
                    >
                      {m} dk
                    </Button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="ders-plan-tarih">Planlanan gün</FieldLabel>
                <Input
                  id="ders-plan-tarih"
                  type="date"
                  {...form.register("scheduledAt")}
                />
              </Field>
              <Field data-invalid={errors.heldAt ? true : undefined}>
                <FieldLabel htmlFor="ders-islendi-tarih">
                  İşlendiği gün {status === "held" ? "*" : ""}
                </FieldLabel>
                <Input
                  id="ders-islendi-tarih"
                  type="date"
                  aria-invalid={errors.heldAt ? true : undefined}
                  {...form.register("heldAt")}
                />
                <FieldError errors={[errors.heldAt]} />
              </Field>
            </div>

            <Controller
              control={form.control}
              name="countsAgainstQuota"
              render={({ field }) => (
                <label className="flex items-start gap-2.5 text-sm">
                  <Checkbox
                    checked={field.value !== false}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium">Kalan haktan düşsün</span>
                    <span className="text-xs text-muted-foreground">
                      Telafi ya da ücretsiz ders için işareti kaldır.
                    </span>
                  </span>
                </label>
              )}
            />

            <Field>
              <FieldLabel htmlFor="ders-not">Eğitmen notu</FieldLabel>
              <Textarea
                id="ders-not"
                rows={2}
                placeholder="Öğrenci görmez"
                {...form.register("note")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="ders-ogrenci-not">
                Öğrenciye görünen not
              </FieldLabel>
              <Textarea
                id="ders-ogrenci-not"
                rows={2}
                placeholder="Ders özeti, ödev, sonraki konu…"
                {...form.register("studentVisibleNote")}
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Vazgeç
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
