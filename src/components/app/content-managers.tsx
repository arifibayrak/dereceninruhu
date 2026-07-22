"use client";

/**
 * /koc/site yöneticileri — yorum / paket / SSS CRUD'u.
 * Basit kontrollü formlar + Dialog editör; doğrulama server-side Zod
 * (actions/cms.ts), hatalar toast ile gösterilir.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, PlusIcon, Trash2Icon, TrophyIcon } from "lucide-react";
import { toast } from "sonner";

import {
  deleteFaq,
  deletePackage,
  deleteResourceLink,
  deleteTestimonial,
  seedMissingFaqs,
  seedResourceLinks,
  uploadProfileImage,
  upsertFaq,
  upsertPackage,
  upsertResourceLink,
  upsertTestimonial,
} from "@/actions/cms";
import type { ActionResult } from "@/actions/_guard";
import {
  CATEGORY_META,
  RESOURCE_CATEGORIES,
  type ResourceCategory,
} from "@/db/seed/resource-links";
import { formatKurus, parseTryToKurus } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/* ------------------------------- Ortak parçalar --------------------------- */

function firstError<T>(res: Extract<ActionResult<T>, { ok: false }>): string {
  if (res.fieldErrors) {
    const first = Object.values(res.fieldErrors)[0];
    if (first) return first;
  }
  return res.error;
}

function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge className="bg-success/10 text-success">Sitede</Badge>
  ) : (
    <Badge variant="outline">Gizli</Badge>
  );
}

function ActiveCheckbox({
  checked,
  onChange,
  label = "Sitede görünsün",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium select-none">
      <input
        type="checkbox"
        className="size-4 accent-primary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
      {text}
    </p>
  );
}

/* ------------------------------ Yorum yöneticisi -------------------------- */

export type TestimonialRow = {
  id: number;
  studentName: string;
  exam: string | null;
  result: string | null;
  quote: string;
  proofImageUrl: string | null;
  videoUrl: string | null;
  isFeatured: boolean;
  hasConsent: boolean;
  sortOrder: number;
  isActive: boolean;
};

const EXAMS = ["KPSS", "YKS", "LGS"] as const;
type ExamCode = (typeof EXAMS)[number];

type TestimonialDraft = {
  id?: number;
  studentName: string;
  exam: ExamCode;
  result: string;
  quote: string;
  proofImageUrl: string;
  videoUrl: string;
  isFeatured: boolean;
  hasConsent: boolean;
  sortOrder: string;
  isActive: boolean;
};

const emptyTestimonial: TestimonialDraft = {
  studentName: "",
  exam: "YKS",
  result: "",
  quote: "",
  proofImageUrl: "",
  videoUrl: "",
  isFeatured: false,
  hasConsent: false,
  sortOrder: "0",
  isActive: true,
};

