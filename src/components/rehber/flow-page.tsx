import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { AKISLAR } from "@/lib/rehber/akis";
import { Button } from "@/components/ui/button";
import {
  ActorLegend,
  FlowWalkthrough,
} from "@/components/rehber/flow-walkthrough";

/**
 * Akış sayfası — rehberin "sıra" tarafı.
 *
 * Rehber ekran ekran anlatır; burası kimin ne zaman devreye girdiğini ve
 * hangi adım olmadan sonrakinin çalışmadığını gösterir. İki rota da aynı
 * akışı basar: iş tek bir sistem, roller onun içinde yer değiştiriyor.
 */
export function FlowPage({ guideBase }: { guideBase: string }) {
  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        render={<Link href={guideBase} />}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        Rehbere dön
      </Button>

      <header className="flex flex-col gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-gold" />
          Akış
        </span>
        <h1 className="font-heading text-headline text-balance">
          Baştan sona nasıl işler
        </h1>
        <p className="max-w-prose text-sm text-pretty text-muted-foreground md:text-base">
          Rehber her ekranı tek tek anlatır. Burası sırayı anlatır: iş kimden
          başlar, hangi butona basılınca ne üretilir ve bir sonraki adımı kim
          devralır. Sarı kutular devir noktalarıdır — o adım yapılmadan akış
          ilerlemez.
        </p>
      </header>

      <ActorLegend />

      <nav
        aria-label="Akışlar"
        className="flex flex-wrap gap-1.5 rounded-2xl bg-card px-3 py-2.5 ring-1 ring-foreground/10"
      >
        {AKISLAR.map((f, i) => (
          <Button
            key={f.id}
            variant="ghost"
            size="xs"
            render={<Link href={`#akis-${f.id}`} />}
          >
            <span className="tabular-nums opacity-60">
              {String(i + 1).padStart(2, "0")}
            </span>
            {f.title}
          </Button>
        ))}
      </nav>

      <FlowWalkthrough flows={AKISLAR} guideBase={guideBase} />
    </div>
  );
}
