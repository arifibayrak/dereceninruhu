import { cache } from "react";
import { and, asc, count, desc, eq, isNotNull, sql } from "drizzle-orm";

import { getDb } from "@/db";
import {
  blogPosts,
  coachApplications,
  coachProfiles,
  cohortSettings,
  enrollments,
  examSections,
  examTemplates,
  faqs,
  impactStats,
  leads,
  mockExamResults,
  mockExams,
  packages,
  questionLogs,
  resourceLinks,
  siteSettings,
  subjects,
  testimonials,
  waitlistEntries,
  type CohortSettings,
  type SiteSettings,
} from "@/db/schema";
import {
  coachContent,
  coachStats,
  teamCoachSeeds,
  faqSeeds,
  packageSeeds,
  testimonialSeeds,
} from "@/db/seed/cms-content";
import {
  resourceLinkSeeds,
  type ResourceCategory,
} from "@/db/seed/resource-links";
import type {
  CoachApplicationStatus,
  LeadStatus,
  ProfileLink,
  WaitlistStatus,
} from "@/lib/validation";
import type { PackageKind } from "@/lib/ozel-ders";

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
  /** Koçluk mu özel ders mi — /fiyatlar iki ayrı bölüm çizer. */
  kind: PackageKind;
  priceKurus: number;
  /** Optional "was" price for a discount strikethrough. */
  compareAtKurus?: number | null;
  period: string | null;
  /** Pakete dahil özel ders saati; 0/null = yok. */
  lessonHours?: number | null;
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

/** Derece vitrini kartı — /basarilar üstündeki "Derece yapan öğrencilerimiz". */
export type PublicAchievement = {
  displayName: string;
  exam: string;
  /** "Türkiye 876." gibi — vitrine girmenin ön koşulu. */
  result: string;
  quote: string;
  proofImageUrl: string | null;
  videoUrl: string | null;
  photoUrl: string | null;
};

/**
 * Derece vitrini satırları.
 *
 * GİZLİLİK: yalnız `isFeatured` + `isActive` + `consentAt` DOLU olan satırlar
 * döner. Sonuç belgesi ve sıralama kişisel veridir; izin kaydı olmayan hiçbir
 * satır public'e çıkmaz. `result` boşsa kart anlamsız olduğu için o da elenir.
 * Fallback YOK — tohum veride izin kaydı bulunmaz.
 */
export async function getFeaturedAchievements(): Promise<PublicAchievement[]> {
  const db = getDb();
  const rows = await db.query.testimonials.findMany({
    where: and(
      eq(testimonials.isFeatured, true),
      eq(testimonials.isActive, true),
      isNotNull(testimonials.consentAt),
    ),
    orderBy: [asc(testimonials.sortOrder), desc(testimonials.createdAt)],
  });
  return rows
    .filter((r) => (r.result ?? "").trim().length > 0)
    .map((r) => ({
      displayName: r.studentName,
      exam: r.exam ?? "YKS",
      result: (r.result ?? "").trim(),
      quote: r.quote,
      proofImageUrl: r.proofImageUrl,
      videoUrl: r.videoUrl,
      photoUrl: r.photoUrl,
    }));
}

/** Public şeffaflık sayaçları (bkz. `getPublicImpactStats`). */
export type PublicImpactStats = {
  /** Kadro genelinde girilen toplam soru. */
  totalQuestions: number;
  /** Girilen toplam deneme (tam + branş). */
  totalMocks: number;
  /**
   * Tam denemesi ≥2 olan öğrencilerin ilk→son net farkının MEDYANI.
   * Ortalama değil: tek bir uç öğrenci rakamı şişirmesin.
   */
  medianNetGain: number | null;
};

/**
 * Sayaçların AĞIR hesabı — `question_logs` üzerinde bir SUM, `mock_exams`
 * üzerinde bir COUNT ve bir leftJoin/groupBy taraması. Üçü de WHERE'siz ve
 * LIMIT'siz.
 *
 * ⚠️ Bunu bir SAYFADAN ÇAĞIRMA. Yalnız cron (`/api/cron/impact`) ve
 * `getPublicImpactStats()`'ın ilk-kez soğuk yolu çağırır; public sayfa
 * `impact_stats` anlık görüntüsünü okur. Eskiden `/basarilar` bunu her istekte
 * çalıştırıyordu ve iki tablo büyüdükçe sayfa yavaşlıyordu.
 *
 * ⚠️ AGENTS.md: gerçek aktif öğrenci sayısı ve kontenjan ASLA public'e çıkmaz.
 * Bu yüzden yalnız TOPLAM soru/deneme ve net artışının MEDYANI döner; öğrenci
 * sayısı ne döndürülür ne de ondan türetilebilecek bir metrik (ör. "öğrenci
 * başına ortalama soru") yayınlanır.
 */