export function TestimonialManager({ rows }: { rows: TestimonialRow[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<TestimonialDraft | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const res = await upsertTestimonial({
      id: draft.id,
      studentName: draft.studentName,
      exam: draft.exam,
      result: draft.result,
      quote: draft.quote,
      proofImageUrl: draft.proofImageUrl,
      videoUrl: draft.videoUrl,
      isFeatured: draft.isFeatured,
      hasConsent: draft.hasConsent,
      sortOrder: draft.sortOrder,
      isActive: draft.isActive,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(firstError(res));
      return;
    }
    toast.success("Yorum kaydedildi");
    setDraft(null);
    router.refresh();
  };

  const remove = async (row: TestimonialRow) => {
    if (!window.confirm(`"${row.studentName}" yorumu silinsin mi?`)) return;
    const res = await deleteTestimonial(row.id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Yorum silindi");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Sitede ad + soyadın ilk harfi kullan (örn. &quot;Merve K.&quot;).
        </p>
        <Button size="sm" onClick={() => setDraft({ ...emptyTestimonial })}>
          <PlusIcon data-icon="inline-start" />
          Yorum ekle
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyRow text="Henüz yorum yok — seed'i çalıştır (pnpm db:seed:cms) ya da elle ekle." />
      ) : (
        <ul className="flex flex-col divide-y rounded-2xl bg-card ring-1 ring-foreground/10">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {row.studentName}
                  {row.exam && <Badge variant="outline">{row.exam}</Badge>}
                  {row.isFeatured && row.hasConsent && (
                    <Badge className="gap-1 bg-gold text-gold-foreground">
                      <TrophyIcon className="size-3" />
                      Vitrinde
                    </Badge>
                  )}
                  {row.isFeatured && !row.hasConsent && (
                    <Badge variant="outline" className="text-destructive">
                      İzin bekliyor
                    </Badge>
                  )}
                </span>
                <span className="line-clamp-1 text-xs text-muted-foreground">
                  “{row.quote}”
                </span>
              </div>
              <ActiveBadge active={row.isActive} />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Düzenle"
                onClick={() =>
                  setDraft({
                    id: row.id,
                    studentName: row.studentName,
                    exam: (EXAMS as readonly string[]).includes(row.exam ?? "")
                      ? (row.exam as ExamCode)
                      : "YKS",
                    result: row.result ?? "",
                    quote: row.quote,
                    proofImageUrl: row.proofImageUrl ?? "",
                    videoUrl: row.videoUrl ?? "",
                    isFeatured: row.isFeatured,
                    hasConsent: row.hasConsent,
                    sortOrder: String(row.sortOrder),
                    isActive: row.isActive,
                  })
                }
              >
                <PencilIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Sil"
                onClick={() => remove(row)}
              >
                <Trash2Icon className="text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={draft !== null} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {draft?.id ? "Yorumu düzenle" : "Yeni yorum"}
            </DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="yorum-ad">İsim (görünen) *</FieldLabel>
                  <Input
                    id="yorum-ad"
                    placeholder="Örn. Merve K."
                    value={draft.studentName}
                    onChange={(e) =>
                      setDraft({ ...draft, studentName: e.target.value })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="yorum-sinav">Sınav *</FieldLabel>
                  <Select
                    items={EXAMS.map((e) => ({ value: e, label: e }))}
                    value={draft.exam}
                    onValueChange={(v) =>
                      setDraft({ ...draft, exam: v as ExamCode })
                    }
                  >
                    <SelectTrigger id="yorum-sinav" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXAMS.map((e) => (
                        <SelectItem key={e} value={e}>
                          {e}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="yorum-metin">Yorum *</FieldLabel>
                <Textarea
                  id="yorum-metin"
                  rows={4}
                  value={draft.quote}
                  onChange={(e) => setDraft({ ...draft, quote: e.target.value })}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="yorum-sonuc">Derece / sonuç</FieldLabel>
                  <Input
                    id="yorum-sonuc"
                    placeholder='Örn. "Fen Lisesi kazandı"'
                    value={draft.result}
                    onChange={(e) =>
                      setDraft({ ...draft, result: e.target.value })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="yorum-sira">Sıra</FieldLabel>
                  <Input
                    id="yorum-sira"
                    inputMode="numeric"
                    value={draft.sortOrder}
                    onChange={(e) =>
                      setDraft({ ...draft, sortOrder: e.target.value })
                    }
                  />
                  <FieldDescription>Küçük sayı önce görünür.</FieldDescription>
                </Field>
              </div>
              <ActiveCheckbox
                checked={draft.isActive}
                onChange={(v) => setDraft({ ...draft, isActive: v })}
              />

              {/* --- Derece vitrini --- */}
              <div className="flex flex-col gap-4 border-t pt-4">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Derece vitrini
                </span>

                <ProofImageField
                  value={draft.proofImageUrl}
                  onChange={(url) =>
                    setDraft({ ...draft, proofImageUrl: url })
                  }
                />

                <Field>
                  <FieldLabel htmlFor="yorum-video">Tavsiye videosu</FieldLabel>
                  <Input
                    id="yorum-video"
                    placeholder="https://youtube.com/watch?v=…"
                    value={draft.videoUrl}
                    onChange={(e) =>
                      setDraft({ ...draft, videoUrl: e.target.value })
                    }
                  />
                  <FieldDescription>
                    Opsiyonel — kartta oynat kapağı olarak görünür.
                  </FieldDescription>
                </Field>

                <label className="flex w-fit cursor-pointer items-start gap-2 text-sm select-none">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 accent-primary"
                    checked={draft.hasConsent}
                    onChange={(e) =>
                      setDraft({ ...draft, hasConsent: e.target.checked })
                    }
                  />
                  <span>
                    <span className="font-medium">
                      Öğrenci yayın izni verdi
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Sonuç belgesi ve sıralama kişisel veridir; izin
                      işaretlenmeden vitrine çıkamaz.
                    </span>
                  </span>
                </label>

                <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium select-none">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={draft.isFeatured}
                    disabled={!draft.hasConsent}
                    onChange={(e) =>
                      setDraft({ ...draft, isFeatured: e.target.checked })
                    }
                  />
                  <TrophyIcon className="size-4" />
                  &quot;Derece yapan öğrencilerimiz&quot; bölümünde göster
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Vazgeç
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * ÖSYM sonuç belgesi yükleme alanı. `uploadProfileImage`'ı yeniden kullanır —
 * o da `profiles/…` önekine yazar ve bu önek `/api/uploads` tarafından
 * herkese açık servis edilir (belge zaten yayınlanmak üzere yükleniyor).
 */
function ProofImageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const pick = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadProfileImage(fd);
    setUploading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    onChange(res.data.url);
    toast.success("Belge yüklendi");
  };

  return (
    <Field>
      <FieldLabel htmlFor="yorum-belge">Sonuç belgesi görseli</FieldLabel>
      <div className="flex items-center gap-3">
        {value && (
          // Yönetici önizlemesi — next/image optimizasyonu gerektirmez.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Sonuç belgesi önizlemesi"
            className="h-16 w-24 shrink-0 rounded-lg object-cover ring-1 ring-foreground/10"
          />
        )}
        <input
          id="yorum-belge"
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void pick(file);
          }}
          className="min-w-0 flex-1 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />
        {value && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Belgeyi kaldır"
            onClick={() => onChange("")}
          >
            <Trash2Icon className="text-destructive" />
          </Button>
        )}
      </div>
      <FieldDescription>
        {uploading
          ? "Yükleniyor…"
          : "ÖSYM/MEB sonuç belgesi ekran görüntüsü. TC kimlik no gibi alanları kırpmayı unutma."}
      </FieldDescription>
    </Field>
  );
}

/* ---------------------------- Kaynak yöneticisi --------------------------- */

export type ResourceLinkRow = {
  id: number;
  category: ResourceCategory;
  title: string;
  description: string | null;
  url: string;
  examCode: string | null;
  provider: string | null;
  sortOrder: number;
  isFeatured: boolean;
  isActive: boolean;
};

const EXAM_OPTIONS = [
  { value: "", label: "Tüm sınavlar" },
  { value: "YKS", label: "YKS" },
  { value: "LGS", label: "LGS" },
  { value: "KPSS", label: "KPSS" },
] as const;

type ResourceDraft = Omit<ResourceLinkRow, "id" | "sortOrder"> & {
  id?: number;
  sortOrder: string;
};

const emptyResource: ResourceDraft = {
  category: "cikmis-sorular",
  title: "",
  description: "",
  url: "",
  examCode: "",
  provider: "",
  sortOrder: "0",
  isFeatured: false,
  isActive: true,
};

/**
 * /kaynaklar dizininin yöneticisi. Kaynaklar DIŞ bağlantıdır — kurumların
 * site yapısı değiştikçe kırılabilir, bu yüzden buradan deploy'suz düzeltilir.
 */
export function ResourceLinkManager({ rows }: { rows: ResourceLinkRow[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<ResourceDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const res = await upsertResourceLink({
      id: draft.id,
      category: draft.category,
      title: draft.title,
      description: draft.description ?? "",
      url: draft.url,
      examCode: draft.examCode ? draft.examCode : null,
      provider: draft.provider ?? "",
      sortOrder: draft.sortOrder,
      isFeatured: draft.isFeatured,
      isActive: draft.isActive,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(firstError(res));
      return;
    }
    toast.success("Kaynak kaydedildi");
    setDraft(null);
    router.refresh();
  };

  const remove = async (row: ResourceLinkRow) => {
    if (!window.confirm(`"${row.title}" kaynağı silinsin mi?`)) return;
    const res = await deleteResourceLink(row.id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Kaynak silindi");
    router.refresh();
  };

  const seed = async () => {
    setSeeding(true);
    const res = await seedResourceLinks();
    setSeeding(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`${res.data.inserted} kaynak eklendi`);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Yalnız resmî kaynaklara (MEB, ÖSYM, YÖK) link ver — içerik
          barındırmıyoruz.
        </p>
        <div className="flex items-center gap-2">
          {rows.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={seed}
              disabled={seeding}
            >
              {seeding ? "Yükleniyor…" : "Hazır listeyi yükle"}
            </Button>
          )}
          <Button size="sm" onClick={() => setDraft({ ...emptyResource })}>
            <PlusIcon data-icon="inline-start" />
            Kaynak ekle
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyRow text="Henüz kaynak eklenmedi — site şimdilik koddaki hazır listeyi gösteriyor." />
      ) : (
        <ul className="flex flex-col divide-y rounded-2xl bg-card ring-1 ring-foreground/10">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {row.title}
                  <Badge variant="outline">
                    {CATEGORY_META[row.category].label}
                  </Badge>
                  {row.examCode && (
                    <Badge variant="secondary">{row.examCode}</Badge>
                  )}
                </span>
                <span className="line-clamp-1 text-xs text-muted-foreground">
                  {row.url}
                </span>
              </div>
              <ActiveBadge active={row.isActive} />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Düzenle"
                onClick={() =>
                  setDraft({
                    id: row.id,
                    category: row.category,
                    title: row.title,
                    description: row.description ?? "",
                    url: row.url,
                    examCode: row.examCode ?? "",
                    provider: row.provider ?? "",
                    sortOrder: String(row.sortOrder),
                    isFeatured: row.isFeatured,
                    isActive: row.isActive,
                  })
                }
              >
                <PencilIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Sil"
                onClick={() => remove(row)}
              >
                <Trash2Icon className="text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={draft !== null} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {draft?.id ? "Kaynağı düzenle" : "Yeni kaynak"}
            </DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="kaynak-baslik">Başlık *</FieldLabel>
                <Input
                  id="kaynak-baslik"
                  placeholder="Örn. ÖSYM Çıkmış Sorular Arşivi"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="kaynak-url">Bağlantı *</FieldLabel>
                <Input
                  id="kaynak-url"
                  placeholder="https://… veya /araclar/net-hesaplama"
                  value={draft.url}
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                />
                <FieldDescription>
                  Dış bağlantılar yeni sekmede açılır; &quot;/&quot; ile
                  başlayanlar kendi sayfamız sayılır.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="kaynak-aciklama">Açıklama</FieldLabel>
                <Textarea
                  id="kaynak-aciklama"
                  rows={3}
                  maxLength={400}
                  value={draft.description ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="kaynak-kategori">Kategori *</FieldLabel>
                  <Select
                    items={RESOURCE_CATEGORIES.map((c) => ({
                      value: c,
                      label: CATEGORY_META[c].label,
                    }))}
                    value={draft.category}
                    onValueChange={(v) =>
                      setDraft({ ...draft, category: v as ResourceCategory })
                    }
                  >
                    <SelectTrigger id="kaynak-kategori" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {CATEGORY_META[c].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="kaynak-sinav">Sınav</FieldLabel>
                  <Select
                    items={EXAM_OPTIONS.map((o) => ({ ...o }))}
                    value={draft.examCode ?? ""}
                    onValueChange={(v) =>
                      setDraft({ ...draft, examCode: String(v) })
                    }
                  >
                    <SelectTrigger id="kaynak-sinav" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXAM_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="kaynak-kurum">Kurum</FieldLabel>
                  <Input
                    id="kaynak-kurum"
                    placeholder="ÖSYM / MEB / OGM Materyal"
                    value={draft.provider ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, provider: e.target.value })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="kaynak-sira">Sıra</FieldLabel>
                  <Input
                    id="kaynak-sira"
                    inputMode="numeric"
                    value={draft.sortOrder}
                    onChange={(e) =>
                      setDraft({ ...draft, sortOrder: e.target.value })
                    }
                  />
                  <FieldDescription>Küçük sayı önce görünür.</FieldDescription>
                </Field>
              </div>

              <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium select-none">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={draft.isFeatured}
                  onChange={(e) =>
                    setDraft({ ...draft, isFeatured: e.target.checked })
                  }
                />
                Öne çıkan rozeti göster
              </label>

              <ActiveCheckbox
                checked={draft.isActive}
                onChange={(v) => setDraft({ ...draft, isActive: v })}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Vazgeç
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------ Paket yöneticisi -------------------------- */

export type PackageRow = {
  id: number;
  name: string;
  priceKurus: number;
  period: string | null;
  features: string[];
  sortOrder: number;
  isActive: boolean;
};

type PackageDraft = {
  id?: number;
  name: string;
  priceTry: string;
  period: string;
  features: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyPackage: PackageDraft = {
  name: "",
  priceTry: "",
  period: "aylık",
  features: "",
  sortOrder: "0",
  isActive: true,
};

export function PackageManager({ rows }: { rows: PackageRow[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<PackageDraft | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!draft) return;
    const priceKurus = parseTryToKurus(draft.priceTry);
    if (priceKurus === null) {
      toast.error("Geçerli bir fiyat girin (örn. 2.500 veya 2.500,50).");
      return;
    }
    setSaving(true);
    const res = await upsertPackage({
      id: draft.id,
      name: draft.name,
      priceKurus,
      period: draft.period,
      features: draft.features
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      sortOrder: draft.sortOrder,
      isActive: draft.isActive,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(firstError(res));
      return;
    }
    toast.success("Paket kaydedildi");
    setDraft(null);
    router.refresh();
  };

  const remove = async (row: PackageRow) => {
    if (!window.confirm(`"${row.name}" paketi silinsin mi?`)) return;
    const res = await deletePackage(row.id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Paket silindi");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Fiyatı ₺ olarak gir; kuruş cinsinden saklanır. Seed fiyatları YER
          TUTUCU — gerçeklerini burada belirle.
        </p>
        <Button size="sm" onClick={() => setDraft({ ...emptyPackage })}>
          <PlusIcon data-icon="inline-start" />
          Paket ekle
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyRow text="Henüz paket yok — seed'i çalıştır (pnpm db:seed:cms) ya da elle ekle." />
      ) : (
        <ul className="flex flex-col divide-y rounded-2xl bg-card ring-1 ring-foreground/10">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium">{row.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatKurus(row.priceKurus)}
                  {row.period ? ` / ${row.period}` : ""} · {row.features.length}{" "}
                  özellik
                </span>
              </div>
              <ActiveBadge active={row.isActive} />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Düzenle"
                onClick={() =>
                  setDraft({
                    id: row.id,
                    name: row.name,
                    priceTry: (row.priceKurus / 100).toLocaleString("tr-TR", {
                      maximumFractionDigits: 2,
                    }),
                    period: row.period ?? "",
                    features: row.features.join("\n"),
                    sortOrder: String(row.sortOrder),
                    isActive: row.isActive,
                  })
                }
              >
                <PencilIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Sil"
                onClick={() => remove(row)}
              >
                <Trash2Icon className="text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={draft !== null} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {draft?.id ? "Paketi düzenle" : "Yeni paket"}
            </DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="paket-ad">Paket adı *</FieldLabel>
                <Input
                  id="paket-ad"
                  placeholder="Örn. Aylık Koçluk"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="paket-fiyat">Fiyat (₺) *</FieldLabel>
                  <Input
                    id="paket-fiyat"
                    inputMode="decimal"
                    placeholder="2.500"
                    value={draft.priceTry}
                    onChange={(e) =>
                      setDraft({ ...draft, priceTry: e.target.value })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="paket-donem">Dönem</FieldLabel>
                  <Input
                    id="paket-donem"
                    placeholder="aylık / 3 aylık / tek seferlik"
                    value={draft.period}
                    onChange={(e) =>
                      setDraft({ ...draft, period: e.target.value })
                    }
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="paket-ozellik">
                  Özellikler (her satır bir madde)
                </FieldLabel>
                <Textarea
                  id="paket-ozellik"
                  rows={5}
                  placeholder={"Haftalık birebir görüşme\nSoru ve deneme takibi"}
                  value={draft.features}
                  onChange={(e) =>
                    setDraft({ ...draft, features: e.target.value })
                  }
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="paket-sira">Sıra</FieldLabel>
                  <Input
                    id="paket-sira"
                    inputMode="numeric"
                    value={draft.sortOrder}
                    onChange={(e) =>
                      setDraft({ ...draft, sortOrder: e.target.value })
                    }
                  />
                </Field>
                <div className="flex items-end pb-1.5">
                  <ActiveCheckbox
                    checked={draft.isActive}
                    onChange={(v) => setDraft({ ...draft, isActive: v })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Vazgeç
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------- SSS yöneticisi --------------------------- */

export type FaqRow = {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
};

type FaqDraft = {
  id?: number;
  question: string;
  answer: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyFaq: FaqDraft = {
  question: "",
  answer: "",
  sortOrder: "0",
  isActive: true,
};

export function FaqManager({ rows }: { rows: FaqRow[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<FaqDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const addMissing = async () => {
    setSeeding(true);
    const res = await seedMissingFaqs();
    setSeeding(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`${res.data.inserted} soru eklendi`);
    router.refresh();
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const res = await upsertFaq({
      id: draft.id,
      question: draft.question,
      answer: draft.answer,
      sortOrder: draft.sortOrder,
      isActive: draft.isActive,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(firstError(res));
      return;
    }
    toast.success("Soru kaydedildi");
    setDraft(null);
    router.refresh();
  };

  const remove = async (row: FaqRow) => {
    if (!window.confirm("Bu soru silinsin mi?")) return;
    const res = await deleteFaq(row.id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Soru silindi");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Sitedeki /sss sayfası ve ana sayfa SSS bölümü buradan beslenir.
        </p>
        <div className="flex items-center gap-2">
          {/*
            Kodda yeni SSS tanımlandığında D1 dolu olduğu için canlıya
            yansımaz; bu düğme yalnız EKSİK olanları ekler, mevcut cevapları
            ezmez (bkz. actions/cms.ts → seedMissingFaqs).
          */}
          <Button variant="outline" size="sm" onClick={addMissing} disabled={seeding}>
            {seeding ? "Ekleniyor…" : "Eksik hazır soruları ekle"}
          </Button>
          <Button size="sm" onClick={() => setDraft({ ...emptyFaq })}>
            <PlusIcon data-icon="inline-start" />
            Soru ekle
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyRow text="Henüz soru yok — seed'i çalıştır (pnpm db:seed:cms) ya da elle ekle." />
      ) : (
        <ul className="flex flex-col divide-y rounded-2xl bg-card ring-1 ring-foreground/10">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="line-clamp-1 text-sm font-medium">
                  {row.question}
                </span>
                <span className="line-clamp-1 text-xs text-muted-foreground">
                  {row.answer}
                </span>
              </div>
              <ActiveBadge active={row.isActive} />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Düzenle"
                onClick={() =>
                  setDraft({
                    id: row.id,
                    question: row.question,
                    answer: row.answer,
                    sortOrder: String(row.sortOrder),
                    isActive: row.isActive,
                  })
                }
              >
                <PencilIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Sil"
                onClick={() => remove(row)}
              >
                <Trash2Icon className="text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={draft !== null} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {draft?.id ? "Soruyu düzenle" : "Yeni soru"}
            </DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="sss-soru">Soru *</FieldLabel>
                <Input
                  id="sss-soru"
                  value={draft.question}
                  onChange={(e) =>
                    setDraft({ ...draft, question: e.target.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="sss-cevap">Cevap *</FieldLabel>
                <Textarea
                  id="sss-cevap"
                  rows={5}
                  value={draft.answer}
                  onChange={(e) =>
                    setDraft({ ...draft, answer: e.target.value })
                  }
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="sss-sira">Sıra</FieldLabel>
                  <Input
                    id="sss-sira"
                    inputMode="numeric"
                    value={draft.sortOrder}
                    onChange={(e) =>
                      setDraft({ ...draft, sortOrder: e.target.value })
                    }
                  />
                </Field>
                <div className="flex items-end pb-1.5">
                  <ActiveCheckbox
                    checked={draft.isActive}
                    onChange={(v) => setDraft({ ...draft, isActive: v })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Vazgeç
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
