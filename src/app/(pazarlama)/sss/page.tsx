import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircleIcon } from "lucide-react";

import { getPublicFaqs } from "@/db/queries/cms";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { Button } from "@/components/ui/button";

// SSS D1'den okunur → istek başına render.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular",
  description:
    "Derecenin Ruhu koçluk süreci, görüşmeler, deneme analizi, veli bilgilendirmesi ve ödeme hakkında sık sorulan sorular.",
};

export default async function SssPage() {
  const faqs = await getPublicFaqs();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-4 py-10 sm:px-6 md:gap-16 md:py-16">
      <section className="relative flex flex-col items-center gap-4 text-center">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 h-64 w-[min(28rem,90vw)] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-gold" />
          SSS
        </span>
        <h1 className="font-heading text-headline text-balance">
          Sıkça sorulan sorular
        </h1>
        <p className="max-w-lg text-base text-pretty text-muted-foreground">
          Cevabını bulamadığın bir soru mu var? Ön görüşme zaten ücretsiz —
          doğrudan sorabilirsin.
        </p>
      </section>

      <FaqAccordion items={faqs} />

      <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 text-center ring-1 ring-foreground/10">
        <MessageCircleIcon className="size-6 text-primary" />
        <p className="text-sm font-medium">Sorun burada yok mu?</p>
        <p className="max-w-md text-sm text-pretty text-muted-foreground">
          Formu doldur, sorunu yaz — genellikle aynı gün WhatsApp&apos;tan dönüş
          yapıyoruz.
        </p>
        <Button render={<Link href="/iletisim" />}>Soru sor / ön görüşme iste</Button>
      </div>

      <CtaBand />
    </div>
  );
}
