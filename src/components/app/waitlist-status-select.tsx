"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { useRefresh } from "@/lib/use-refresh";
import { callAction } from "@/lib/action-client";
import { updateWaitlistStatus } from "@/actions/waitlist";
import type { WaitlistStatus } from "@/lib/validation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES: { value: WaitlistStatus; label: string }[] = [
  { value: "bekliyor", label: "Bekliyor" },
  { value: "davet_edildi", label: "Davet edildi" },
  { value: "kayit", label: "Kayıt" },
  { value: "ayrildi", label: "Ayrıldı" },
];

/** Bekleme satırında tek dokunuşla durum değiştirme. */
export function WaitlistStatusSelect({
  entryId,
  status,
}: {
  entryId: number;
  status: WaitlistStatus;
}) {
  const { refresh } = useRefresh();
  const [value, setValue] = useState<WaitlistStatus>(status);
  const [pending, startTransition] = useTransition();

  const onChange = (next: WaitlistStatus) => {
    const previous = value;
    setValue(next);
    startTransition(async () => {
      const res = await callAction(updateWaitlistStatus, { entryId, status: next });
      if (!res.ok) {
        setValue(previous);
        toast.error(res.error);
        return;
      }
      toast.success(
        `Durum güncellendi: ${STATUSES.find((s) => s.value === next)?.label}`,
      );
      refresh();
    });
  };

  return (
    <Select
      items={STATUSES}
      value={value}
      onValueChange={(v) => onChange(v as WaitlistStatus)}
      disabled={pending}
    >
      <SelectTrigger size="sm" aria-label="Bekleme durumu">
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
