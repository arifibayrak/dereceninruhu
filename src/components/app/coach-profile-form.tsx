"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SaveIcon } from "lucide-react";
import { toast } from "sonner";

import { saveCoachProfile } from "@/actions/cms";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type CoachProfileValues = {
  id: number | null;
  displayName: string;
  bio: string;
  photoUrl: string;
  subjects: string[];
  achievements: string[];
  isActive: boolean;
};

/** Koç profili düzenleyici — /koclar ve ana sayfadaki koç kartını besler. */
export function CoachProfileForm({ profile }: { profile: CoachProfileValues }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState({
    displayName: profile.displayName,
    bio: profile.bio,
    photoUrl: profile.photoUrl,
    subjects: profile.subjects.join(", "),
    achievements: profile.achievements.join("\n"),
    isActive: profile.isActive,
  });

  const save = async () => {
    setSaving(true);
    const res = await saveCoachProfile({
      id: profile.id ?? undefined,
      displayName: values.displayName,
      bio: values.bio,
      photoUrl: values.photoUrl,
      subjects: values.subjects
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      achievements: values.achievements
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      isActive: values.isActive,
    });
    setSaving(false);
    if (!res.ok) {
      const first = res.fieldErrors
        ? Object.values(res.fieldErrors)[0]
        : undefined;
      toast.error(first ?? res.error);
      return;
    }
    toast.success("Koç profili kaydedildi");
    router.refresh();
  };

  return (
    <FieldGroup className="max-w-2xl">
      <Field>
        <FieldLabel htmlFor="koc-ad">Görünen isim *</FieldLabel>
        <Input
          id="koc-ad"
          value={values.displayName}
          onChange={(e) =>
            setValues({ ...values, displayName: e.target.value })
          }
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="koc-bio">Tanıtım metni</FieldLabel>
        <Textarea
          id="koc-bio"
          rows={5}
          value={values.bio}
          onChange={(e) => setValues({ ...values, bio: e.target.value })}
        />
        <FieldDescription>
          Ana sayfa koç kartında ve /koclar sayfasında görünür.
        </FieldDescription>
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="koc-foto">Fotoğraf URL</FieldLabel>
          <Input
            id="koc-foto"
            inputMode="url"
            placeholder="https://…"
            value={values.photoUrl}
            onChange={(e) => setValues({ ...values, photoUrl: e.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="koc-sinavlar">Sınavlar</FieldLabel>
          <Input
            id="koc-sinavlar"
            placeholder="KPSS, YKS, LGS"
            value={values.subjects}
            onChange={(e) => setValues({ ...values, subjects: e.target.value })}
          />
          <FieldDescription>Virgülle ayır.</FieldDescription>
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="koc-derece">
          Dereceler / özgeçmiş (her satır bir rozet)
        </FieldLabel>
        <Textarea
          id="koc-derece"
          rows={4}
          placeholder={"YKS Türkiye 876.\nKPSS 93 puan — 712."}
          value={values.achievements}
          onChange={(e) =>
            setValues({ ...values, achievements: e.target.value })
          }
        />
      </Field>
      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium select-none">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={values.isActive}
          onChange={(e) => setValues({ ...values, isActive: e.target.checked })}
        />
        Profil sitede görünsün
      </label>
      <Button size="lg" className="self-start" onClick={save} disabled={saving}>
        <SaveIcon data-icon="inline-start" />
        {saving ? "Kaydediliyor…" : "Profili kaydet"}
      </Button>
    </FieldGroup>
  );
}
