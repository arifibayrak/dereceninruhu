"use client";

import { useState, useTransition } from "react";
import { ChevronDownIcon } from "lucide-react";
import { toast } from "sonner";

import { useRefresh } from "@/lib/use-refresh";
import { callAction } from "@/lib/action-client";
import { assignStudentCoach } from "@/actions/admin";
import {
  Select,
  SelectContent,
  SelectItem,
  selectTriggerClassName,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type CoachOption = { id: string; name: string };

const UNASSIGNED = "yok";

/**
 * Öğrenci satırında koç atama / değiştirme — yalnız yönetici görür.
 *
 * Açılana kadar SADE bir düğme çizilir; asıl `Select` ilk dokunuşta kurulur.
 * NEDEN: kadro tablosunda satır başına bir tane var. 49 öğrencide bu, sayfa
 * açılışında 49 ayrı base-ui `Select.Root`u (her biri kendi state'i, context'i
 * ve konumlandırıcısıyla) canlandırmak demekti — tablonun ilk dokunuşa geç
 * cevap vermesinin başlıca sebebi. Düğme birebir aynı kutuyu çizdiği için
 * kullanıcı farkı görmez; tıklayınca liste zaten açık gelir.
 */
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
  const { refresh } = useRefresh();
  const [value, setValue] = useState(coachUserId ?? UNASSIGNED);
  const [pending, startTransition] = useTransition();
  /** Gerçek `Select` kuruldu mu — ilk dokunuşa kadar false. */
  const [armed, setArmed] = useState(false);

  const items = [
    { value: UNASSIGNED, label: "Atanmadı" },
    ...coaches.map((c) => ({ value: c.id, label: c.name })),
  ];

  const onChange = (next: string) => {
    const previous = value;
    if (next === previous) return;
    setValue(next);
    startTransition(async () => {
      const res = await callAction(assignStudentCoach, {
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
      refresh();
    });
  };

  if (!armed) {
    const label = items.find((i) => i.value === value)?.label ?? "Atanmadı";
    return (
      <button
        type="button"
        data-size={size}
        aria-label="Koç ata"
        onClick={() => setArmed(true)}
        className={cn(
          selectTriggerClassName,
          value === UNASSIGNED && "text-muted-foreground",
        )}
      >
        <span className="flex flex-1 text-left">{label}</span>
        <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(v) => onChange(v as string)}
      disabled={pending}
      defaultOpen
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
