"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateLeadStatus } from "@/actions/leads";
import type { LeadStatus } from "@/lib/validation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "yeni", label: "Yeni" },
  { value: "görüşüldü", label: "Görüşüldü" },
  { value: "kayıt", label: "Kayıt" },
  { value: "kayıp", label: "Kayıp" },
];

/** Lead satırında tek dokunuşla durum değiştirme. */
export function LeadStatusSelect({
  leadId,
  status,
}: {
  leadId: number;
  status: LeadStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState<LeadStatus>(status);
  const [pending, startTransition] = useTransition();

  const onChange = (next: LeadStatus) => {
    const previous = value;
    setValue(next);
    startTransition(async () => {
      const res = await updateLeadStatus({ leadId, status: next });
      if (!res.ok) {
        setValue(previous);
        toast.error(res.error);
        return;
      }
      toast.success(`Durum güncellendi: ${STATUSES.find((s) => s.value === next)?.label}`);
      router.refresh();
    });
  };

  return (
    <Select
      items={STATUSES}
      value={value}
      onValueChange={(v) => onChange(v as LeadStatus)}
      disabled={pending}
    >
      <SelectTrigger size="sm" aria-label="Lead durumu">
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
