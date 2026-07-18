"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateUserRole } from "@/actions/admin";
import type { StaffRole } from "@/lib/validation-admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLES: { value: StaffRole; label: string }[] = [
  { value: "coach", label: "Koç" },
  { value: "admin", label: "Yönetici" },
];

/** Ekip satırında rol değiştirme (koç ↔ yönetici) — yalnız yönetici. */
export function StaffRoleSelect({
  userId,
  role,
  disabled = false,
}: {
  userId: string;
  role: StaffRole;
  /** Son yönetici için kilitli — server tarafı da ayrıca korur. */
  disabled?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState<StaffRole>(role);
  const [pending, startTransition] = useTransition();

  const onChange = (next: StaffRole) => {
    const previous = value;
    if (next === previous) return;
    setValue(next);
    startTransition(async () => {
      const res = await updateUserRole({ userId, role: next });
      if (!res.ok) {
        setValue(previous);
        toast.error(res.error);
        return;
      }
      toast.success(
        `Rol güncellendi: ${ROLES.find((r) => r.value === next)?.label}`,
      );
      router.refresh();
    });
  };

  return (
    <Select
      items={ROLES}
      value={value}
      onValueChange={(v) => onChange(v as StaffRole)}
      disabled={disabled || pending}
    >
      <SelectTrigger size="sm" aria-label="Rol değiştir">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r.value} value={r.value}>
            {r.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
