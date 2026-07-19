/**
 * JSON-LD şema üreticileri (saf fonksiyonlar). Zaten çekilmiş public
 * görüntüleme modellerini alır; DB'ye erişmez. `@id` çapalarıyla varlıklar
 * (Organization / WebSite / Person) birbirine bağlanır.
 *
 * ⚠️ Google "kendi kendine verilen puan" politikası: `aggregateRating` ASLA
 * Organization/LocalBusiness üzerine konmaz — yalnız Service / Course / Person
 * üzerinde ve yorumların sayfada göründüğü yerlerde kullanılır.
 */
import type {
  PublicCoach,
  PublicFaq,
  PublicPackage,
  PublicTestimonial,
} from "@/db/queries/cms";
import { coachContent, coachStats } from "@/db/seed/cms-content";
import { SITE_NAME, SITE_URL, absoluteUrl, sameAsLinks } from "@/lib/seo";

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const PERSON_ID = `${SITE_URL}/#ahmet-hakan-almak`;

const EXAM_KNOWS = [
  "LGS koçluğu",
  "YKS koçluğu",
  "KPSS koçluğu",
  "TYT AYT koçluğu",
  "Deneme analizi",
  "Ders çalışma programı",
  "Net takibi",
];

/** 5,0★ / 77 — yalnız Service/Course/Person üzerinde kullanılır. */
function aggregateRating() {
  return {
    "@type": "AggregateRating",
    ratingValue: coachStats.ratingAvg,
    reviewCount: coachStats.reviewCount,
    bestRating: 5,
    worstRating: 1,
  };
}

function orgAddress() {
  return {
    "@type": "PostalAddress",
    addressLocality: "Kartal",
    addressRegion: "İstanbul",
    addressCountry: "TR",
  };
}

/** EducationalOrganization — site geneli marka varlığı (kök/ana sayfa). */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": ORG_ID,
    name: SITE_NAME,
    alternateName: "Derecenin Ruhu Koçluk",
    url: SITE_URL,
    logo: absoluteUrl("/icon.svg"),
    image: absoluteUrl("/opengraph-image.png"),
    description:
      "LGS, YKS ve KPSS için birebir online sınav koçluğu: haftalık program, soru takibi ve deneme analizi.",
    slogan: "Netlerini artır, hedefine ulaş.",
    email: "info@dereceninruhu.com",
    areaServed: { "@type": "Country", name: "Türkiye" },
    address: orgAddress(),
    knowsAbout: EXAM_KNOWS,
    sameAs: sameAsLinks(),
    founder: { "@id": PERSON_ID },
  };
}

/** WebSite — arama motoru için site kimliği (site içi arama yok → SearchAction yok). */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: "tr-TR",
    publisher: { "@id": ORG_ID },
  };
}

/**
 * Person — öne çıkan koç (Ahmet Hakan). `withRating` yalnız yorumların
 * sayfada göründüğü rotalarda (/koclar, /hakkinda) true verilir.
 */
export function personSchema(
  coach: PublicCoach,
  opts: { withRating?: boolean; profilePath?: string; id?: string } = {},
) {
  const extraSame = coach.links.map((l) => l.url);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": opts.id ?? PERSON_ID,
    name: coach.displayName,
    jobTitle: coach.title ?? "Eğitim Koçu",
    description: coach.bio ?? undefined,
    image: coach.photoUrl ? absoluteUrl(coach.photoUrl) : undefined,
    url: absoluteUrl(opts.profilePath ?? "/hakkinda"),
    worksFor: { "@id": ORG_ID },
    homeLocation: { "@type": "Place", address: orgAddress() },
    knowsAbout: [
      ...coach.subjects.map((s) => `${s} koçluğu`),
      ...coach.achievements,
    ],
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "Marmara Üniversitesi Hukuk Fakültesi",
    },
    sameAs: sameAsLinks([coach.proofUrl ?? "", ...extraSame]),
    ...(opts.withRating ? { aggregateRating: aggregateRating() } : {}),
  };
}

