"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { assignStudentCoach } from "@/actions/admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CoachOption = { id: string; name: string };

const UNASSIGNED = "yok";

/** Öğrenci satırında koç atama / değiştirme — yalnız yönetici görür. */
export function CoachAssignSelect({
  enrollmentId,
  coachUserId,
  coaches,
  size = "sm",
}: {
  enrollmentId: number;
  coachUserId: string | null;
  coaches: CoachOption[];
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const [value, setValue] = useState(coachUserId ?? UNASSIGNED);
  const [pending, startTransition] = useTransition();

  const items = [
    { value: UNASSIGNED, label: "Atanmadı" },
    ...coaches.map((c) => ({ value: c.id, label: c.name })),
  ];

  const onChange = (next: string) => {
    const previous = value;
    if (next === previous) return;
    setValue(next);
    startTransition(async () => {
      const res = await assignStudentCoach({
        enrollmentId,
        coachUserId: next === UNASSIGNED ? null : next,
      });
      if (!res.ok) {
        setValue(previous);
        toast.error(res.error);
        return;
      }
      toast.success(
        next === UNASSIGNED
          ? "Koç ataması kaldırıldı"
          : `Koç atandı: ${items.find((i) => i.value === next)?.label}`,
      );
      router.refresh();
    });
  };

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(v) => onChange(v as string)}
      disabled={pending}
    >
      <SelectTrigger
        size={size}
        aria-label="Koç ata"
        className={value === UNASSIGNED ? "text-muted-foreground" : undefined}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((i) => (
          <SelectItem key={i.value} value={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
