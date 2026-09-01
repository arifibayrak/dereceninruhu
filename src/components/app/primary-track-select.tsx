"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { useRefresh } from "@/lib/use-refresh";
import { callAction } from "@/lib/action-client";
import { setPrimaryTrack } from "@/actions/students";
import { trackFieldLabel, tracksFor } from "@/lib/tracks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Öğrencinin sınav bölümü — YKS'de alan, KPSS'de düzey.
 *
 * Kadro listesi bölüm bölüm ayrıldığı için bu alan boş kalan kayıt
 * "belirtilmemiş" grubunda görünür; koç buradan tek tıkla düzeltir. Sınavın
 * KENDİSİ buradan değişmez (bkz. `setPrimaryTrack`).
 */
export function PrimaryTrackSelect({
  studentId,
  examCode,
  trackCode,
}: {
  studentId: number;
  examCode: string;
  trackCode: string | null;
}) {
  const { refresh } = useRefresh();
  const [value, setValue] = useState(trackCode ?? "");
  const [pending, startTransition] = useTransition();

  const items = tracksFor(examCode);
  const what = trackFieldLabel(examCode).toLocaleLowerCase("tr");
  if (items.length === 0) return <span className="text-sm">{examCode}</span>;

  const save = (next: string) => {
    startTransition(async () => {
      const res = await callAction(setPrimaryTrack, {
        studentId,
        trackCode: next,
      });
      if (!res.ok) {
        setValue(trackCode ?? "");
        toast.error(res.error);
        return;
      }
      toast.success(`${examCode} · ${res.data.trackName}`, {
        description: "Öğrencinin bölümü güncellendi.",
      });
      refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium">{examCode}</span>
      <Select
        items={[...items]}
        value={value || null}
        onValueChange={(v) => {
          const next = (v as string) ?? "";
          if (!next || next === value) return;
          setValue(next);
          save(next);
        }}
        disabled={pending}
      >
        <SelectTrigger
          size="sm"
          aria-label={`${examCode} ${what} seçimi`}
          className={value ? undefined : "text-warning"}
        >
          <SelectValue placeholder={`${trackFieldLabel(examCode)} seç`} />
        </SelectTrigger>
        <SelectContent>
          {items.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
