import { cache } from "react";
import { and, asc, count, desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import {
  blogPosts,
  coachApplications,
  coachProfiles,
  cohortSettings,
  enrollments,
  faqs,
  leads,
  packages,
  testimonials,
  waitlistEntries,
  type CohortSettings,
} from "@/db/schema";
import {
  coachContent,
  coachStats,
  faqSeeds,
  packageSeeds,
  testimonialSeeds,
} from "@/db/seed/cms-content";
import type {
  CoachApplicationStatus,
  LeadStatus,
  ProfileLink,
  WaitlistStatus,
} from "@/lib/validation";

/**
 * Pazarlama sitesi + koç CMS okumaları.
 *
 * Public getter'lar görüntüleme tipleri döner ve DB boşsa `cms-content`
 * tohumlarına düşer (fallback) — site seed çalıştırılmadan da eksiksiz
 * görünür. Koç (admin) getter'ları ham satırları döner, fallback YOK.
 */

/* ------------------------------ Public tipler ----------------------------- */

export type PublicTestimonial = {
  displayName: string;
  exam: string;
  quote: string;
  result?: string | null;
  /** ISO tarih — kart "Temmuz 2026" olarak gösterir. */
  date?: string;
};

export type PublicPackage = {
  id?: number;
  name: string;
  priceKurus: number;
  /** Optional "was" price for a discount strikethrough. */
  compareAtKurus?: number | null;
  period: string | null;
  features: string[];
};

export type PublicFaq = { question: string; answer: string };

export type PublicCoach = {
  slug: string | null;
  displayName: string;
  title: string | null;
  location: string | null;
  headline: string | null;
  bio: string | null;
  photoUrl: string | null;
  coverImageUrl: string | null;
  subjects: string[];
  achievements: string[];
  links: ProfileLink[];
  proofUrl: string | null;
};

/** Ekip şeridi kartı — hafif; yalnız listelenebilir (slug'lı) profiller döner. */
export type PublicCoachCard = {
  slug: string;
  displayName: string;
  title: string | null;
  headline: string | null;
  photoUrl: string | null;
  subjects: string[];
};

function parseJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string");
  } catch {
    // JSON değilse satır satır kabul et (elle girilmiş olabilir).
    return raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/** {label,url}[] JSON'unu güvenle çözer — bozuk/eksik girdileri eler. */
function parseLinks(raw: string | null): ProfileLink[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((x) => {
      if (
        x &&
        typeof x === "object" &&
        typeof (x as { label?: unknown }).label === "string" &&
        typeof (x as { url?: unknown }).url === "string"
      ) {
        const l = x as { label: string; url: string };
        return l.label.trim() && l.url.trim() ? [{ label: l.label, url: l.url }] : [];
      }
      return [];
    });
  } catch {
    return [];
  }
}

/* ---------------------------- Public okumalar ----------------------------- */

export async function getPublicTestimonials(): Promise<PublicTestimonial[]> {
  const db = getDb();
  const rows = await db.query.testimonials.findMany({
    where: eq(testimonials.isActive, true),
    orderBy: [asc(testimonials.sortOrder), desc(testimonials.createdAt)],
  });
  if (rows.length > 0) {
    return rows.map((r) => ({
      displayName: r.studentName,
      exam: r.exam ?? "YKS",
      quote: r.quote,
      result: r.result,
      date: r.createdAt.toISOString(),
    }));
  }
  return testimonialSeeds
    .filter((t) => t.isActive)
    .map((t) => ({
      displayName: t.studentName,
      exam: t.exam,
      quote: t.quote,
      date: t.date,
    }));
}

export async function getPublicPackages(): Promise<PublicPackage[]> {
  const db = getDb();
  const rows = await db.query.packages.findMany({
    where: eq(packages.isActive, true),
    orderBy: [asc(packages.sortOrder), asc(packages.id)],
  });
  if (rows.length > 0) {
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      priceKurus: r.priceKurus,
      compareAtKurus: r.compareAtKurus,
      period: r.period,
      features: parseJsonArray(r.features),
    }));
  }
  return packageSeeds.map((p) => ({
    name: p.name,
    priceKurus: p.priceKurus,
    compareAtKurus: p.compareAtKurus ?? null,
    period: p.period,
    features: p.features,
  }));
}

export async function getPublicFaqs(): Promise<PublicFaq[]> {
  const db = getDb();
  const rows = await db.query.faqs.findMany({
    where: eq(faqs.isActive, true),
    orderBy: [asc(faqs.sortOrder), asc(faqs.id)],
  });
  if (rows.length > 0) {
    return rows.map((r) => ({ question: r.question, answer: r.answer }));
  }
  return faqSeeds;
}

