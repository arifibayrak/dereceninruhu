import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { getMyCoachProfile } from "@/db/queries/cms";
import { getCurrentUser, getViewer } from "@/lib/session";
import { CoachContactForm } from "@/components/app/coach-contact-form";
import {
  CoachProfileForm,
  type CoachProfileValues,
} from "@/components/app/coach-profile-form";
import { SectionHeading } from "@/components/brand/section-heading";

export const metadata: Metadata = { title: "Profil" };

// Kendi profil satırını okur (D1) → istek başına render.
export const dynamic = "force-dynamic";

function parseJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed))
      return parsed.filter((x) => typeof x === "string");
  } catch {
    return raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function parseLinks(raw: string | null): { label: string; url: string }[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((x) =>
      x &&
      typeof x === "object" &&
      typeof (x as { label?: unknown }).label === "string" &&
      typeof (x as { url?: unknown }).url === "string"
        ? [{ label: (x as { label: string }).label, url: (x as { url: string }).url }]
        : [],
    );
  } catch {
    return [];
  }
}

/** Koç kendi herkese açık profilini düzenler — her koç (ve yönetici) erişir. */
export default async function ProfilPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  if (viewer.role !== "coach" && viewer.role !== "admin") redirect("/ogrenci");

  const db = getDb();
  const [row, user, contact] = await Promise.all([
    getMyCoachProfile(viewer.id),
    getCurrentUser(),
    db.query.users.findFirst({
      where: eq(users.id, viewer.id),
      columns: {
        phoneNumber: true,
        telegram: true,
        instagram: true,
        iban: true,
      },
    }),
  ]);

  const profile: CoachProfileValues = row
    ? {
        slug: row.slug,
        displayName: row.displayName,
        title: row.title ?? "",
        location: row.location ?? "",
        headline: row.headline ?? "",
        bio: row.bio ?? "",
        photoUrl: row.photoUrl ?? "",
        coverImageUrl: row.coverImageUrl ?? "",
        subjects: parseJsonArray(row.subjects),
        achievements: parseJsonArray(row.achievements),
        links: parseLinks(row.links),
        proofUrl: row.proofUrl ?? "",
        isActive: row.isActive,
      }
    : {
        // Henüz profili yok — adıyla ön dolu boş form; kaydedince oluşur.
        slug: null,
        displayName:
          (user as { name?: string } | null)?.name ?? "",
        title: "",
        location: "",
        headline: "",
        bio: "",
        photoUrl: "",
        coverImageUrl: "",
        subjects: [],
        achievements: [],
        links: [],
        proofUrl: "",
        isActive: true,
      };

  const roleLabel = viewer.role === "admin" ? "yönetici" : "koç";

  return (
    <>
      <SectionHeading
        eyebrow="Profil"
        title="Herkese açık koç profilim"
        description={`Fotoğrafın, tanıtımın, dereceler ve platform bağlantıların — /koclar sayfasındaki kendi ${roleLabel} sayfanı besler.`}
      />
      <CoachProfileForm profile={profile} />

      <SectionHeading
        eyebrow="İletişim"
        title="İletişim & ödeme bilgilerim"
        description="Telefon, Telegram, Instagram ve ödeme için IBAN — bunlar ekip içi kayıttır, herkese açık profilde görünmez."
      />
      <CoachContactForm
        initial={{
          phone: contact?.phoneNumber ?? "",
          telegram: contact?.telegram ?? "",
          instagram: contact?.instagram ?? "",
          iban: contact?.iban ?? "",
        }}
      />
    </>
  );
}
