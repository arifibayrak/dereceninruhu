"use client";

import { useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LinkIcon, PaperclipIcon, PlusIcon, UploadIcon, XIcon } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { useRefresh } from "@/lib/use-refresh";
import { callAction } from "@/lib/action-client";
import { createContentItem } from "@/actions/icerik";
import {
  CONTENT_TYPE_LABELS,
  MAX_CONTENT_FILE_BYTES,
  UPLOAD_ACCEPT,
  UPLOAD_CHUNK_BYTES,
  chunkCountFor,
  contentTypeForFile,
  formatFileSize,
  needsMultipart,
  type ContentType,
} from "@/lib/content";
import { cn } from "@/lib/utils";
import { createContentSchema } from "@/lib/validation-icerik";
import type { ContentFormOptions } from "@/db/queries/icerik";
import {
  StudentAssignPicker,
  type AssignableStudent,
} from "@/components/app/student-assign-picker";
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

const SOURCE_ITEMS = [
  { value: "upload" as const, label: "Cihazdan yükle", icon: UploadIcon },
  { value: "link" as const, label: "Bağlantı", icon: LinkIcon },
  { value: "none" as const, label: "Ek yok", icon: XIcon },
];

export type { AssignableStudent } from "@/components/app/student-assign-picker";

/** İçerik kaynağı — koç birini seçer; notta "Ek yok" da geçerlidir. */
type Source = "upload" | "link" | "none";

type UploadedFile = {
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileType: string;
};

/** Dosya adından başlık önerisi: "paragraf-taktik.pdf" → "paragraf-taktik". */
function titleFromFileName(name: string): string {
  return name.replace(/\.[A-Za-z0-9]{1,8}$/, "").trim().slice(0, 150);
}

type UploadResult =
  | { ok: true; data: UploadedFile }
  | { ok: false; error: string };

const UPLOAD_URL = "/api/icerik/yukle";

/** Sunucu yanıtını tek biçime indirger (ağ hatası da bir sonuçtur). */
async function readResult(res: Response): Promise<UploadResult> {
  try {
    return (await res.json()) as UploadResult;
  } catch {
    return { ok: false, error: "Dosya yüklenemedi. Bağlantını kontrol et." };
  }
}

/**
 * Küçük dosya: tek istek, ham gövde. Tarayıcı dosyayı akıtır, sunucu da
 * doğrudan R2'ye bağlar — bellekte tam kopya tutulmaz.
 */
async function uploadWhole(file: File): Promise<UploadResult> {
  const res = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: {
      "content-type": file.type || "application/octet-stream",
      "x-file-name": encodeURIComponent(file.name),
    },
    body: file,
  });
  return readResult(res);
}

type PartResult =
  | { ok: true; data: { partNumber: number; etag: string } }
  | { ok: false; error: string };

/** Tek parçayı gönderir (ham gövde). */
async function sendPart(
  q: string,
  partNumber: number,
  slice: Blob,
): Promise<PartResult> {
  try {
    const res = await fetch(`${UPLOAD_URL}?faz=parca&${q}&parca=${partNumber}`, {
      method: "POST",
      headers: { "content-type": "application/octet-stream" },
      body: slice,
    });
    return (await readResult(res)) as PartResult;
  } catch {
    return { ok: false, error: "Bağlantı koptu." };
  }
}

/**
 * Büyük dosya: R2 multipart. Dosya sabit UPLOAD_CHUNK_BYTES'lık dilimlere
 * bölünür (son dilim küçük kalabilir — R2'nin "son parça hariç hepsi eşit"
 * kuralı böyle sağlanır) ve her dilim AYRI istekle gider. Böylece
 * Cloudflare'in istek gövdesi limiti dosyanın değil parçanın tavanı olur.
 *
 * Parçalar SIRAYLA gönderilir: paralel gönderim mobil bağlantıda bant
 * genişliğini bölüp zaman aşımı riskini artırır, kazancı da belirsizdir.
 */
