"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLinkIcon,
  PlusIcon,
  SaveIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { saveMyProfile, uploadProfileImage } from "@/actions/cms";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/** URL yapıştır VEYA cihazdan görsel yükle — profil foto & kapak için. */
function ImageField({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onPick = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Yalnız görsel yükleyebilirsin.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Görsel en fazla 5 MB olabilir.");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    const res = await uploadProfileImage(fd);
    setUploading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    onChange(res.data.url);
    toast.success("Görsel yüklendi");
  };

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          inputMode="url"
          placeholder="https://… ya da Yükle"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onPick(f);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <UploadIcon data-icon="inline-start" />
          {uploading ? "Yükleniyor…" : "Yükle"}
        </Button>
      </div>
      {value && (
        // Dahili /api/uploads veya harici URL — plain img (next/image değil).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className="mt-1 h-20 w-auto max-w-full rounded-lg object-cover ring-1 ring-foreground/10"
        />
      )}
      {hint && <FieldDescription>{hint}</FieldDescription>}
    </Field>
  );
}

export type CoachProfileValues = {
  slug: string | null;
  displayName: string;
  title: string;
  location: string;
  headline: string;
  bio: string;
  photoUrl: string;
  coverImageUrl: string;
  subjects: string[];
  achievements: string[];
  links: { label: string; url: string }[];
  proofUrl: string;
  isActive: boolean;
};

/**
 * Koçun kendi herkese açık profili — /koc/profil. Her koç yalnız kendi
 * satırını düzenler (kimlik oturumdan). /koclar/[slug] sayfasını besler.
 */
export function CoachProfileForm({ profile }: { profile: CoachProfileValues }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState(profile.slug);
  const [values, setValues] = useState({
    displayName: profile.displayName,
    title: profile.title,
    location: profile.location,
    headline: profile.headline,
    bio: profile.bio,
    photoUrl: profile.photoUrl,
    coverImageUrl: profile.coverImageUrl,
    subjects: profile.subjects.join(", "),
    achievements: profile.achievements.join("\n"),
    proofUrl: profile.proofUrl,
    isActive: profile.isActive,
  });
  const [links, setLinks] = useState<{ label: string; url: string }[]>(
    profile.links.length ? profile.links : [],
  );

  const set = (patch: Partial<typeof values>) =>
    setValues((v) => ({ ...v, ...patch }));

  const addLink = () => setLinks((l) => [...l, { label: "", url: "" }]);
  const removeLink = (i: number) =>
    setLinks((l) => l.filter((_, idx) => idx !== i));
  const setLink = (i: number, patch: Partial<{ label: string; url: string }>) =>
    setLinks((l) => l.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const save = async () => {
    setSaving(true);
    const res = await saveMyProfile({
      displayName: values.displayName,
      title: values.title,
      location: values.location,
      headline: values.headline,
      bio: values.bio,
      photoUrl: values.photoUrl,
      coverImageUrl: values.coverImageUrl,
      subjects: values.subjects
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      achievements: values.achievements
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      links: links
        .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
        .filter((l) => l.label && l.url),
      proofUrl: values.proofUrl,
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
    setSlug(res.data.slug);
    toast.success("Profilin kaydedildi", {
      description: values.isActive
        ? "Herkese açık sayfanda yayında."
        : "Şu an gizli — “Sitede görünsün” ile yayınlayabilirsin.",
    });
    router.refresh();
  };

  return (
    <FieldGroup className="max-w-2xl">
      {slug && (
        <a
          href={`/koclar/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Herkese açık sayfanı gör: /koclar/{slug}
          <ExternalLinkIcon className="size-4" />
        </a>
      )}

      <Field>
        <FieldLabel htmlFor="koc-ad">Görünen isim *</FieldLabel>
        <Input
          id="koc-ad"
          value={values.displayName}
          onChange={(e) => set({ displayName: e.target.value })}
        />
        <FieldDescription>
          Sayfa bağlantın (slug) bu isimden türetilir.
        </FieldDescription>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="koc-unvan">Ünvan</FieldLabel>
          <Input
            id="koc-unvan"
            placeholder="Eğitim Koçu"
            value={values.title}
            onChange={(e) => set({ title: e.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="koc-konum">Konum</FieldLabel>
          <Input
            id="koc-konum"
            placeholder="Kartal, İstanbul"
            value={values.location}
            onChange={(e) => set({ location: e.target.value })}
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="koc-slogan">Kısa tanıtım (slogan)</FieldLabel>
        <Input
          id="koc-slogan"
          placeholder="KPSS & YKS koçluğu — planlı, veriyle."
          value={values.headline}
          onChange={(e) => set({ headline: e.target.value })}
        />
        <FieldDescription>
          Kartlarda ve profil başlığında görünür — bir cümle.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="koc-bio">Tanıtım metni</FieldLabel>
        <Textarea
          id="koc-bio"
          rows={5}
          value={values.bio}
          onChange={(e) => set({ bio: e.target.value })}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <ImageField
          id="koc-foto"
          label="Profil fotoğrafı"
          hint="URL yapıştır ya da yükle · kare görsel önerilir."
          value={values.photoUrl}
          onChange={(v) => set({ photoUrl: v })}
        />
        <ImageField
          id="koc-kapak"
          label="Kapak (arka plan)"
          hint="URL yapıştır ya da yükle · geniş görsel önerilir."
          value={values.coverImageUrl}
          onChange={(v) => set({ coverImageUrl: v })}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="koc-sinavlar">Sınavlar</FieldLabel>
          <Input
            id="koc-sinavlar"
            placeholder="KPSS, YKS, LGS"
            value={values.subjects}
            onChange={(e) => set({ subjects: e.target.value })}
          />
          <FieldDescription>Virgülle ayır.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="koc-dogrulama">Doğrulama bağlantısı</FieldLabel>
          <Input
            id="koc-dogrulama"
            inputMode="url"
            placeholder="https://gigbi.com/…"
            value={values.proofUrl}
            onChange={(e) => set({ proofUrl: e.target.value })}
          />
          <FieldDescription>Gigbi vb. harici profilin.</FieldDescription>
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
          onChange={(e) => set({ achievements: e.target.value })}
        />
      </Field>

      <Field>
        <FieldLabel>Diğer hesaplar & bağlantılar</FieldLabel>
        <FieldDescription>
          Instagram, YouTube, TikTok, web sitesi… Etiket + bağlantı.
        </FieldDescription>
        <div className="flex flex-col gap-2">
          {links.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                aria-label="Etiket"
                placeholder="Instagram"
                className="w-32 shrink-0 sm:w-40"
                value={link.label}
                onChange={(e) => setLink(i, { label: e.target.value })}
              />
              <Input
                aria-label="Bağlantı"
                inputMode="url"
                placeholder="https://instagram.com/…"
                value={link.url}
                onChange={(e) => setLink(i, { url: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Bağlantıyı kaldır"
                onClick={() => removeLink(i)}
              >
                <XIcon />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={addLink}
            disabled={links.length >= 8}
          >
            <PlusIcon data-icon="inline-start" />
            Bağlantı ekle
          </Button>
        </div>
      </Field>

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium select-none">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={values.isActive}
          onChange={(e) => set({ isActive: e.target.checked })}
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
