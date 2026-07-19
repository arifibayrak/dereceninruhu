import { getPublicTestimonials } from "@/db/queries/cms";
import { coachStats } from "@/db/seed/cms-content";
import { CtaBand } from "@/components/marketing/cta-band";
import { ProofStrip } from "@/components/marketing/proof-strip";
import { TestimonialCard } from "@/components/brand/testimonial-card";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbSchema, reviewsSchema, serviceSchema } from "@/lib/schema";

// Yorumlar D1'den okunur → istek başına render.
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Başarı Hikayeleri",
  description:
    "Derecenin Ruhu öğrencilerinin ve velilerinin gerçek yorumları — Gigbi üzerinde 5,0 yıldız ortalama, 77 yorum.",
  path: "/basarilar",
});

export default async function BasarilarPage() {
  const testimonials = await getPublicTestimonials();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-10 sm:px-6 md:gap-16 md:py-16">
      {/* Yapısal veri: puanlı hizmet + görünen yorumlar (Review — politika uyumlu). */}
      <JsonLd
        data={[
          serviceSchema({ withRating: true }),
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
