import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  CheckIcon,
  GraduationCapIcon,
  MessageCircleIcon,
  SparklesIcon,
  StarIcon,
  TrendingUpIcon,
} from "lucide-react";

import {
  getPublicCoach,
  getPublicFaqs,
  getPublicPackages,
  getPublicTestimonials,
} from "@/db/queries/cms";
import { coachContent, coachStats } from "@/db/seed/cms-content";
import { formatKurus } from "@/lib/format";
import { CtaBand } from "@/components/marketing/cta-band";
import { ExamCountdown } from "@/components/marketing/exam-countdown";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { ProofStrip } from "@/components/marketing/proof-strip";
import { SectionHeading } from "@/components/brand/section-heading";
import { TestimonialCard } from "@/components/brand/testimonial-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// CMS içeriği D1'den okunur → istek başına render (bkz. AGENTS.md).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Derecenin Ruhu — LGS, YKS ve KPSS Birebir Koçluk" },
  description:
    "Derece yapmış bir koçla birebir sınav koçluğu: haftalık program, soru takibi ve deneme analiziyle netlerini artır, hedefine ulaş. 5,0★ / 77 yorum.",
};

const STEPS = [
  {
    icon: MessageCircleIcon,
    title: "Ücretsiz ön görüşme",
    body: "Hedefini, güncel netlerini ve gün düzenini konuşuruz; sana nasıl bir yol çizeceğimizi somut olarak anlatırız.",
  },
  {
    icon: CalendarDaysIcon,
    title: "Sana özel haftalık program",
    body: "Eksiklerine ve saatlerine göre hazırlanan program; soru sayıların ve denemelerin sistem üzerinden takip edilir.",
  },
  {
    icon: TrendingUpIcon,
    title: "Deneme analizi + haftalık görüşme",
    body: "Her hafta birebir görüşmede denemelerini analiz eder, programı birlikte güncelleriz. Net artışı grafikte görünür.",
  },
] as const;

const EXAM_CARDS = [
  {
    code: "LGS",
    icon: BookOpenIcon,
    title: "LGS",
    body: "8. sınıf sürecinde düzen, deneme alışkanlığı ve veliyle şeffaf takip.",
  },
  {
    code: "YKS",
    icon: GraduationCapIcon,
    title: "YKS · TYT-AYT",
    body: "Alanına göre program, konu bazlı eksik haritası ve sıralama hedefi.",
  },
  {
    code: "KPSS",
    icon: BriefcaseIcon,
    title: "KPSS",
    body: "İş-çalışma dengesine uyan gerçekçi program ve atama hedefine giden strateji.",
  },
] as const;

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toLocaleUpperCase("tr-TR"))
    .join("");
}

