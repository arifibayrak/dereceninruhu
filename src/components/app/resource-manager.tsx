"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ExternalLinkIcon,
  PencilIcon,
  PlusIcon,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createResource, updateResource } from "@/actions/konular";
import {
  createResourceSchema,
  type UpdateResourceInput,
} from "@/lib/validation-konular";
import type { ResourceRow } from "@/db/queries/konular";
import { Badge } from "@/components/ui/badge";
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

export type SubjectOption = { id: number; name: string };

type FormInput = z.input<typeof createResourceSchema>;
type FormOutput = z.output<typeof createResourceSchema>;

function ResourceFormFields({
  form,
  subjects,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: ReturnType<typeof useForm<FormInput, any, FormOutput>>;
  subjects: SubjectOption[];
}) {
  const { errors } = form.formState;
  return (
    <>
      <Field data-invalid={errors.name ? true : undefined}>
        <FieldLabel htmlFor="kaynak-ad">Kaynak adı *</FieldLabel>
        <Input
          id="kaynak-ad"
          placeholder="Örn. 3D Türkçe Soru Bankası"
          aria-invalid={errors.name ? true : undefined}
          {...form.register("name")}
        />
        <FieldError errors={[errors.name]} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field data-invalid={errors.author ? true : undefined}>
          <FieldLabel htmlFor="kaynak-yazar">Yazar / hoca</FieldLabel>
          <Input
            id="kaynak-yazar"
            placeholder="Örn. İlker Karabulut"
            {...form.register("author")}
          />
          <FieldError errors={[errors.author]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="kaynak-ders">Ders</FieldLabel>
          <Controller
            control={form.control}
            name="subjectId"
            render={({ field }) => (
              <Select
                items={[
                  { value: "genel", label: "Genel (tüm dersler)" },
                  ...subjects.map((s) => ({
                    value: String(s.id),
                    label: s.name,
                  })),
                ]}
                value={field.value != null ? String(field.value) : "genel"}
                onValueChange={(value) =>
                  field.onChange(
                    value === "genel" || value == null ? null : Number(value),
                  )
                }
              >
                <SelectTrigger id="kaynak-ders" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="genel">Genel (tüm dersler)</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>
      <Field data-invalid={errors.notes ? true : undefined}>
        <FieldLabel htmlFor="kaynak-not">Not</FieldLabel>
        <Input
          id="kaynak-not"
          placeholder="Örn. video anlatımla birlikte"
          {...form.register("notes")}
        />
        <FieldError errors={[errors.notes]} />
      </Field>
      <Field data-invalid={errors.url ? true : undefined}>
        <FieldLabel htmlFor="kaynak-link">Bağlantı (opsiyonel)</FieldLabel>
        <Input
          id="kaynak-link"
          type="url"
          inputMode="url"
          placeholder="https://…"
          {...form.register("url")}
        />
        <FieldError errors={[errors.url]} />
      </Field>
    </>
  );
}

function ResourceCreateDialog({
  enrollmentId,
  subjects,
}: {
  enrollmentId: number;
  subjects: SubjectOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(createResourceSchema),
    defaultValues: {
      enrollmentId,
      name: "",
      author: "",
      notes: "",
      url: "",
      subjectId: null,
    },
  });

  const onSubmit = async (values: FormOutput) => {
    setSubmitting(true);
    const res = await createResource(values);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Kaynak eklendi");
    setOpen(false);
    form.reset();
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon data-icon="inline-start" />
        Kaynak ekle
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kaynak ekle</DialogTitle>
          <DialogDescription>
            Kitap, fasikül ya da soru bankası — konu takibi bu kaynak üstünden
            işaretlenir.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <ResourceFormFields form={form} subjects={subjects} />
            <Button type="submit" disabled={submitting} className="self-start">
              {submitting ? "Ekleniyor…" : "Kaynağı ekle"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResourceEditDialog({
  resource,
  subjects,
}: {
  resource: ResourceRow;
  subjects: SubjectOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(createResourceSchema),
    defaultValues: {
      enrollmentId: 0, // düzenlemede kullanılmıyor; updateResource resourceId alır.
      name: resource.name,
      author: resource.author ?? "",
      notes: resource.notes ?? "",
      url: resource.url ?? "",
      subjectId: resource.subjectId,
    },
  });

  const onSubmit = async (values: FormOutput) => {
    setSubmitting(true);
    const payload: UpdateResourceInput = {
      resourceId: resource.id,
      name: values.name,
      author: values.author,
      notes: values.notes,
      url: values.url,
      subjectId: values.subjectId,
    };
    const res = await updateResource(payload);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Kaynak güncellendi");
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Kaynağı düzenle" />
        }
      >
        <PencilIcon />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kaynağı düzenle</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <ResourceFormFields form={form} subjects={subjects} />
            <Button type="submit" disabled={submitting} className="self-start">
              {submitting ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResourceArchiveButton({ resource }: { resource: ResourceRow }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const toggle = async () => {
    setPending(true);
    const res = await updateResource({
      resourceId: resource.id,
      name: resource.name,
      author: resource.author ?? "",
      notes: resource.notes ?? "",
      url: resource.url ?? "",
      subjectId: resource.subjectId,
      isActive: !resource.isActive,
    });
    setPending(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(resource.isActive ? "Kaynak arşivlendi" : "Kaynak geri alındı");
    router.refresh();
  };
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={resource.isActive ? "Kaynağı arşivle" : "Kaynağı geri al"}
      disabled={pending}
      onClick={toggle}
      className="text-muted-foreground"
    >
      {resource.isActive ? <ArchiveIcon /> : <ArchiveRestoreIcon />}
    </Button>
  );
}

/** Kokpit "Konular" sekmesi — öğrencinin kaynak listesi + CRUD (koç). */
export function ResourceManager({
  enrollmentId,
  resources,
  subjects,
}: {
  enrollmentId: number;
  resources: ResourceRow[];
  subjects: SubjectOption[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-base font-semibold">
          Kaynaklar · {resources.filter((r) => r.isActive).length}
        </h3>
        <ResourceCreateDialog enrollmentId={enrollmentId} subjects={subjects} />
      </div>
      {resources.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
          Henüz kaynak eklenmedi. Kaynak ekleyince konu×kaynak takibi açılır.
        </div>
      ) : (
        <ul className="flex flex-col divide-y rounded-xl bg-card ring-1 ring-foreground/10">
          {resources.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex min-w-0 flex-1 flex-col">
                <span
                  className={
                    r.isActive
                      ? "truncate text-sm font-medium"
                      : "truncate text-sm font-medium text-muted-foreground line-through"
                  }
                >
                  {r.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {[r.subjectName ?? "Genel", r.author, r.notes]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              {!r.isActive && <Badge variant="outline">Arşiv</Badge>}
              {r.url && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Bağlantıyı aç"
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-primary"
                >
                  <ExternalLinkIcon className="size-4" />
                </a>
              )}
              <ResourceEditDialog resource={r} subjects={subjects} />
              <ResourceArchiveButton resource={r} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