/** ProfilePage sarmalayıcı — /koclar ve /hakkinda için Person'ı ana varlık yapar. */
export function profilePageSchema(
  coach: PublicCoach,
  opts: { withRating?: boolean; profilePath?: string; id?: string } = {},
) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: absoluteUrl(opts.profilePath ?? "/hakkinda"),
    mainEntity: personSchema(coach, opts),
  };
}

/**
 * Service — koçluk hizmeti. `withRating` yorumların göründüğü sayfalarda true.
 * `packages` verilirse Offer kataloğu eklenir (/fiyatlar).
 */
export function serviceSchema(opts: {
  withRating?: boolean;
  packages?: PublicPackage[];
  serviceType?: string;
  name?: string;
} = {}) {
  const offers = opts.packages?.map((p) => offerFromPackage(p));
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name ?? "Sınav Koçluğu",
    serviceType: opts.serviceType ?? "LGS, YKS ve KPSS birebir sınav koçluğu",
    provider: { "@id": ORG_ID },
    areaServed: { "@type": "Country", name: "Türkiye" },
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: absoluteUrl("/iletisim"),
      availableLanguage: "Turkish",
    },
    ...(offers?.length ? { offers } : {}),
    ...(opts.withRating ? { aggregateRating: aggregateRating() } : {}),
  };
}

function offerFromPackage(p: PublicPackage) {
  return {
    "@type": "Offer",
    name: p.name,
    price: (p.priceKurus / 100).toFixed(2),
    priceCurrency: "TRY",
    category: p.period ?? undefined,
    availability: "https://schema.org/InStock",
    url: absoluteUrl("/fiyatlar"),
  };
}

/**
 * Course — sınava özel açılış sayfaları (/{sınav}-koclugu). Google Course
 * zenginliği için provider + hasCourseInstance gerekir.
 */
export function courseSchema(opts: {
  exam: "LGS" | "YKS" | "KPSS";
  name: string;
  description: string;
  path: string;
  withRating?: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    provider: { "@id": ORG_ID },
    inLanguage: "tr-TR",
    about: `${opts.exam} sınavı hazırlık`,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT4H",
      location: { "@type": "VirtualLocation", url: SITE_URL },
    },
    ...(opts.withRating ? { aggregateRating: aggregateRating() } : {}),
  };
}

/** FAQPage — /sss ve ana sayfa SSS bloğu. */
export function faqPageSchema(faqs: PublicFaq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

type BlogPostForSchema = {
  slug: string;
  title: string;
  excerpt?: string | null;
  publishedAt?: Date | null;
  updatedAt?: Date | null;
  author?: { name?: string | null } | null;
};

/** BlogPosting — /blog/[slug]. */
export function blogPostingSchema(post: BlogPostForSchema) {
  const path = `/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    inLanguage: "tr-TR",
    datePublished: post.publishedAt?.toISOString(),
    dateModified: (post.updatedAt ?? post.publishedAt)?.toISOString(),
    author: {
      "@type": "Person",
      // Tek marka: yazar her zaman öne çıkan koç (login hesabı değil).
      "@id": PERSON_ID,
      name: coachContent.displayName,
      url: absoluteUrl("/hakkinda"),
    },
    publisher: { "@id": ORG_ID },
    mainEntityOfPage: absoluteUrl(path),
    url: absoluteUrl(path),
    image: absoluteUrl("/opengraph-image.png"),
  };
}

/** BreadcrumbList — iç içe sayfalar için gezinme izi. */
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

/**
 * Review dizisi — /basarilar (yorumlar sayfada görünür → politika uyumlu).
 * itemReviewed olarak koçluk Service'i işaretlenir.
 */
export function reviewsSchema(testimonials: PublicTestimonial[]) {
  return testimonials.slice(0, 20).map((t) => ({
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: { "@type": "Service", name: "Sınav Koçluğu" },
    author: { "@type": "Person", name: t.displayName },
    reviewRating: { "@type": "Rating", ratingValue: 5, bestRating: 5 },
    reviewBody: t.quote,
    ...(t.date ? { datePublished: t.date.slice(0, 10) } : {}),
  }));
}