function rowToPublicCoach(row: typeof coachProfiles.$inferSelect): PublicCoach {
  return {
    slug: row.slug,
    displayName: row.displayName,
    title: row.title,
    location: row.location,
    headline: row.headline,
    bio: row.bio,
    photoUrl: row.photoUrl,
    coverImageUrl: row.coverImageUrl,
    subjects: parseJsonArray(row.subjects),
    achievements: parseJsonArray(row.achievements),
    links: parseLinks(row.links),
    proofUrl: row.proofUrl,
  };
}

/**
 * Ana/öne çıkan koç (en düşük sort_order) — /koclar kahramanı + ana sayfa kartı.
 * Tek marka konumlandırması: bu koç Ahmet Hakan'dır. DB boşsa seed'e düşer.
 */
export async function getPublicCoach(): Promise<PublicCoach> {
  const db = getDb();
  const row = await db.query.coachProfiles.findFirst({
    where: eq(coachProfiles.isActive, true),
    orderBy: [asc(coachProfiles.sortOrder), asc(coachProfiles.id)],
  });
  if (row) return rowToPublicCoach(row);
  return {
    slug: null,
    displayName: coachContent.displayName,
    title: coachContent.title,
    location: coachContent.location,
    headline: null,
    bio: coachContent.bio,
    photoUrl: coachContent.photoUrl,
    coverImageUrl: null,
    subjects: [...coachContent.subjects],
    achievements: [...coachContent.credentials],
    links: [],
    proofUrl: coachStats.proofUrl,
  };
}

/**
 * Öne çıkan koç DIŞINDAKİ, linklenebilir (slug'lı) aktif koçlar — "Ekip" şeridi.
 * En düşük sort_order öne çıkan sayıldığı için ilk satır atlanır.
 */
export async function listOtherPublicCoaches(): Promise<PublicCoachCard[]> {
  const db = getDb();
  const rows = await db.query.coachProfiles.findMany({
    where: eq(coachProfiles.isActive, true),
    orderBy: [asc(coachProfiles.sortOrder), asc(coachProfiles.id)],
  });
  // İlk satır = öne çıkan koç (/koclar kahramanı) → şeritte gösterme.
  return rows
    .slice(1)
    .filter((r): r is typeof r & { slug: string } => !!r.slug)
    .map((r) => ({
      slug: r.slug,
      displayName: r.displayName,
      title: r.title,
      headline: r.headline,
      photoUrl: r.photoUrl,
      subjects: parseJsonArray(r.subjects),
    }));
}

/** Tek koç profili (slug ile) — /koclar/[slug]. Pasif/olmayan → null. */
export async function getPublicCoachBySlug(
  slug: string,
): Promise<PublicCoach | null> {
  const db = getDb();
  const row = await db.query.coachProfiles.findFirst({
    where: and(eq(coachProfiles.slug, slug), eq(coachProfiles.isActive, true)),
  });
  return row ? rowToPublicCoach(row) : null;
}

/** Oturumdaki koçun kendi profil satırı (editör için) — yoksa null. */
export async function getMyCoachProfile(userId: string) {
  const db = getDb();
  return db.query.coachProfiles.findFirst({
    where: eq(coachProfiles.userId, userId),
  });
}

export async function getPublishedPosts() {
  const db = getDb();
  return db.query.blogPosts.findMany({
    where: eq(blogPosts.status, "published"),
    orderBy: [desc(blogPosts.publishedAt), desc(blogPosts.id)],
    columns: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      publishedAt: true,
    },
  });
}

/** Tek yayınlı yazı — generateMetadata + sayfa aynı istekte tek sorgu (cache). */
export const getPublishedPost = cache(async (slug: string) => {
  const db = getDb();
  return db.query.blogPosts.findFirst({
    where: and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")),
    with: { author: { columns: { name: true } } },
  });
});

/* ------------------------------ Koç okumaları ----------------------------- */

export async function listAllTestimonials() {
  const db = getDb();
  return db.query.testimonials.findMany({
    orderBy: [asc(testimonials.sortOrder), desc(testimonials.createdAt)],
  });
}

export async function listAllPackages() {
  const db = getDb();
  return db.query.packages.findMany({
    orderBy: [asc(packages.sortOrder), asc(packages.id)],
  });
}

export async function listAllFaqs() {
  const db = getDb();
  return db.query.faqs.findMany({
    orderBy: [asc(faqs.sortOrder), asc(faqs.id)],
  });
}

/** Tüm blog yazıları (yazar adıyla) — koç panosu; herkes görür, sahiplik ayrı. */
export async function listAllPosts() {
  const db = getDb();
  return db.query.blogPosts.findMany({
    orderBy: [desc(blogPosts.updatedAt)],
    columns: {
      id: true,
      slug: true,
      title: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      authorUserId: true,
    },
    with: { author: { columns: { name: true } } },
  });
}

