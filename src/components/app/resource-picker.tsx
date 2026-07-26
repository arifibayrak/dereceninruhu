"use client";

import { CheckIcon } from "lucide-react";

import { MAX_TASK_RESOURCES } from "@/lib/plan-resources";
import { cn } from "@/lib/utils";
import { Field, FieldDescription, FieldTitle } from "@/components/ui/field";

export type PickerResource = { id: number; name: string };

/**
 * Bir program görevinin kaynakları — ÇOK SEÇİMLİ.
 *
 * Bir konu tek kaynaktan çalışılmaz ("Palme fasikül + 3D soru bankası"), o
 * yüzden açılır liste değil çip: seçim mobilde tek dokunuş, seçili kaynaklar
 * bir bakışta görünür. Seçim sırası gösterim sırasıdır.
 */
export function ResourcePicker({
  resources,
  value,
  onChange,
  idPrefix = "kaynak",
}: {
  resources: PickerResource[];
  value: number[];
  onChange: (next: number[]) => void;
  /** Aynı sayfada iki form olabilir — başlık id'si çakışmasın. */
  idPrefix?: string;
}) {
  if (resources.length === 0) return null;

  const full = value.length >= MAX_TASK_RESOURCES;
  const toggle = (id: number) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else if (!full) {
      onChange([...value, id]);
    }
  };

  return (
    <Field aria-labelledby={`${idPrefix}-baslik`}>
      <FieldTitle id={`${idPrefix}-baslik`}>Kaynak</FieldTitle>
      <FieldDescription>
        {value.length === 0
          ? "Birden çok kaynak seçebilirsin."
          : `${value.length} kaynak seçili${full ? " (en fazla bu kadar)" : ""}.`}
      </FieldDescription>
      <div className="flex flex-wrap gap-1.5">
        {resources.map((r) => {
          const on = value.includes(r.id);
          return (
            <button
              key={r.id}
              type="button"
              aria-pressed={on}
              disabled={!on && full}
              onClick={() => toggle(r.id)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors",
                on
                  ? "bg-primary/10 text-primary ring-1 ring-primary/25"
                  : "bg-background text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground",
                !on && full && "opacity-40",
              )}
            >
              {on && <CheckIcon className="size-3 shrink-0" />}
              {r.name}
            </button>
          );
        })}
      </div>
    </Field>
  );
}
