import Link from "next/link";
import { RouteIcon } from "lucide-react";

import { buildIndex } from "@/lib/rehber/search";
import type { Guide } from "@/lib/rehber/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GuideControls } from "@/components/rehber/guide-controls";
import { GuideSection } from "@/components/rehber/guide-section";
import { RehberProgressProvider } from "@/components/rehber/progress-context";

type Variant = "ogrenci" | "koc";

/**
 * Kabuğa göre yapışkan konum, çapa boşluğu ve yatay taşma.
 * `gutter` her kabuğun kendi `main` dolgusuyla birebir eşleşmeli —
 * öğrenci `px-4`, koç `px-4 sm:px-6`.
 */
const SHELL = {
  // Öğrenci başlığı h-13 (52px); üstüne arama şeridi biner.
  ogrenci: {
    sticky: "top-13",
    scrollMt: "scroll-mt-32",
    gutter: "-mx-4 px-4",
    sidebar: false,
  },
  // Koç başlığı h-14 + gezinme h-12 = 6.5rem (104px).
  koc: {
    sticky: "top-26",
    scrollMt: "scroll-mt-44 lg:scroll-mt-28",
    gutter: "-mx-4 px-4 sm:-mx-6 sm:px-6",
    sidebar: true,
  },
} as const satisfies Record<Variant, unknown>;

/**
 * Rehber sayfa iskeleti. Bölüm gövdeleri sunucuda basılır; arama, bölüm
 * listesi ve okuma ilerlemesi tek bir istemci adasında yaşar.
 */
export function GuidePage({
  guide,
  variant,
  storageKey,
  intro,
  flowHref,
}: {
  /** Akış (baştan sona sıra) sayfasının adresi. */
  flowHref?: string;
  guide: Guide;
  variant: Variant;
  /** localStorage anahtarı — rehberler ayrı ilerleme tutar. */
  storageKey: string;
  /** Başlığın altına eklenecek isteğe bağlı içerik (ör. yönetici rehberi kartı). */
  intro?: React.ReactNode;
}) {
  const shell = SHELL[variant];
  const index = buildIndex(guide.sections);

  return (
    <RehberProgressProvider storageKey={storageKey}>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            <span aria-hidden className="size-1.5 rounded-full bg-gold" />
            Rehber
          </span>
          <h1 className="font-heading text-headline text-balance">
            {guide.title}
          </h1>
          <p className="max-w-prose text-sm text-pretty text-muted-foreground md:text-base">
            {guide.description}
          </p>
          {flowHref && (
            <Button
              variant="outline"
              size="sm"
              className="mt-1 w-fit"
              render={<Link href={flowHref} />}
            >
              <RouteIcon data-icon="inline-start" />
              Baştan sona nasıl işler
            </Button>
          )}
        </header>

        {intro}

        <div
          className={cn(
            shell.sidebar &&
              "lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-10",
          )}
        >
          <GuideControls
            index={index}
            sidebar={shell.sidebar}
            stickyClass={shell.sticky}
            gutterClass={shell.gutter}
          />

          <div className="flex min-w-0 flex-col gap-12 pt-6 md:gap-14">
            {guide.sections.map((section) => (
              <GuideSection
                key={section.id}
                section={section}
                scrollMtClass={shell.scrollMt}
              />
            ))}
          </div>
        </div>
      </div>
    </RehberProgressProvider>
  );
}
