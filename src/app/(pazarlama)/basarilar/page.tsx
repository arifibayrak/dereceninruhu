import {
  getFeaturedAchievements,
  getPublicImpactStats,
  getPublicTestimonials,
  getSiteSettings,
} from "@/db/queries/cms";
import { coachStats } from "@/db/seed/cms-content";
import { CtaBand } from "@/components/marketing/cta-band";
import { ProofStrip } from "@/components/marketing/proof-strip";
import { AchievementCard } from "@/components/brand/achievement-card";
import { TestimonialCard } from "@/components/brand/testimonial-card";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { formatDelta, formatInt } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";
import {
  breadcrumbSchema,
  coachingCourseSchema,
  reviewsSchema,
  serviceSchema,
} from "@/lib/schema";

// Yorumlar D1'den okunur → istek başına render.
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Başarı Hikayeleri",
  description:
    "Derecenin Ruhu öğrencilerinin ve velilerinin gerçek yorumları — Gigbi üzerinde 5,0 yıldız ortalama, 77 yorum.",
  path: "/basarilar",
});

/** Şeffaflık sayaç karosu — sunucu bileşeni, etkileşim yok. */
function ImpactTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="font-heading text-3xl font-bold text-primary tabular-nums">
        {value}
      </dd>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}

export default async function BasarilarPage() {
  const [testimonials, achievements, site] = await Promise.all([
    getPublicTestimonials(),
    getFeaturedAchievements(),
    getSiteSettings(),
  ]);
  // Sayaçlar admin şalterine bağlı; kapalıyken hiç sorgulanmaz.
  const stats = site.publicStatsVisible ? await getPublicImpactStats() : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-10 sm:px-6 md:gap-16 md:py-16">
      {/* Yapısal veri: hizmet + puanlı program + görünen yorumlar (Review —
          politika uyumlu). Puan ve itemReviewed Course üzerinedir; aynı `@id`
          yorumları programa bağlar (bkz. @/lib/schema dosya başı notu). */}
      <JsonLd
        data={[
          serviceSchema(),
          coachingCourseSchema({ withRating: true }),
          ...reviewsSchema(testimonials),
          breadcrumbSchema([
            { name: "Ana Sayfa", path: "/" },
            { name: "Başarı Hikayeleri", path: "/basarilar" },
          ]),
        ]}
      />
      <section className="relative flex flex-col items-center gap-4 text-center">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 h-64 w-[min(32rem,90vw)] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute top-6 right-[15%] size-32 rounded-full bg-gold/15 blur-2xl" />
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-gold" />
          Sosyal kanıt
        </span>
        <h1 className="font-heading text-headline max-w-2xl text-balance">
          Bir <span className="text-primary">sevgi duvarı</span>
          <span className="text-gold">.</span>
        </h1>
        <p className="max-w-xl text-base text-pretty text-muted-foreground">
          Hepsi gerçek öğrenci ve veli yorumu; Gigbi üzerinden doğrulanabilir.
          Gizlilik için ad + soyadın ilk harfi kullanılır.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
          <Badge variant="secondary">KPSS</Badge>
          <Badge variant="secondary">YKS</Badge>
          <Badge variant="secondary">LGS</Badge>
          <Badge className="bg-gold text-gold-foreground">
            5,0★ · {coachStats.reviewCount} yorum
          </Badge>
        </div>
      </section>

      <ProofStrip />

      {/*
        Şeffaf sayaçlar. YALNIZCA toplam soru/deneme ve net artışının medyanı
        yayınlanır — gerçek aktif öğrenci sayısı ya da ondan türetilebilecek
        bir metrik ASLA public HTML'e girmez (bkz. AGENTS.md).
      */}
      {stats && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
              Şeffaflık
            </span>
            <h2 className="font-heading text-title text-balance">
              Rakamlar sistemin içinden
            </h2>
            <p className="max-w-xl text-sm text-pretty text-muted-foreground">
              Bu sayılar pazarlama metni değil; öğrencilerimizin uygulamaya
              girdiği gerçek takip verisinden canlı olarak hesaplanır.
            </p>
          </div>
          <dl className="grid gap-3 sm:grid-cols-3">
            <ImpactTile
              label="Çözülen soru"
              value={formatInt(stats.totalQuestions)}
              hint="öğrencilerimizin toplam soru takibi"
            />
            <ImpactTile
              label="Girilen deneme"
              value={formatInt(stats.totalMocks)}
              hint="net ve konu analiziyle birlikte"
            />
            <ImpactTile
              label="Net artışı"
              value={
                stats.medianNetGain !== null
                  ? formatDelta(stats.medianNetGain)
                  : "—"
              }
              hint="ilk denemeden sonuncuya, medyan"
            />
          </dl>
        </section>
      )}

      {/* Derece vitrini — izin (consentAt) olmayan hiçbir satır buraya gelmez */}
      {achievements.length > 0 && (
        <section className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
              Başarılarımız
            </span>
            <h2 className="font-heading text-title text-balance">
              Derece yapan <span className="text-primary">öğrencilerimiz</span>
              <span className="text-gold">.</span>
            </h2>
            <p className="max-w-xl text-sm text-pretty text-muted-foreground">
              Sonuç belgeleri öğrencilerimizin kendi izniyle paylaşılmıştır.
              Belgeye dokunarak büyütebilirsin.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((a) => (
              <AchievementCard key={`${a.displayName}-${a.result}`} item={a} />
            ))}
          </div>
        </section>
      )}

      {/* Sevgi duvarı — CSS columns ile masonry hissi */}
      <section className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
        {testimonials.map((t) => (
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
      </section>

      <p className="text-center text-sm text-muted-foreground">
        Ve {Math.max(coachStats.reviewCount - testimonials.length, 0)}&apos;den
        fazla yorum daha — tamamı Gigbi profilinde.
      </p>

      <CtaBand
        title="Sıradaki hikaye seninki olsun."
        description="Ücretsiz ön görüşmeyle başla; birkaç ay sonra bu duvara senin cümlen eklensin."
      />
    </div>
  );
}