export async function getPostById(id: number) {
  const db = getDb();
  return db.query.blogPosts.findFirst({ where: eq(blogPosts.id, id) });
}

/* --------------------------------- Leadler -------------------------------- */

export async function listLeads(status?: LeadStatus) {
  const db = getDb();
  return db.query.leads.findMany({
    where: status ? eq(leads.status, status) : undefined,
    orderBy: [desc(leads.createdAt)],
  });
}

export async function countLeadsByStatus(): Promise<Record<LeadStatus, number>> {
  const db = getDb();
  const rows = await db
    .select({ status: leads.status, total: count() })
    .from(leads)
    .groupBy(leads.status);
  const out: Record<LeadStatus, number> = {
    yeni: 0,
    görüşüldü: 0,
    kayıt: 0,
    kayıp: 0,
  };
  for (const r of rows) out[r.status] = r.total;
  return out;
}

export async function countNewLeads(): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ total: count() })
    .from(leads)
    .where(eq(leads.status, "yeni"));
  return row?.total ?? 0;
}

/* ------------------------------ Dönem/kontenjan --------------------------- */

/**
 * Public dönem/kontenjan ayarını okur; satır yoksa güvenli varsayılan döner
 * (site ilk kayıttan önce de render olur). Buradaki sayılar YÖNETİCİ KONTROLÜNDE
 * gösterim değerleridir — gerçek kapasite/kayıt DEĞİL.
 */
export async function getCohort(): Promise<CohortSettings> {
  const db = getDb();
  const row = await db.query.cohortSettings.findFirst({
    where: eq(cohortSettings.id, 1),
  });
  return (
    row ?? {
      id: 1,
      donemLabel: "Güncel Dönem",
      displayCapacity: null,
      displayFilled: 0,
      closesOn: null,
      status: "acik",
      waitlistOpen: true,
      scarcityVisible: true,
      updatedAt: new Date(0),
    }
  );
}

/**
 * Gerçek aktif öğrenci sayısı — YALNIZ admin panelinde, yayımlanan gösterim
 * değerinin yanında referans olarak kullanılır. Public sayfalara ASLA gitmez.
 */
export async function countActiveStudents(): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ total: count() })
    .from(enrollments)
    .where(eq(enrollments.status, "active"));
  return row?.total ?? 0;
}

/* ------------------------------ Bekleme listesi --------------------------- */

/** Bekleyenler en eskiden yeniye (= sıra düzeni); diğerleri de aynı sırayla. */
export async function listWaitlist(status?: WaitlistStatus) {
  const db = getDb();
  return db.query.waitlistEntries.findMany({
    where: status ? eq(waitlistEntries.status, status) : undefined,
    orderBy: [asc(waitlistEntries.createdAt)],
  });
}

export async function countWaitlistByStatus(): Promise<
  Record<WaitlistStatus, number>
> {
  const db = getDb();
  const rows = await db
    .select({ status: waitlistEntries.status, total: count() })
    .from(waitlistEntries)
    .groupBy(waitlistEntries.status);
  const out: Record<WaitlistStatus, number> = {
    bekliyor: 0,
    davet_edildi: 0,
    kayit: 0,
    ayrildi: 0,
  };
  for (const r of rows) out[r.status] = r.total;
  return out;
}

export async function countNewWaitlist(): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ total: count() })
    .from(waitlistEntries)
    .where(eq(waitlistEntries.status, "bekliyor"));
  return row?.total ?? 0;
}

/* ------------------------------ Koç başvuruları --------------------------- */

export async function listCoachApplications(status?: CoachApplicationStatus) {
  const db = getDb();
  return db.query.coachApplications.findMany({
    where: status ? eq(coachApplications.status, status) : undefined,
    orderBy: [desc(coachApplications.createdAt)],
  });
}

export async function countCoachApplicationsByStatus(): Promise<
  Record<CoachApplicationStatus, number>
> {
  const db = getDb();
  const rows = await db
    .select({ status: coachApplications.status, total: count() })
    .from(coachApplications)
    .groupBy(coachApplications.status);
  const out: Record<CoachApplicationStatus, number> = {
    yeni: 0,
    inceleniyor: 0,
    gorusme: 0,
    kabul: 0,
    ret: 0,
  };
  for (const r of rows) out[r.status] = r.total;
  return out;
}

export async function countNewApplications(): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ total: count() })
    .from(coachApplications)
    .where(eq(coachApplications.status, "yeni"));
  return row?.total ?? 0;
}
