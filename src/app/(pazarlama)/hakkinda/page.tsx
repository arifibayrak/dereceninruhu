import Link from "next/link";
import {
  ExternalLinkIcon,
  GraduationCapIcon,
  MapPinIcon,
  StarIcon,
} from "lucide-react";

import { getPublicCoach } from "@/db/queries/cms";
import { coachContent, coachStats, ratingLabel } from "@/db/seed/cms-content";
import { CtaBand } from "@/components/marketing/cta-band";
import { ProofStrip } from "@/components/marketing/proof-strip";
import { SectionHeading } from "@/components/brand/section-heading";
import { StatTile } from "@/components/brand/stat-tile";
import { JsonLd } from "@/components/seo/json-ld";
import { CoachAvatar } from "@/components/brand/coach-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import {
  breadcrumbSchema,
  coachingCourseSchema,
  profilePageSchema,
} from "@/lib/schema";

// Koç profili D1'den okunur → istek başına render.
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Hakkında — Ahmet Hakan Almak",
  description:
    "Ahmet Hakan Almak kimdir? Derecenin Ruhu'nun kurucu koçu: Marmara Hukuk öğrencisi, YKS'de Türkiye 876., KPSS'de 93 puanla 712. 3+ yıldır KPSS, YKS ve LGS birebir koçluğu.",
  path: "/hakkinda",
  type: "profile",
});

export default async function HakkindaPage() {
  const coach = await getPublicCoach();
  const title = coach.title ?? coachContent.title;
  const location = coach.location ?? coachContent.location;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-16 px-4 py-10 sm:px-6 md:gap-20 md:py-16">
      {/* Yapısal veri: kurucu koç profili + puanlı program. Puan Person'a
          DEĞİL Course'a bağlanır (Google review snippet'i Person'ı desteklemez
          — bkz. @/lib/schema dosya başı notu); puan + yorum sayısı sayfada
          görünür. */}
      <JsonLd
        data={[
          profilePageSchema(coach, { profilePath: "/hakkinda" }),
          coachingCourseSchema({ withRating: true }),
          breadcrumbSchema([
            { name: "Ana Sayfa", path: "/" },
            { name: "Hakkında", path: "/hakkinda" },
          ]),
        ]}
      />

      {/* Kimlik */}
      <section className="flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <CoachAvatar
            photoUrl={coach.photoUrl}
            name={coach.displayName}
            priority
            className="size-24 ring-2 ring-primary/25 md:size-28"
            fallbackClassName="bg-secondary font-heading text-2xl font-bold text-secondary-foreground"
          />
          <div className="flex flex-col items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
              <span aria-hidden className="size-1.5 rounded-full bg-gold" />
              Kurucu koç
            </span>
            <h1 className="font-heading text-headline text-balance">
              {coach.displayName}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <GraduationCapIcon className="size-4" />
                {title}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPinIcon className="size-4" />
                {location} · görüşmeler online
              </span>
            </div>
          </div>
        </div>

        {/* Alıntılanabilir özet — GEO: LLM'ler bu tür net cümleleri alıntılar. */}
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground md:text-lg">
          Derecenin Ruhu, LGS, YKS ve KPSS için birebir online sınav koçluğu
          sunar. Kurucu koç {coach.displayName}, Marmara Üniversitesi Hukuk
          Fakültesi öğrencisidir; YKS&apos;de Türkiye 876., KPSS&apos;de 93
          puanla 712. olmuştur ve 3+ yıldır KPSS, YKS ve LGS öğrencilerine
          birebir koçluk yapmaktadır.
        </p>

        {coach.bio && (
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground">
            {coach.bio}
          </p>
        )}

        {/* `items-center` grid'i shrink-wrap etmesin diye `w-full` şart. */}
        <div className="grid w-full grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Yorum ortalaması"
            value={ratingLabel}
            hint={`${coachStats.reviewCount} yorum · Gigbi`}
          />
          <StatTile label="YKS derecesi" value="876." hint="Türkiye sıralaması" />
          <StatTile label="KPSS puanı" value="93" hint="Türkiye 712." />
          <StatTile label="Koçluk deneyimi" value="3+ yıl" hint="KPSS · YKS · LGS" />
        </div>
      </section>

      {/* Özgeçmiş */}
      <section className="flex flex-col items-center gap-4 text-center">
        <SectionHeading
          eyebrow="Özgeçmiş"
          title="Dereceler ve birikim"
          align="center"
        />
        <div className="flex flex-wrap justify-center gap-1.5">
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
      </section>

      {/* Sosyal kanıt */}
      <section className="flex flex-col items-center gap-4 text-center">
        <SectionHeading
          eyebrow="Sosyal kanıt"
          title="Bağımsız olarak doğrulanabilir"
          description="Yorumların tamamı Gigbi üzerinde gerçek öğrenci ve velilere aittir."
          align="center"
        />
        {/* `ml-auto` butonu olan flex satır — `items-center` altında `w-full` şart. */}
        <ProofStrip className="w-full" />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button render={<Link href="/iletisim" />}>
            Ahmet Hoca ile ön görüşme planla
          </Button>
          <Button
            variant="outline"
            render={
              <a
                href={coach.proofUrl ?? coachStats.proofUrl}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            Gigbi profilini doğrula
            <ExternalLinkIcon data-icon="inline-end" />
          </Button>
        </div>
      </section>

      <CtaBand
        title="Ahmet Hoca ile tanış."
        description="Ücretsiz ön görüşmede hedefini anlat; sana özel yol haritanı dinle. Karar tamamen senin."
      />
    </div>
  );
}
