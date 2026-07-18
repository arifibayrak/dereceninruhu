import Link from "next/link";
import { SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Kapanış CTA bandı — koyu çivit degrade zemin, altın kıvılcım.
 * Her pazarlama sayfasının sonunda kullanılabilir.
 */
export function CtaBand({
  title = "Hedefine giden yolu birlikte çizelim.",
  description = "20-30 dakikalık ücretsiz ön görüşmede hedefini ve seviyeni konuşalım; sana özel yol haritanı çıkaralım. Ödeme yükümlülüğü yok.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl bg-[#38207b] px-6 py-10 text-center ring-1 ring-foreground/10 sm:px-10 md:py-14 dark:bg-[#241452]",
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-56 w-[32rem] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-10 -bottom-16 size-48 rounded-full bg-gold/25 blur-3xl" />
      </div>
      <div className="relative mx-auto flex max-w-xl flex-col items-center gap-4">
        <h2 className="font-heading text-headline text-balance text-white">
          {title}
        </h2>
        <p className="text-sm text-pretty text-white/75 md:text-base">
          {description}
        </p>
        <Button
          size="lg"
          className="mt-1 bg-gold text-gold-foreground hover:bg-gold/85"
          render={<Link href="/iletisim" />}
        >
          <SparklesIcon data-icon="inline-start" />
          Ücretsiz Ön Görüşme Planla
        </Button>
        <span className="text-xs text-white/60">
          Genellikle aynı gün içinde dönüş yapıyoruz.
        </span>
      </div>
    </section>
  );
}
