"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { useRefresh } from "@/lib/use-refresh";
import { callAction } from "@/lib/action-client";
import { setStudentSegment } from "@/actions/students";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

/**
 * BİLAD grubu + erişim bitişi. Öğrenci tam erişimlidir; grup yalnız koç
 * tarafında ayrı listelenmek içindir, bitiş tarihi de yalnız gösterilir.
 */
export function StudentSegmentControl({
  studentId,
  segment,
  endDate,
}: {
  studentId: number;
  segment: "bilad" | null;
  /** YYYY-AA-GG (İstanbul) ya da boş. */
  endDate: string;
}) {
  const { refresh } = useRefresh();
  const [bilad, setBilad] = useState(segment === "bilad");
  const [end, setEnd] = useState(endDate);
  const [pending, startTransition] = useTransition();

  const dirty = bilad !== (segment === "bilad") || end !== endDate;

  const save = () => {
    startTransition(async () => {
      const res = await callAction(setStudentSegment, {
        studentId,
        segment: bilad ? "bilad" : "",
        endDate: bilad ? end : "",
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(bilad ? "BİLAD öğrencisi olarak kaydedildi." : "BİLAD grubundan çıkarıldı.");
      refresh();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={bilad}
          onCheckedChange={(v) => setBilad(v === true)}
          disabled={pending}
        />
        BİLAD öğrencisi
      </label>
      {bilad && (
        <label className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          Erişim bitiş
          <Input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            disabled={pending}
            className="h-8 w-auto"
          />
        </label>
      )}
      {dirty && (
        <Button size="sm" className="self-start" onClick={save} disabled={pending}>
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      )}
    </div>
  );
}