export async function computeImpactStats(): Promise<PublicImpactStats> {
  const db = getDb();

  const [questionRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${questionLogs.questionCount}), 0)`,
    })
    .from(questionLogs);

  const [mockRow] = await db.select({ total: count() }).from(mockExams);

  // Öğrenci bazında ilk ve son TAM deneme neti → fark → medyan.
  const netRows = await db
    .select({
      enrollmentId: mockExams.enrollmentId,
      takenOn: mockExams.takenOn,
      net: sql<number>`coalesce(sum(${mockExamResults.net}), 0)`,
    })
    .from(mockExams)
    .leftJoin(mockExamResults, eq(mockExamResults.mockExamId, mockExams.id))
    .where(eq(mockExams.scope, "full"))
    .groupBy(mockExams.id)
    .orderBy(asc(mockExams.takenOn), asc(mockExams.id));

  const byEnrollment = new Map<number, { first: number; last: number; n: number }>();
  for (const r of netRows) {
    const net = Number(r.net);
    const acc = byEnrollment.get(r.enrollmentId);
    if (!acc) byEnrollment.set(r.enrollmentId, { first: net, last: net, n: 1 });
    else {
      acc.last = net; // sorgu tarihe göre artan sıralı
      acc.n += 1;
    }
  }
  const gains = [...byEnrollment.values()]
    .filter((v) => v.n >= 2)
    .map((v) => v.last - v.first)
    .sort((a, b) => a - b);

  const medianNetGain =
    gains.length === 0
      ? null
      : gains.length % 2 === 1
        ? gains[(gains.length - 1) / 2]
        : (gains[gains.length / 2 - 1] + gains[gains.length / 2]) / 2;

  return {
    totalQuestions: Number(questionRow?.total ?? 0),
    totalMocks: mockRow?.total ?? 0,
    medianNetGain:
      medianNetGain === null ? null : Math.round(medianNetGain * 100) / 100,
  };
}

/** Ağır hesabı koşup `impact_stats` singleton'ına yazar. Cron'un işi. */
export async function refreshImpactStats(): Promise<
  PublicImpactStats & { computedAt: Date }
> {
  const db = getDb();
  const stats = await computeImpactStats();
  const now = new Date();
  await db
    .insert(impactStats)
    .values({ id: 1, ...stats, computedAt: now })
    .onConflictDoUpdate({
      target: impactStats.id,
      set: { ...stats, computedAt: now, updatedAt: now },
    });
  return { ...stats, computedAt: now };
}

/**
 * Public sayaçlar — TEK satır okuması (`impact_stats`, id=1).
 *
 * Anlık görüntü hiç yoksa (taze DB, cron henüz koşmamış) bir kereliğine ağır
 * hesabı koşup yazar; sayfa boş sayaçla çıkmasın diye. Bu soğuk yol ömürde bir
 * kez işler — sonrasında cron güncel tutar. Bilerek "bayatsa yeniden hesapla"
 * DEĞİL: public sayfa tarayıcı yüküyle ağır taramayı tetiklememeli.
 */
export const getPublicImpactStats = cache(
  async (): Promise<PublicImpactStats> => {
    const db = getDb();
    const row = await db.query.impactStats.findFirst({
      where: eq(impactStats.id, 1),
    });
    if (row) {
      return {
        totalQuestions: row.totalQuestions,
        totalMocks: row.totalMocks,
        medianNetGain: row.medianNetGain,
      };
    }
    return refreshImpactStats();
  },
);

/** /kaynaklar kartı — DB satırı ya da tohum, aynı görünüm tipi. */
export type PublicResourceLink = {
  category: ResourceCategory;
  title: string;
  description: string | null;
  url: string;
  examCode: string | null;
  provider: string | null;
  isFeatured: boolean;
};

/**
 * Ücretsiz kaynak dizini. D1 boşsa `resource-links` tohumlarına düşer
 * (cms-content ile aynı fallback deseni) — seed çalıştırılmadan da dolu görünür.
 */
export async function getPublicResourceLinks(): Promise<PublicResourceLink[]> {
  const db = getDb();
  const rows = await db.query.resourceLinks.findMany({
    where: eq(resourceLinks.isActive, true),
    orderBy: [asc(resourceLinks.sortOrder), asc(resourceLinks.id)],
  });
  if (rows.length > 0) {
    return rows.map((r) => ({
      category: r.category,
      title: r.title,
      description: r.description,
      url: r.url,
      examCode: r.examCode,
      provider: r.provider,
      isFeatured: r.isFeatured,
    }));
  }
  return resourceLinkSeeds.map((s) => ({
    category: s.category,
    title: s.title,
    description: s.description,
    url: s.url,
    examCode: s.examCode,
    provider: s.provider,
    isFeatured: s.isFeatured,
  }));
}

/** Net hesaplama aracının beslendiği sınav yapısı (public, auth gerekmez). */
export type CalculatorSubject = {
  id: number;
  code: string;
  name: string;
  questionCount: number | null;
};
export type CalculatorSection = {
  id: number;
  code: string;
  name: string;
  /** LGS 3, YKS/KPSS 4 — net = doğru − yanlış / bu sayı. */
  wrongPenaltyDivisor: number;
  subjects: CalculatorSubject[];
};
export type CalculatorExam = {
  code: string;
  name: string;
  sections: CalculatorSection[];
};

/**
 * Net hesaplayıcı için sınav yapısı — ŞABLONDAN okunur, katsayı elle
 * kodlanmaz. Böylece müfredat/bölen değişince araç kendiliğinden güncellenir
 * ve uygulamanın kendi net hesabıyla (`computeNet`) daima tutarlı kalır.
 *
 * Yalnız PUANLANAN dersler döner (alt dersler — GEO/MANTIK — üst derse dahil
 * olduğu için ayrı satır olarak gösterilmez, yoksa çift sayılırdı).
 */
export const getCalculatorExams = cache(async (): Promise<CalculatorExam[]> => {
  const db = getDb();
  const templates = await db.query.examTemplates.findMany({
    where: eq(examTemplates.isActive, true),
    orderBy: [asc(examTemplates.id)],
    with: {
      sections: {
        orderBy: [asc(examSections.sortOrder)],
        with: {
          subjects: {
            where: eq(subjects.isScored, true),
            orderBy: [asc(subjects.sortOrder)],
          },
        },
      },
    },
  });

  return templates
    .map((t) => ({
      code: t.code,
      name: t.name,
      sections: t.sections
        .map((s) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          wrongPenaltyDivisor: s.wrongPenaltyDivisor,
          subjects: s.subjects
            .filter((sub) => sub.isActive)
            .map((sub) => ({
              id: sub.id,
              code: sub.code,
              name: sub.name,
              questionCount: sub.officialQuestionCount,
            })),
        }))
        .filter((s) => s.subjects.length > 0),
    }))
    .filter((t) => t.sections.length > 0);
});

/** Yönetici listesi — ham satırlar, fallback YOK. */
export async function listAllResourceLinks() {
  const db = getDb();
  return db.query.resourceLinks.findMany({
    orderBy: [asc(resourceLinks.category), asc(resourceLinks.sortOrder)],
  });
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
      kind: r.kind,
      priceKurus: r.priceKurus,
      compareAtKurus: r.compareAtKurus,
      period: r.period,
      lessonHours: r.lessonHours,
      features: parseJsonArray(r.features),
    }));
  }
  return packageSeeds.map((p) => ({
    name: p.name,
    kind: p.kind ?? "kocluk",
    priceKurus: p.priceKurus,
    compareAtKurus: p.compareAtKurus ?? null,
    period: p.period,
    lessonHours: p.lessonHours ?? null,
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
export const getPublicCoach = cache(async (): Promise<PublicCoach> => {
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
});

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
  const cards = rows
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
  // Ekip hiç seed'lenmemişse tohuma düş — site seed'siz de eksiksiz görünür.
  if (cards.length > 0) return cards;
  return teamCoachSeeds.map((c) => ({
    slug: c.slug,
    displayName: c.displayName,
    title: c.title,
    headline: c.headline,
    photoUrl: c.photoUrl,
    subjects: [...c.subjects],
  }));
}

/** Tek koç profili (slug ile) — /koclar/[slug]. Pasif/olmayan → null. */
export const getPublicCoachBySlug = cache(async (
  slug: string,
): Promise<PublicCoach | null> => {
  const db = getDb();
  const row = await db.query.coachProfiles.findFirst({
    where: and(eq(coachProfiles.slug, slug), eq(coachProfiles.isActive, true)),
  });
  if (row) return rowToPublicCoach(row);
  // Ekip seed'lenmemişse profil sayfası da tohumdan servis edilir (404 yerine).
  const seed = teamCoachSeeds.find((c) => c.slug === slug);
  if (!seed) return null;
  return {
    slug: seed.slug,
    displayName: seed.displayName,
    title: seed.title,
    location: seed.location,
    headline: seed.headline,
    bio: seed.bio,
    photoUrl: seed.photoUrl,
    coverImageUrl: null,
    subjects: [...seed.subjects],
    achievements: [...seed.credentials],
    links: [],
    proofUrl: null,
  };
});

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

/* -------------------------- Site iletişim / sosyal ------------------------ */

/**
 * Site geneli iletişim/sosyal ayarı; satır yoksa güvenli varsayılan döner.
 * `cache()` ile aynı istekte tekrar tekrar okunmaz (layout + footer + FAB).
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const db = getDb();
  const row = await db.query.siteSettings.findFirst({
    where: eq(siteSettings.id, 1),
  });
  return (
    row ?? {
      id: 1,
      whatsappPhone: null,
      // Sınavdan bağımsız: buton LGS ve KPSS sayfalarında da çıkıyor.
      whatsappMessage:
        "Merhaba, koçluk süreci hakkında bilgi almak istiyorum.",
      whatsappVisible: true,
      instagramUrl: null,
      tiktokUrl: null,
      youtubeUrl: null,
      publicStatsVisible: false,
      updatedAt: new Date(0),
    }
  );
});

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