export default async function HomePage() {
  const [testimonials, packages, faqs, coach] = await Promise.all([
    getPublicTestimonials(),
    getPublicPackages(),
    getPublicFaqs(),
    getPublicCoach(),
  ]);

  const featured = testimonials.slice(0, 6);
  const strip = testimonials.slice(6);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 py-10 sm:px-6 md:gap-28 md:py-16">
      {/* -------------------------------- Hero ------------------------------- */}
      {/* İlk ekranı doldurur (masaüstü): alttaki bölüm katlamanın altına iner. */}
      <section className="relative lg:flex lg:min-h-[calc(100svh-285px)] lg:flex-col lg:justify-center">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/4 h-72 w-[min(34rem,90vw)] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute top-8 right-[10%] size-40 rounded-full bg-gold/15 blur-2xl" />
        </div>
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
              <span aria-hidden className="size-1.5 rounded-full bg-gold" />
              LGS · YKS · KPSS birebir koçluk
            </span>
            <h1 className="font-heading text-display max-w-2xl text-balance">
              Netlerini artır,{" "}
              <span className="text-primary">hedefine ulaş</span>
              <span className="text-gold">.</span>
            </h1>
            <p className="max-w-xl text-base text-pretty text-muted-foreground md:text-lg">
              Derece yapmış bir koçla haftalık program, soru takibi ve deneme
              analizi. Motivasyon konuşması değil; ölçülen, görünen ilerleme.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" render={<Link href="/iletisim" />}>
                <SparklesIcon data-icon="inline-start" />
                Ücretsiz Ön Görüşme
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/nasil-calisir" />}>
                Nasıl çalışır?
              </Button>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-0.5" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className="size-4 fill-gold text-gold" />
                ))}
              </span>
              5,0 · {coachStats.reviewCount} yorum · Gigbi&apos;de doğrulanabilir
            </span>
          </div>
          <div className="px-2 py-6 sm:px-6 lg:px-0">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* ---------------------------- Sosyal kanıt --------------------------- */}
      <section className="-mt-8 md:-mt-14">
        <ProofStrip credentials={coach.achievements.slice(1, 4)} />
      </section>

      {/* ---------------------------- Nasıl çalışır -------------------------- */}
      <section className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Yöntem"
          title="Üç adımda derecenin ruhu"
          description="Karmaşık değil: tanış, programını al, her hafta ölçerek ilerle."
          align="center"
          className="items-center"
        />
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="relative flex flex-col gap-3 rounded-2xl bg-card p-6 ring-1 ring-foreground/10"
            >
              <span className="absolute top-5 right-5 font-heading text-4xl font-bold text-primary/10">
                {i + 1}
              </span>
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="size-5" />
              </span>
              <h3 className="font-heading text-base font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
                {step.body}
              </p>
            </div>
          ))}
        </div>
        <Button
          variant="link"
          className="self-center"
          render={<Link href="/nasil-calisir" />}
        >
          Sürecin tamamını gör
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </section>

      {/* ------------------------------ Koç kartı ---------------------------- */}
      <section className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Koçun"
          title="Bu yoldan geçmiş biriyle çalış"
          description="Teoriden değil, kendi derecesinden konuşan bir koç."
        />
        <div className="grid items-center gap-6 rounded-3xl bg-card p-6 ring-1 ring-foreground/10 sm:p-8 lg:grid-cols-[auto_1fr_auto]">
          <div className="flex items-center gap-4 lg:flex-col lg:items-start">
            <Avatar className="size-20 ring-2 ring-primary/20 sm:size-24">
              {coach.photoUrl && (
                <AvatarImage src={coach.photoUrl} alt={coach.displayName} />
              )}
              <AvatarFallback className="bg-secondary font-heading text-xl font-bold text-secondary-foreground">
                {initialsOf(coach.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5">
              <span className="font-heading text-lg font-semibold">
                {coach.displayName}
              </span>
              <span className="text-sm text-muted-foreground">
                {coachContent.title} · {coachContent.location}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <p className="max-w-2xl text-sm leading-relaxed text-pretty text-muted-foreground md:text-base">
              {coach.bio}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {coach.achievements.map((a) => (
                <Badge
                  key={a}
                  variant="secondary"
                  className={
                    a.includes("Türkiye") || a.includes("KPSS 9")
                      ? "bg-gold/15 text-gold-foreground dark:text-gold"
                      : undefined
                  }
                >
                  {(a.includes("Türkiye") || a.includes("KPSS 9")) && (
                    <StarIcon className="fill-current" />
                  )}
                  {a}
                </Badge>
              ))}
            </div>
          </div>
          <Button
            variant="outline"
            className="self-start lg:self-center"
            render={<Link href="/koclar" />}
          >
            Profili incele
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </section>

      {/* ------------------------------- Yorumlar ---------------------------- */}
      <section className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Sosyal kanıt"
          title="Öğrenciler ve veliler ne diyor?"
          description={`Gigbi üzerinde 5,0 yıldız ortalamayla ${coachStats.reviewCount} gerçek yorum. Sitede ad + soyadın ilk harfi kullanılır.`}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((t) => (
            <TestimonialCard
              key={t.displayName}
              testimonial={{
                displayName: t.displayName,
                exam: t.exam,
                quote: t.quote,
                date: t.date,
              }}
            />
          ))}
        </div>
        {strip.length > 0 && (
          <div className="relative -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex w-max gap-3 pb-1">
              {strip.map((t) => (
                <div
                  key={t.displayName}
                  className="flex w-56 shrink-0 flex-col gap-1 rounded-lg bg-muted/60 p-3"
                >
                  <span className="text-xs font-medium">{t.displayName}</span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">
                    “{t.quote}”
                  </span>
                </div>
              ))}
              <Link
                href="/basarilar"
                className="flex w-40 shrink-0 items-center justify-center rounded-lg bg-primary/8 p-3 text-center text-xs font-medium text-primary transition-colors hover:bg-primary/15"
              >
                +{Math.max(coachStats.reviewCount - featured.length, 0)} yorum
                daha →
              </Link>
            </div>
          </div>
        )}
        <Button
          variant="link"
          className="self-center"
          render={<Link href="/basarilar" />}
        >
          Tüm başarı hikayeleri
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </section>

      {/* ----------------------------- Sınav kartları ------------------------ */}
      <section className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Sınavlar"
          title="Hangi sınava hazırlanıyorsan"
          description="Üç sınav, tek yöntem: ölç, planla, analiz et, tekrarla."
          align="center"
          className="items-center"
        />
        <div className="grid gap-4 md:grid-cols-3">
          {EXAM_CARDS.map((exam) => (
            <div
              key={exam.code}
              className="group flex flex-col gap-3 rounded-2xl bg-card p-6 ring-1 ring-foreground/10 transition-shadow hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <exam.icon className="size-5" />
                </span>
                <Badge variant="outline">{exam.code}</Badge>
              </div>
              <h3 className="font-heading text-base font-semibold">{exam.title}</h3>
              <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
                {exam.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------- Sayaç ------------------------------ */}
      <section className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Sayaç"
          title="Sınava kaç gün kaldı?"
          description="LGS, YKS ve KPSS için geri sayım. Tarihler ÖSYM/MEB takvimine göredir."
          align="center"
          className="items-center"
        />
        <ExamCountdown />
        <Button
          variant="link"
          className="self-center"
          render={<Link href="/sayac" />}
        >
          Tüm sınav tarihleri
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </section>

      {/* ------------------------------ Fiyat teaser ------------------------- */}
      <section className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Paketler"
          title="Şeffaf ve sade fiyatlandırma"
          description="Uzun taahhüt yok; her paket ücretsiz ön görüşmeyle başlar."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {packages.slice(0, 3).map((pkg, i) => (
            <div
              key={pkg.name}
              className={
                i === 1
                  ? "flex flex-col gap-3 rounded-2xl bg-card p-6 ring-2 ring-primary/40"
                  : "flex flex-col gap-3 rounded-2xl bg-card p-6 ring-1 ring-foreground/10"
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-heading text-base font-semibold">
                  {pkg.name}
                </span>
                {i === 1 && <Badge>En popüler</Badge>}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-heading text-2xl font-bold tabular-nums">
                  {formatKurus(pkg.priceKurus)}
                </span>
                {pkg.period && (
                  <span className="text-sm text-muted-foreground">
                    / {pkg.period}
                  </span>
                )}
              </div>
              <ul className="flex flex-col gap-1.5">
                {pkg.features.slice(0, 3).map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          className="self-center"
          render={<Link href="/fiyatlar" />}
        >
          Tüm paket detayları
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </section>

      {/* ------------------------------- SSS teaser -------------------------- */}
      <section className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <SectionHeading
          eyebrow="Merak edilenler"
          title="Aklına takılanlar"
          description="En çok sorulan sorulardan birkaçı — tamamı SSS sayfasında."
        />
        <div className="flex flex-col gap-4">
          <FaqAccordion items={faqs.slice(0, 4)} />
          <Button variant="link" className="self-start" render={<Link href="/sss" />}>
            Tüm soruları gör
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </section>

      {/* -------------------------------- Kapanış ---------------------------- */}
      <CtaBand />
    </div>
  );
}
