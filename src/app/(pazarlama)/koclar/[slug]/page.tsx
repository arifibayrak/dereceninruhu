import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  GraduationCapIcon,
  LinkIcon,
  MapPinIcon,
  StarIcon,
} from "lucide-react";

import { getPublicCoachBySlug } from "@/db/queries/cms";
import { CtaBand } from "@/components/marketing/cta-band";
import { JsonLd } from "@/components/seo/json-ld";
import { CoachAvatar } from "@/components/brand/coach-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { breadcrumbSchema, profilePageSchema } from "@/lib/schema";

// Koç profili D1'den okunur → istek başına render.
export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const coach = await getPublicCoachBySlug(slug);
  if (!coach) return { title: "Koç bulunamadı", robots: { index: false } };
  const desc =
    coach.headline ??
    coach.bio?.slice(0, 155) ??
    `${coach.displayName} — Derecenin Ruhu koçu.`;
  return buildMetadata({
    title: coach.displayName,
    description: desc,
    path: `/koclar/${slug}`,
    type: "profile",
  });
}

export default async function KoachProfilePage({ params }: { params: Params }) {
  const { slug } = await params;
  const coach = await getPublicCoachBySlug(slug);
  if (!coach) notFound();

  const highlight = (a: string) => a.includes("Türkiye") || a.includes("KPSS 9");
  const profilePath = `/koclar/${slug}`;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-4 py-10 sm:px-6 md:gap-16 md:py-16">
      {/* Yapısal veri: bu koçun profili (slug'a özgü @id). */}
      <JsonLd
        data={[
          profilePageSchema(coach, {
            profilePath,
            id: `${absoluteUrl(profilePath)}#person`,
          }),
          breadcrumbSchema([
            { name: "Ana Sayfa", path: "/" },
            { name: "Koçlar", path: "/koclar" },
            { name: coach.displayName, path: profilePath },
          ]),
        ]}
      />
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        render={<Link href="/koclar" />}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        Tüm koçlar
      </Button>

      <section className="overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/10">
        {/* Kapak (arka plan) */}
        <div className="relative h-36 sm:h-44">
          {coach.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coach.coverImageUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <div className="size-full bg-gradient-to-br from-primary/20 via-primary/10 to-gold/15" />
          )}
        </div>

        <div className="flex flex-col gap-8 px-6 pb-8 sm:px-10 sm:pb-10">
          <div className="-mt-12 flex flex-col items-start gap-5 sm:-mt-14 sm:flex-row sm:items-end">
            <CoachAvatar
              photoUrl={coach.photoUrl}
              name={coach.displayName}
              priority
              className="size-24 ring-4 ring-card sm:size-28"
              fallbackClassName="bg-secondary font-heading text-2xl font-bold text-secondary-foreground"
            />
            <div className="flex flex-col gap-2 pt-2">
              <h1 className="font-heading text-headline text-balance">
                {coach.displayName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {coach.title && (
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCapIcon className="size-4" />
                    {coach.title}
                  </span>
                )}
                {coach.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPinIcon className="size-4" />
                    {coach.location}
                  </span>
                )}
              </div>
              {coach.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {coach.subjects.map((s) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {coach.headline && (
            <p className="font-heading text-xl text-balance sm:text-2xl">
              {coach.headline}
            </p>
          )}

          {coach.bio && (
            <p className="max-w-3xl text-base leading-relaxed text-pretty text-muted-foreground">
              {coach.bio}
            </p>
          )}

          {coach.achievements.length > 0 && (
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
                      highlight(a)
                        ? "bg-gold/15 text-gold-foreground dark:text-gold"
                        : undefined
                    }
                  >
                    {highlight(a) && <StarIcon className="fill-current" />}
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(coach.links.length > 0 || coach.proofUrl) && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Hesaplar ve bağlantılar
              </span>
              <div className="flex flex-wrap gap-2">
                {coach.links.map((link) => (
                  <Button
                    key={`${link.label}:${link.url}`}
                    variant="outline"
                    size="sm"
                    render={
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    <LinkIcon data-icon="inline-start" />
                    {link.label}
                  </Button>
                ))}
                {coach.proofUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    render={
                      <a
                        href={coach.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    Profili doğrula
                    <ExternalLinkIcon data-icon="inline-end" />
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button size="lg" render={<Link href="/iletisim" />}>
              Ön görüşme planla
            </Button>
          </div>
        </div>
      </section>

      <CtaBand
        title={`${coach.displayName} ile tanış.`}
        description="Ücretsiz ön görüşmede hedefini anlat; sana özel yol haritanı dinle. Karar tamamen senin."
      />
    </div>
  );
}
