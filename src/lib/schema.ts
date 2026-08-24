/**
 * JSON-LD şema üreticileri (saf fonksiyonlar). Zaten çekilmiş public
 * görüntüleme modellerini alır; DB'ye erişmez. `@id` çapalarıyla varlıklar
 * (Organization / WebSite / Person) birbirine bağlanır.
 *
 * ⚠️ PUAN/YORUM İŞARETLEMESİ — İKİ AYRI KURAL VAR, İKİSİ DE BAĞLAYICI:
 *
 * 1) Google'ın "review snippet" desteklediği tipler SAYILIDIR: Book, Course,
 *    Event, LocalBusiness, Movie, Organization, Product, Recipe, HowTo,
 *    SoftwareApplication, Game, Episode, MediaObject, Music*, CreativeWork*.
 *    `Service` ve `Person` bu listede YOKTUR. Bunlara `aggregateRating` /
 *    `review` takılırsa Search Console "Invalid object type for field
 *    '<parent_node>'", `itemReviewed: {"@type":"Service"}` ise "Invalid object
 *    type for field 'itemReviewed'" hatası verir (2026-08'de 12 geçersiz öğe
 *    tam olarak buydu).
 * 2) "Kendi kendine verilen puan" politikası: bir varlığın KENDİ sitesindeki
 *    yorumlar Organization/LocalBusiness için kabul EDİLMEZ.
 *
 * (1) ∩ (2) → bu sitede puan/yorum taşıyabilecek tek doğru tip `Course`.
 * Bu yüzden tüm `aggregateRating` ve `Review.itemReviewed` bağlamaları
 * `Course` üzerinedir. Service/Person/Organization'a puan EKLEME.
 */
import type {
  PublicCoach,
  PublicFaq,
  PublicPackage,
  PublicTestimonial,
} from "@/db/queries/cms";
import { coachContent, coachStats } from "@/db/seed/cms-content";
import {
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  sameAsLinks,
  sameAsWith,
} from "@/lib/seo";

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const PERSON_ID = `${SITE_URL}/#ahmet-hakan-almak`;
/** Puan/yorumların bağlandığı kanonik koçluk programı (bkz. dosya başı notu). */
export const COURSE_ID = `${SITE_URL}/#kocluk-programi`;

const EXAM_KNOWS = [
  "LGS koçluğu",
  "YKS koçluğu",
  "KPSS koçluğu",
  "TYT AYT koçluğu",
  "Deneme analizi",
  "Ders çalışma programı",
  "Net takibi",
];

/** Gigbi puanı + yorum sayısı — YALNIZ Course üzerinde kullanılır (bkz. dosya başı notu). */
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

/**
 * EducationalOrganization — site geneli marka varlığı (kök/ana sayfa).
 *
 * `social` verilirse (yöneticinin `/koc/site`'ta girdiği URL'ler) `sameAs`
 * bunlarla zenginleşir; verilmezse `SOCIAL_LINKS` sabiti kullanılır.
 */
