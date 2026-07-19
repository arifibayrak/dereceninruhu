import Link from "next/link";
import {
  ArrowRightIcon,
  ExternalLinkIcon,
  GraduationCapIcon,
  MapPinIcon,
  StarIcon,
} from "lucide-react";

import {
  getPublicCoach,
  getPublicTestimonials,
  listOtherPublicCoaches,
} from "@/db/queries/cms";
import { coachContent, coachStats } from "@/db/seed/cms-content";
import { CtaBand } from "@/components/marketing/cta-band";
import { SectionHeading } from "@/components/brand/section-heading";
import { StatTile } from "@/components/brand/stat-tile";
import { TestimonialCard } from "@/components/brand/testimonial-card";
import { JsonLd } from "@/components/seo/json-ld";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbSchema, profilePageSchema } from "@/lib/schema";

// Koç profili D1'den okunur → istek başına render.
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Koçlar",
  description:
    "Ahmet Hakan Almak — YKS Türkiye 876., KPSS 93 puan. 3+ yıldır LGS, YKS ve KPSS öğrencilerine birebir koçluk. 5,0★ / 77 yorum.",
  path: "/koclar",
});

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toLocaleUpperCase("tr-TR"))
    .join("");
}

export default async function KoclarPage() {
  const [coach, testimonials, team] = await Promise.all([
    getPublicCoach(),
    getPublicTestimonials(),
    listOtherPublicCoaches(),
  ]);
  const title = coach.title ?? coachContent.title;
  const location = coach.location ?? coachContent.location;
  const proofUrl = coach.proofUrl ?? coachStats.proofUrl;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-10 sm:px-6 md:gap-20 md:py-16">
      {/* Yapısal veri: koç profili (5,0★/77 puan + yorumlar sayfada görünür). */}
      <JsonLd
        data={[
          profilePageSchema(coach, {
            withRating: true,
            profilePath: "/koclar",
          }),
          breadcrumbSchema([
            { name: "Ana Sayfa", path: "/" },
            { name: "Koçlar", path: "/koclar" },
          ]),
        ]}
      />
      {/* Profil kahramanı */}
      <section className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-20 left-1/2 h-64 w-[min(34rem,90vw)] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute top-10 right-[12%] size-36 rounded-full bg-gold/15 blur-2xl" />
        </div>
        <div className="flex flex-col gap-8 rounded-3xl bg-card p-6 ring-1 ring-foreground/10 sm:p-10">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
            <Avatar className="size-24 ring-2 ring-primary/25 md:size-28">
              {coach.photoUrl && (
                <AvatarImage src={coach.photoUrl} alt={coach.displayName} />
              )}
              <AvatarFallback className="bg-secondary font-heading text-2xl font-bold text-secondary-foreground">
                {initialsOf(coach.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <h1 className="font-heading text-headline text-balance">
                {coach.displayName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCapIcon className="size-4" />
                  {title}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPinIcon className="size-4" />
                  {location} · görüşmeler online
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {coach.subjects.map((s) => (
                  <Badge key={s} variant="outline">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <p className="max-w-3xl text-base leading-relaxed text-pretty text-muted-foreground">
            {coach.bio}
          </p>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Yorum ortalaması" value="5,0" hint={`${coachStats.reviewCount} yorum · Gigbi`} />
            <StatTile label="YKS derecesi" value="876." hint="Türkiye sıralaması" />
            <StatTile label="KPSS puanı" value="93" hint="Türkiye 712." />
            <StatTile label="Koçluk deneyimi" value="3+ yıl" hint="KPSS · YKS · LGS" />
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Özgeçmiş ve dereceler
            </span>
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

          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" render={<Link href="/iletisim" />}>
              Ahmet Hoca ile ön görüşme planla
            </Button>
            <Button
              variant="outline"
              render={
                <a href={proofUrl} target="_blank" rel="noopener noreferrer" />
              }
            >
              Gigbi profilini doğrula
              <ExternalLinkIcon data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </section>

      {/* Ekip — diğer koçlar (varsa) */}
      {team.length > 0 && (
        <section className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="Ekip"
            title="Koçlarımız"
            description="Her koçun kendi alanı ve yaklaşımı var; profillerinde ayrıntıya ulaşabilirsin."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member) => (
              <Link
                key={member.slug}
                href={`/koclar/${member.slug}`}
                className="group flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow hover:ring-primary/30"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="size-14 ring-2 ring-primary/20">
                    {member.photoUrl && (
                      <AvatarImage
                        src={member.photoUrl}
                        alt={member.displayName}
                      />
                    )}
                    <AvatarFallback className="bg-secondary font-heading font-bold text-secondary-foreground">
                      {initialsOf(member.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-heading text-lg font-semibold">
                      {member.displayName}
                    </span>
                    {member.title && (
                      <span className="text-sm text-muted-foreground">
                        {member.title}
                      </span>
                    )}
                  </div>
                </div>
                {member.headline && (
                  <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
                    {member.headline}
                  </p>
                )}
                {member.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {member.subjects.map((s) => (
                      <Badge key={s} variant="outline">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Profili gör
                  <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Öğrencilerinin sözleri */}
      <section className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Öğrencilerinden"
          title="Birlikte çalışanlar ne diyor?"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.slice(0, 3).map((t) => (
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
        <Button
          variant="link"
          className="self-center"
          render={<Link href="/basarilar" />}
        >
          Tüm yorumları gör
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </section>

      <CtaBand
        title="Ahmet Hoca ile tanış."
        description="Ücretsiz ön görüşmede hedefini anlat; sana özel yol haritanı dinle. Karar tamamen senin."
      />
    </div>
  );
}
