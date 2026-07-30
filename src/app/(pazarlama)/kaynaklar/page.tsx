import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";

import { getPublicResourceLinks } from "@/db/queries/cms";
import {
  CATEGORY_META,
  RESOURCE_CATEGORIES,
  type ResourceCategory,
} from "@/db/seed/resource-links";
import { CtaBand } from "@/components/marketing/cta-band";
import { SectionHeading } from "@/components/brand/section-heading";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/schema";

// Kaynaklar D1'den okunur → istek başına render.
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Ücretsiz Kaynaklar — Çıkmış Sorular, OGM Materyal, Ders Notları",
  description:
    "YKS, LGS ve KPSS için ücretsiz kaynaklar: ÖSYM çıkmış sorular, OGM Materyal ve MEBİ denemeleri, ders notları, YÖK Atlas ve net hesaplama aracı. Tamamı resmî kaynaklara doğrudan bağlantı.",
  path: "/kaynaklar",
});

/** Dahili (kendi aracımız) mı yoksa dış bağlantı mı? */
const isInternal = (url: string) => url.startsWith("/");

export default async function KaynaklarPage() {
  const links = await getPublicResourceLinks();

  // Kategori sırası sabitten gelir; boş kategoriler hiç render edilmez.
  const grouped = RESOURCE_CATEGORIES.map((category) => ({
    category,
    meta: CATEGORY_META[category],
    items: links.filter((l) => l.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-10 sm:px-6 md:gap-16 md:py-16">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Ana Sayfa", path: "/" },
          { name: "Ücretsiz Kaynaklar", path: "/kaynaklar" },
        ])}
      />

      <section className="relative flex flex-col items-center gap-4 text-center">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 h-64 w-[min(32rem,90vw)] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute top-6 right-[15%] size-32 rounded-full bg-gold/15 blur-2xl" />
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-gold" />
          Ücretsiz
        </span>
        <h1 className="font-heading text-headline max-w-2xl text-balance">
          Sana lazım olan her <span className="text-primary">kaynak</span>
          <span className="text-gold">.</span>
        </h1>
        <p className="max-w-xl text-base text-pretty text-muted-foreground">
          Çıkmış sorular, MEB&apos;in ücretsiz platformları, ders notları ve
          tercih araçları — hepsi tek sayfada, resmî kaynağına doğrudan bağlantı
          ile. Koçluk öğrencimiz olman gerekmiyor.
        </p>
      </section>

      {grouped.map(({ category, meta, items }) => (
        <section key={category} className="flex flex-col gap-5">
          <SectionHeading
            title={meta.label}
            description={meta.description}
            align="center"
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <li key={`${item.category}-${item.url}`}>
                <ResourceCard item={item} category={category} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="text-center text-xs text-muted-foreground">
        Bağlantılar MEB, ÖSYM ve YÖK&apos;ün resmî sayfalarına gider; içerikler
        bu kurumlara aittir. Kırık bir bağlantı görürsen bize yazman yeterli.
      </p>

      <CtaBand
        title="Kaynak çok, peki hangisi sana lazım?"
        description="Ücretsiz ön görüşmede seviyene ve hedefine göre hangi kaynağı ne zaman kullanacağını birlikte planlayalım."
      />
    </div>
  );
}

function ResourceCard({
  item,
  category,
}: {
  item: Awaited<ReturnType<typeof getPublicResourceLinks>>[number];
  category: ResourceCategory;
}) {
  const internal = isInternal(item.url);
  const className =
    "group flex h-full flex-col gap-2 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 transition-colors hover:ring-primary/40";

  const body = (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {item.provider && (
          <Badge variant="secondary" className="font-medium">
            {item.provider}
          </Badge>
        )}
        {item.examCode && <Badge variant="outline">{item.examCode}</Badge>}
        {item.isFeatured && (
          <Badge className="bg-gold text-gold-foreground">Öne çıkan</Badge>
        )}
      </div>
      <span className="flex items-start gap-1.5 font-heading text-base font-semibold text-balance">
        {item.title}
        <ArrowUpRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
      </span>
      {item.description && (
        <span className="text-sm text-pretty text-muted-foreground">
          {item.description}
        </span>
      )}
      {!internal && (
        <span className="mt-auto pt-2 text-[11px] text-muted-foreground/70">
          {category === "arac" ? "" : "Yeni sekmede açılır"}
        </span>
      )}
    </>
  );

  // Dahili araçlarımız Link ile (prefetch); dış kaynaklar yeni sekmede.
  return internal ? (
    <Link href={item.url} className={className}>
      {body}
    </Link>
  ) : (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {body}
    </a>
  );
}
