import { cache } from "react";
import { and, asc, count, desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import {
  blogPosts,
  coachProfiles,
  faqs,
  leads,
  packages,
  testimonials,
} from "@/db/schema";
import {
  coachContent,
  faqSeeds,
  packageSeeds,
  testimonialSeeds,
} from "@/db/seed/cms-content";
import type { LeadStatus } from "@/lib/validation";

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
  displayName: string;
  bio: string | null;
  photoUrl: string | null;
  subjects: string[];
  achievements: string[];
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

export async function getPublicCoach(): Promise<PublicCoach> {
  const db = getDb();
  const row = await db.query.coachProfiles.findFirst({
    where: eq(coachProfiles.isActive, true),
    orderBy: [asc(coachProfiles.sortOrder), asc(coachProfiles.id)],
  });
  if (row) {
    return {
      displayName: row.displayName,
      bio: row.bio,
      photoUrl: row.photoUrl,
      subjects: parseJsonArray(row.subjects),
      achievements: parseJsonArray(row.achievements),
    };
  }
  return {
    displayName: coachContent.displayName,
    bio: coachContent.bio,
    photoUrl: coachContent.photoUrl,
    subjects: [...coachContent.subjects],
    achievements: [...coachContent.credentials],
  };
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

export async function getCoachProfileRow() {
  const db = getDb();
  return db.query.coachProfiles.findFirst({
    orderBy: [asc(coachProfiles.sortOrder), asc(coachProfiles.id)],
  });
}

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
    },
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
