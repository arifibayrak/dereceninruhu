"use client";

/**
 * Toplu mesaj şablonları yönetimi — /koc/duyuru composer'ından açılır.
 * Kadro geneli (global) şablonlar; koç/yönetici ekler, düzenler, siler.
 * Doğrulama server-side (actions/message-templates.ts); {ad} gönderimde değişir.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { callAction } from "@/lib/action-client";
import {
  deleteMessageTemplate,
  upsertMessageTemplate,
} from "@/actions/message-templates";
import type { ActionResult } from "@/actions/_guard";
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
import { Textarea } from "@/components/ui/textarea";

export type MessageTemplate = {
  id: number;
  category: string;
  label: string;
  body: string;
  sortOrder: number;
  isActive: boolean;
};

type Draft = {
  id?: number;
  category: string;
  label: string;
  body: string;
  sortOrder: number;
  isActive: boolean;
};

function firstError(
  res: Extract<ActionResult<unknown>, { ok: false }>,
): string {
  if (res.fieldErrors) {
    const first = Object.values(res.fieldErrors)[0];
    if (first) return first;
  }
  return res.error;
}

export function TemplateManager({
  templates,
  open,
  onOpenChange,
}: {
  templates: MessageTemplate[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const categories = useMemo(
    () => [...new Set(templates.map((t) => t.category))],
    [templates],
  );

  /** Yeni şablonu grubunun sonuna yerleştir. */
  const nextOrder = (category: string) =>
    templates
      .filter((t) => t.category === category)
      .reduce((m, t) => Math.max(m, t.sortOrder), -1) + 1;

  const grouped = useMemo(() => {
    const map = new Map<string, MessageTemplate[]>();
    for (const t of templates) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    return [...map.entries()];
  }, [templates]);

  const startNew = () => {
    const category = categories[0] ?? "Genel";
    setDraft({
      category,
      label: "",
      body: "Merhaba {ad} 👋 ",
      sortOrder: nextOrder(category),
      isActive: true,
    });
  };

  const startEdit = (t: MessageTemplate) =>
    setDraft({
      id: t.id,
      category: t.category,
      label: t.label,
      body: t.body,
      sortOrder: t.sortOrder,
      isActive: t.isActive,
    });

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const res = await callAction(upsertMessageTemplate, draft);
    setSaving(false);
    if (!res.ok) {
      toast.error(firstError(res));
      return;
    }
    toast.success(draft.id ? "Şablon güncellendi" : "Şablon eklendi");
    setDraft(null);
    router.refresh();
  };

  const remove = async (t: MessageTemplate) => {
    if (!window.confirm(`"${t.label}" şablonu silinsin mi?`)) return;
    const res = await callAction(deleteMessageTemplate, t.id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Şablon silindi");
    router.refresh();
  };

  return (
    <>
      {/* Liste */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Şablonları yönet</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                <code className="rounded bg-muted px-1 py-0.5">{"{ad}"}</code>{" "}
                gönderirken öğrenci adıyla değişir.
              </p>
              <Button size="sm" onClick={startNew}>
                <PlusIcon data-icon="inline-start" />
                Yeni
              </Button>
            </div>

            {templates.length === 0 ? (
              <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                Henüz şablon yok — “Yeni” ile ekleyebilirsin.
              </p>
            ) : (
              <div className="flex max-h-[55vh] flex-col gap-4 overflow-y-auto pr-1">
                {grouped.map(([category, items]) => (
                  <div key={category} className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {category}
                    </span>
                    <ul className="flex flex-col divide-y rounded-xl bg-card ring-1 ring-foreground/10">
                      {items.map((t) => (
                        <li
                          key={t.id}
                          className="flex items-start gap-2 px-3 py-2.5"
                        >
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="flex items-center gap-2 text-sm font-medium">
                              {t.label}
                              {!t.isActive && (
                                <Badge variant="outline">Gizli</Badge>
                              )}
                            </span>
                            <span className="line-clamp-2 text-xs text-muted-foreground">
                              {t.body}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Düzenle"
                            onClick={() => startEdit(t)}
                          >
                            <PencilIcon />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Sil"
                            onClick={() => remove(t)}
                          >
                            <Trash2Icon className="text-destructive" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Editör */}
      <Dialog open={draft !== null} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {draft?.id ? "Şablonu düzenle" : "Yeni şablon"}
            </DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="tpl-grup">Grup *</FieldLabel>
                <Input
                  id="tpl-grup"
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({ ...draft, category: e.target.value })
                  }
                  placeholder="Örn. Ödeme"
                />
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() =>
                          setDraft((d) =>
                            d
                              ? {
                                  ...d,
                                  category: c,
                                  sortOrder: d.id ? d.sortOrder : nextOrder(c),
                                }
                              : d,
                          )
                        }
                        className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted/70"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="tpl-baslik">Başlık *</FieldLabel>
                <Input
                  id="tpl-baslik"
                  value={draft.label}
                  onChange={(e) =>
                    setDraft({ ...draft, label: e.target.value })
                  }
                  placeholder="Örn. Vade yaklaşıyor"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="tpl-mesaj">Mesaj *</FieldLabel>
                <Textarea
                  id="tpl-mesaj"
                  rows={4}
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  className="resize-y"
                />
                <FieldDescription>
                  <code className="rounded bg-muted px-1 py-0.5">{"{ad}"}</code>{" "}
                  öğrencinin adıyla değişir.
                </FieldDescription>
              </Field>
              <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium select-none">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={draft.isActive}
                  onChange={(e) =>
                    setDraft({ ...draft, isActive: e.target.checked })
                  }
                />
                Listede görünsün
              </label>
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
    </>
  );
}