async function uploadInChunks(
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  const started = await fetch(`${UPLOAD_URL}?faz=basla`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
    }),
  });
  const session = (await readResult(started)) as
    | { ok: true; data: { key: string; uploadId: string } }
    | { ok: false; error: string };
  if (!session.ok) return session;

  const { key, uploadId } = session.data;
  const q = `key=${encodeURIComponent(key)}&uploadId=${encodeURIComponent(uploadId)}`;
  const total = chunkCountFor(file.size);
  const parts: { partNumber: number; etag: string }[] = [];

  for (let i = 0; i < total; i++) {
    const slice = file.slice(
      i * UPLOAD_CHUNK_BYTES,
      Math.min((i + 1) * UPLOAD_CHUNK_BYTES, file.size),
    );
    // Tek parça takılırsa tüm yükleme çöpe gitmesin — bir kez daha denenir.
    let part = await sendPart(q, i + 1, slice);
    if (!part.ok) part = await sendPart(q, i + 1, slice);
    if (!part.ok) {
      // Yarım kalan oturumu bırakma — R2'de çöp parça kalmasın.
      void fetch(`${UPLOAD_URL}?faz=iptal&${q}`, { method: "POST" });
      return part;
    }
    parts.push(part.data);
    onProgress(Math.round(((i + 1) / total) * 100));
  }

  const done = await fetch(`${UPLOAD_URL}?faz=bitir&${q}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type || "application/octet-stream",
      parts,
    }),
  });
  return readResult(done);
}

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
  const { refresh } = useRefresh();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assignIds, setAssignIds] = useState<number[]>(
    fixedEnrollmentId ? [fixedEnrollmentId] : [],
  );
  const [source, setSource] = useState<Source>("upload");
  const [uploading, setUploading] = useState(false);
  /** Parçalı yüklemede tamamlanan yüzde (0 = tek parça / henüz başlamadı). */
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(createContentSchema),
    defaultValues: {
      type: "video",
      title: "",
      url: "",
      body: "",
      fileKey: "",
      fileName: "",
      fileSize: null,
      fileType: "",
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

  /** Dosya alanlarını forma yazar (boş obje → temizler). */
  const setFileFields = (file: UploadedFile | null) => {
    setUploaded(file);
    form.setValue("fileKey", file?.fileKey ?? "");
    form.setValue("fileName", file?.fileName ?? "");
    form.setValue("fileSize", file?.fileSize ?? null);
    form.setValue("fileType", file?.fileType ?? "");
    if (file) form.clearErrors("url");
  };

  const pickSource = (next: Source) => {
    setSource(next);
    // Kaynak tek olsun: diğerini boşalt ki kayıtta ikisi birden durmasın.
    if (next !== "upload" && uploaded) setFileFields(null);
    if (next !== "link") form.setValue("url", "");
    form.clearErrors("url");
  };

  const uploadFile = async (file: File) => {
    if (file.size > MAX_CONTENT_FILE_BYTES) {
      toast.error(
        `Dosya en fazla ${formatFileSize(MAX_CONTENT_FILE_BYTES)} olabilir.`,
      );
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const json = needsMultipart(file.size)
        ? await uploadInChunks(file, setProgress)
        : await uploadWhole(file);
      if (!json.ok) {
        toast.error(json.error);
        return;
      }
      setFileFields(json.data);
      // Tür ve başlık boşsa dosyadan doldur — koç istediğinde değiştirir.
      form.setValue("type", contentTypeForFile(file.type, file.name));
      if (!form.getValues("title")?.trim()) {
        form.setValue("title", titleFromFileName(file.name));
      }
      toast.success("Dosya yüklendi");
    } catch {
      toast.error("Dosya yüklenemedi. Bağlantını kontrol et.");
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    form.reset();
    setUploaded(null);
    setSource("upload");
    setAssignIds(fixedEnrollmentId ? [fixedEnrollmentId] : []);
  };

  const onSubmit = async (values: FormOutput) => {
    setSubmitting(true);
    const res = await callAction(createContentItem, { ...values, enrollmentIds: assignIds });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("İçerik eklendi");
    setOpen(false);
    resetForm();
    refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon data-icon="inline-start" />
        İçerik ekle
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>İçerik ekle</DialogTitle>
          <DialogDescription>
            Video, PDF, doküman, not ya da bağlantı. Dosyayı cihazından
            yükleyebilir ya da bağlantı verebilirsin — kütüphaneye ya da belirli
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
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Notun kendisi içeriktir → ek varsayılan olarak yok;
                        // diğer türlerde bir kaynak seçili kalmalı.
                        if (value === "note" && !uploaded) {
                          pickSource("none");
                        } else if (value !== "note" && source === "none") {
                          pickSource("upload");
                        }
                      }}
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

            <Field data-invalid={errors.url ? true : undefined}>
              <FieldLabel>
                {type === "note" ? "Ek (isteğe bağlı)" : "İçerik kaynağı *"}
              </FieldLabel>
              <div className="flex flex-wrap items-center gap-1.5">
                {SOURCE_ITEMS.filter(
                  (s) => s.value !== "none" || type === "note",
                ).map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => pickSource(s.value)}
                    aria-pressed={source === s.value}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      source === s.value
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:bg-muted/70",
                    )}
                  >
                    <s.icon className="size-3.5" />
                    {s.label}
                  </button>
                ))}
              </div>

              {source === "upload" &&
                (uploaded ? (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                    <PaperclipIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">
                      {uploaded.fileName}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatFileSize(uploaded.fileSize)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Dosyayı kaldır"
                      onClick={() => setFileFields(null)}
                    >
                      <XIcon />
                    </Button>
                  </div>
                ) : (
                  <input
                    ref={fileInputRef}
                    id="ic-dosya"
                    type="file"
                    accept={UPLOAD_ACCEPT}
                    disabled={uploading}
                    aria-invalid={errors.url ? true : undefined}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadFile(file);
                    }}
                    className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
                  />
                ))}

              {source === "link" && (
                <Input
                  id="ic-url"
                  inputMode="url"
                  placeholder="https://youtube.com/watch?v=…"
                  aria-invalid={errors.url ? true : undefined}
                  {...form.register("url")}
                />
              )}

              <FieldError errors={[errors.url]} />
              <FieldDescription>
                {uploading
                  ? progress > 0
                    ? `Yükleniyor… %${progress}`
                    : "Yükleniyor…"
                  : source === "upload"
                    ? `PDF, Word/Excel, görsel, ses ya da video — en fazla ${formatFileSize(MAX_CONTENT_FILE_BYTES)}. Öğrenci uygulama içinden açar.`
                    : source === "link"
                      ? "YouTube bağlantıları öğrenci tarafında küçük resimle görünür."
                      : "İstersen nota bir dosya ya da bağlantı ekleyebilirsin."}
              </FieldDescription>
            </Field>

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
                <StudentAssignPicker
                  students={students}
                  value={assignIds}
                  onChange={setAssignIds}
                />
                <FieldDescription>
                  Sınav sekmesini seç, &quot;Görünenleri seç&quot; ile o gruba
                  tek dokunuşta ata.
                </FieldDescription>
              </Field>
            )}

            <Button
              type="submit"
              disabled={submitting || uploading}
              className="self-start"
            >
              {submitting
                ? "Ekleniyor…"
                : uploading
                  ? "Dosya yükleniyor…"
                  : "İçeriği ekle"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
