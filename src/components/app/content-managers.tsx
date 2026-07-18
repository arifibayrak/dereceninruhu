"use client";

/**
 * /koc/icerik yöneticileri — yorum / paket / SSS CRUD'u.
 * Basit kontrollü formlar + Dialog editör; doğrulama server-side Zod
 * (actions/cms.ts), hatalar toast ile gösterilir.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  deleteFaq,
  deletePackage,
  deleteTestimonial,
  upsertFaq,
  upsertPackage,
  upsertTestimonial,
} from "@/actions/cms";
import type { ActionResult } from "@/actions/_guard";
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
  sortOrder: string;
  isActive: boolean;
};

const emptyTestimonial: TestimonialDraft = {
  studentName: "",
  exam: "YKS",
  result: "",
  quote: "",
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
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Sitedeki /sss sayfası ve ana sayfa SSS bölümü buradan beslenir.
        </p>
        <Button size="sm" onClick={() => setDraft({ ...emptyFaq })}>
          <PlusIcon data-icon="inline-start" />
          Soru ekle
        </Button>
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