export function organizationSchema(social?: {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
}) {
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
    // Override sabitin YERİNE geçer — aynı platformun iki adresi yayınlanmaz.
    sameAs: sameAsWith({
      instagram: social?.instagram,
      tiktok: social?.tiktok,
      youtube: social?.youtube,
    }),
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
 * Özgeçmişteki okul satırından alumniOf üretir. Konvansiyon: `achievements`
 * dizisinin İLK maddesi üniversite/fakülte satırıdır (tohumlar böyle yazılır,
 * ana sayfa da `slice(1)` ile bu maddeyi atlar). Okul bulunamazsa alan hiç
 * yazılmaz — yanlış bilgi basmaktansa eksik bırakmak yeğdir.
 */
function alumniOf(achievements: string[]) {
  const school = achievements.find((a) =>
    /üniversite|fakülte|university/i.test(a),
  );
  if (!school) return undefined;
  return {
    "@type": "CollegeOrUniversity",
    // "… — 3. sınıf" gibi sınıf ekini kurum adından ayıkla.
    name: school.split("—")[0].trim(),
  };
}

/**
 * Person — bir koç profili.
 *
 * ⚠️ `aggregateRating` YOK: Google review snippet'i `Person` tipinde de
 * desteklemiyor (Search Console: "Invalid object type for '<parent_node>'").
 * Koç sayfalarında puan göstermek gerekirse `coachingCourseSchema()` ayrı bir
 * öğe olarak eklenir.
 */
export function personSchema(
  coach: PublicCoach,
  opts: { profilePath?: string; id?: string } = {},
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
    // Üniversite koçun kendi özgeçmişinden okunur — ilk madde okul satırıdır.
    // Ekipte birden çok koç var; sabit bir okul her profile yanlış bilgi basar.
    alumniOf: alumniOf(coach.achievements),
    sameAs: sameAsLinks([coach.proofUrl ?? "", ...extraSame]),
  };
}

/** ProfilePage sarmalayıcı — /koclar ve /hakkinda için Person'ı ana varlık yapar. */
export function profilePageSchema(
  coach: PublicCoach,
  opts: { profilePath?: string; id?: string } = {},
) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: absoluteUrl(opts.profilePath ?? "/hakkinda"),
    mainEntity: personSchema(coach, opts),
  };
}

/**
 * Service — koçluk hizmeti. `packages` verilirse Offer kataloğu eklenir
 * (/fiyatlar).
 *
 * ⚠️ Burada `aggregateRating` YOK ve olmamalı: Google review snippet'i `Service`
 * tipinde desteklemiyor, eklendiğinde tüm öğe geçersiz sayılıyor. Puan
 * `coachingCourseSchema()` ile Course üzerinden verilir.
 */
export function serviceSchema(opts: {
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

/**
 * Kanonik koçluk programı (Course) — puanı ve yorumları TAŞIYAN varlık.
 *
 * Google'ın review snippet desteklediği tipler arasında bu sitenin gerçekten
 * karşıladığı tek tip `Course`. Sınava özel açılış sayfaları kendi
 * `courseSchema()`'sını kullanır; bu ise genel koçluk programını temsil eder ve
 * yorumların SAYFADA GÖRÜNDÜĞÜ rotalarda (ana sayfa, /basarilar) yayınlanır.
 */
export function coachingCourseSchema(opts: { withRating?: boolean } = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": COURSE_ID,
    name: "Birebir Sınav Koçluğu",
    description:
      "LGS, YKS ve KPSS için birebir online sınav koçluğu: haftalık program, soru takibi ve deneme analizi.",
    url: SITE_URL,
    provider: { "@id": ORG_ID },
    inLanguage: "tr-TR",
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
 *
 * ⚠️ `itemReviewed` COURSE olmalı. Önceden `Service` idi ve Search Console her
 * yorumu "Invalid object type for field 'itemReviewed'" ile eliyordu — Google
 * review snippet'i Service tipinde desteklemiyor. `Organization` de çözüm
 * değil: kendi sitendeki kendi yorumların ("self-serving") o tipte kabul
 * edilmiyor. Sayfada ayrıca `coachingCourseSchema()` yayınlanır; `@id` ikisini
 * aynı varlıkta birleştirir.
 */
export function reviewsSchema(testimonials: PublicTestimonial[]) {
  return testimonials.slice(0, 20).map((t) => ({
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "Course",
      "@id": COURSE_ID,
      name: "Birebir Sınav Koçluğu",
      provider: { "@id": ORG_ID },
    },
    author: { "@type": "Person", name: t.displayName },
    reviewRating: { "@type": "Rating", ratingValue: 5, bestRating: 5 },
    reviewBody: t.quote,
    ...(t.date ? { datePublished: t.date.slice(0, 10) } : {}),
  }));
}
