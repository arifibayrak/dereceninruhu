"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, SaveIcon, UsersIcon } from "lucide-react";
import { toast } from "sonner";

import { callAction } from "@/lib/action-client";
import { updateCohortSettings } from "@/actions/cohort";
import type { CohortStatus } from "@/lib/validation-admin";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CohortSettingsValues = {
  donemLabel: string;
  displayCapacity: number | null;
  displayFilled: number;
  closesOn: Date | null;
  status: CohortStatus;
  waitlistOpen: boolean;
  scarcityVisible: boolean;
};

const STATUS_OPTIONS: { value: CohortStatus; label: string }[] = [
  { value: "acik", label: "Açık — kayıt alıyor" },
  { value: "son_kontenjan", label: "Son kontenjan" },
  { value: "dolu", label: "Dolu — bekleme listesi" },
  { value: "kapali", label: "Kapalı" },
];

/** Date → yyyy-mm-dd (tarih input değeri). */
function toDateInput(d: Date | null): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Dönem/kontenjan yöneticisi — sitedeki "sınırlı kontenjan" mesajını besler.
 * Buradaki sayılar YAYIMLANAN pazarlama değerleridir; gerçek aktif öğrenci
 * sayısı yalnız referans olarak (aşağıda) gösterilir, siteye gitmez.
 */
export function CohortSettingsForm({
  initial,
  realActiveStudents,
}: {
  initial: CohortSettingsValues;
  realActiveStudents: number;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState({
    donemLabel: initial.donemLabel,
    displayCapacity:
      initial.displayCapacity != null ? String(initial.displayCapacity) : "",
    displayFilled: String(initial.displayFilled),
    closesOn: toDateInput(initial.closesOn),
    status: initial.status,
    waitlistOpen: initial.waitlistOpen,
    scarcityVisible: initial.scarcityVisible,
  });

  const capacityNum =
    values.displayCapacity.trim() === ""
      ? null
      : Number(values.displayCapacity);
  const filledNum = Number(values.displayFilled || 0);
  const remaining =
    capacityNum != null ? Math.max(capacityNum - filledNum, 0) : null;

  const save = async () => {
    setSaving(true);
    const res = await callAction(updateCohortSettings, {
      donemLabel: values.donemLabel,
      displayCapacity: capacityNum,
      displayFilled: filledNum,
      closesOn: values.closesOn ? values.closesOn : null,
      status: values.status,
      waitlistOpen: values.waitlistOpen,
      scarcityVisible: values.scarcityVisible,
    });
    setSaving(false);
    if (!res.ok) {
      const first = res.fieldErrors
        ? Object.values(res.fieldErrors)[0]
        : undefined;
      toast.error(first ?? res.error);
      return;
    }
    toast.success("Dönem ayarı kaydedildi");
    router.refresh();
  };

  return (
    <FieldGroup className="max-w-2xl">
      <div className="flex items-start gap-3 rounded-xl bg-info/10 p-4 text-sm text-pretty text-muted-foreground">
        <UsersIcon className="mt-0.5 size-4 shrink-0 text-info" />
        <span>
          Buradaki sayılar sitede gösterilen <strong>pazarlama</strong>{" "}
          değerleridir — gerçek kapasite değil. Referans: şu an{" "}
          <strong className="text-foreground tabular-nums">
            {realActiveStudents}
          </strong>{" "}
          aktif öğrencin var (yalnız sana görünür).
        </span>
      </div>

      <Field>
        <FieldLabel htmlFor="donem-ad">Dönem adı *</FieldLabel>
        <Input
          id="donem-ad"
          value={values.donemLabel}
          placeholder="2026 Güz Dönemi"
          onChange={(e) =>
            setValues({ ...values, donemLabel: e.target.value })
          }
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="donem-durum">Durum *</FieldLabel>
        <Select
          items={STATUS_OPTIONS}
          value={values.status}
          onValueChange={(v) =>
            setValues({ ...values, status: v as CohortStatus })
          }
        >
          <SelectTrigger id="donem-durum" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>
          &quot;Dolu&quot; veya &quot;Kapalı&quot; seçilince sitedeki kayıt
          butonları bekleme listesine döner.
        </FieldDescription>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="donem-kontenjan">
            Gösterilen kontenjan
          </FieldLabel>
          <Input
            id="donem-kontenjan"
            inputMode="numeric"
            placeholder="Boş bırak → sayı gösterme"
            value={values.displayCapacity}
            onChange={(e) =>
              setValues({ ...values, displayCapacity: e.target.value })
            }
          />
          <FieldDescription>
            Boşsa yalnız &quot;sınırlı kontenjan&quot; yazısı gösterilir.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="donem-dolu">Gösterilen dolu</FieldLabel>
          <Input
            id="donem-dolu"
            inputMode="numeric"
            value={values.displayFilled}
            onChange={(e) =>
              setValues({ ...values, displayFilled: e.target.value })
            }
          />
          <FieldDescription>
            {remaining != null
              ? `Sitede "son ${remaining} kontenjan" görünür.`
              : "Kontenjan girilince kalan otomatik hesaplanır."}
          </FieldDescription>
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="donem-kapanis">Kayıt kapanış tarihi</FieldLabel>
        <Input
          id="donem-kapanis"
          type="date"
          value={values.closesOn}
          onChange={(e) => setValues({ ...values, closesOn: e.target.value })}
        />
        <FieldDescription>
          Girildiğinde site &quot;kayıtlar … içinde kapanıyor&quot; geri
          sayımını gösterir.
        </FieldDescription>
      </Field>

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium select-none">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={values.scarcityVisible}
          onChange={(e) =>
            setValues({ ...values, scarcityVisible: e.target.checked })
          }
        />
        <EyeIcon className="size-4" />
        Kontenjan/dönem mesajları sitede görünsün
      </label>

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium select-none">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={values.waitlistOpen}
          onChange={(e) =>
            setValues({ ...values, waitlistOpen: e.target.checked })
          }
        />
        Bekleme listesi başvuru alsın
      </label>

      <Button size="lg" className="self-start" onClick={save} disabled={saving}>
        <SaveIcon data-icon="inline-start" />
        {saving ? "Kaydediliyor…" : "Dönem ayarını kaydet"}
      </Button>
    </FieldGroup>
  );
}
