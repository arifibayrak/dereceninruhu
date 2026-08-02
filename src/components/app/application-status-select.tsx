"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { callAction } from "@/lib/action-client";
import { updateCoachApplicationStatus } from "@/actions/coach-applications";
import type { CoachApplicationStatus } from "@/lib/validation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES: { value: CoachApplicationStatus; label: string }[] = [
  { value: "yeni", label: "Yeni" },
  { value: "inceleniyor", label: "İnceleniyor" },
  { value: "gorusme", label: "Görüşme" },
  { value: "kabul", label: "Kabul" },
  { value: "ret", label: "Ret" },
];

/** Koç başvurusu satırında tek dokunuşla durum değiştirme (yalnız yönetici). */
export function ApplicationStatusSelect({
  applicationId,
  status,
}: {
  applicationId: number;
  status: CoachApplicationStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState<CoachApplicationStatus>(status);
  const [pending, startTransition] = useTransition();

  const onChange = (next: CoachApplicationStatus) => {
    const previous = value;
    setValue(next);
    startTransition(async () => {
      const res = await callAction(updateCoachApplicationStatus, {
        applicationId,
        status: next,
      });
      if (!res.ok) {
        setValue(previous);
        toast.error(res.error);
        return;
      }
      toast.success(
        `Durum güncellendi: ${STATUSES.find((s) => s.value === next)?.label}`,
      );
      router.refresh();
    });
  };

  return (
    <Select
      items={STATUSES}
      value={value}
      onValueChange={(v) => onChange(v as CoachApplicationStatus)}
      disabled={pending}
    >
      <SelectTrigger size="sm" aria-label="Başvuru durumu">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
