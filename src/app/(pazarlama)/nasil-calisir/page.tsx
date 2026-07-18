import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDaysIcon,
  CheckIcon,
  ClipboardListIcon,
  LineChartIcon,
  MessageCircleIcon,
  NotebookPenIcon,
  UsersIcon,
} from "lucide-react";

import { CtaBand } from "@/components/marketing/cta-band";
import { SectionHeading } from "@/components/brand/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Saf statik sayfa — D1 okumaz, prerender edilir.

export const metadata: Metadata = {
  title: "Nasıl Çalışır",
  description:
    "Derecenin Ruhu koçluk süreci: ücretsiz ön görüşme, sana özel haftalık program, soru takibi, deneme analizi ve haftalık birebir görüşmeler.",
};

const TIMELINE = [
  {
    icon: MessageCircleIcon,
    label: "1. hafta öncesi",
    title: "Ücretsiz ön görüşme",
    body:
      "20-30 dakikalık tanışma: hedefin, güncel netlerin, günlük düzenin. " +
      "Sana nasıl bir yol haritası çizeceğimizi somut olarak anlatırız — ödeme yükümlülüğü yoktur.",
  },
  {
    icon: ClipboardListIcon,
    label: "1. hafta",
    title: "Seviye tespiti ve ilk program",
    body:
      "Mevcut deneme sonuçların ve kaynakların incelenir; eksik konu haritan çıkarılır. " +
      "İlk haftalık programın gün gün, çıktı odaklı (soru sayısı, konu, deneme) hazırlanır.",
  },
  {
    icon: NotebookPenIcon,
    label: "Her gün",
    title: "Soru ve çalışma takibi",
    body:
      "Çözdüğün soruları ve denemelerini uygulamaya girersin (1 dakikanı alır). " +
      "Koçun tabloyu canlı görür; aksama olursa hafta bitmeden müdahale eder.",
  },
  {
    icon: CalendarDaysIcon,
    label: "Her hafta",
    title: "Birebir koçluk görüşmesi",
    body:
      "Haftanın verisi önümüzde: neler çalıştın, denemede ne oldu, nerede tıkandın? " +
      "Program bir sonraki haftaya göre birlikte revize edilir. Görüşmeler online yapılır.",
  },
  {
    icon: LineChartIcon,
    label: "Her deneme",
    title: "Deneme analizi",
    body:
      "Doğru/yanlış/boş dağılımı ve net gelişimi grafiğe işlenir; yanlışlar konu konu haritalanır. " +
      "Analizden çıkan eksikler doğrudan programına girer — döngü böyle kapanır.",
  },
  {
    icon: UsersIcon,
    label: "Düzenli",
    title: "Veli bilgilendirmesi",
    body:
      "LGS ve YKS öğrencilerinde veli, süreci somut verilerle (net grafiği, çalışma takibi) düzenli olarak öğrenir. " +
      "Kimse karanlıkta kalmaz.",
  },
] as const;

const INCLUDED = [
  "Haftalık birebir koçluk görüşmesi",
  "Gün gün, çıktı odaklı haftalık program",
  "Soru sayısı ve deneme takibi (uygulama)",
  "Konu bazlı eksik haritası",
  "Deneme analizi ve net gelişim grafiği",
  "WhatsApp'tan koçuna doğrudan erişim",
  "Veli bilgilendirmesi (LGS/YKS)",
  "Kaynak ve yayın önerileri",
] as const;

export default function NasilCalisirPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-10 sm:px-6 md:gap-20 md:py-16">
      <section className="relative flex flex-col items-start gap-5">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/3 h-64 w-[min(30rem,90vw)] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-gold" />
          Yöntem
        </span>
        <h1 className="font-heading text-headline max-w-2xl text-balance">
          Koçluk motivasyon konuşması değildir;{" "}
          <span className="text-primary">ölçülen bir süreçtir</span>
          <span className="text-gold">.</span>
        </h1>
        <p className="max-w-2xl text-base text-pretty text-muted-foreground md:text-lg">
          Derecenin Ruhu&apos;nda her hafta aynı döngü işler: planla → çalış ve
          kaydet → deneme çöz → analiz et → programı güncelle. Net artışı bu
          döngünün doğal sonucudur.
        </p>
      </section>

      {/* Zaman çizgisi */}
      <section className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Süreç"
          title="Adım adım koçluk döngüsü"
        />
        <ol className="relative flex flex-col gap-6 border-l border-border pl-6 md:gap-8">
          {TIMELINE.map((step) => (
            <li key={step.title} className="relative flex flex-col gap-2">
              <span className="absolute top-1 -left-[31px] flex size-3 items-center justify-center rounded-full bg-primary ring-4 ring-background" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="size-4" />
                </span>
                <Badge variant="secondary">{step.label}</Badge>
                <h3 className="font-heading text-base font-semibold">
                  {step.title}
                </h3>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-pretty text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Neler dahil */}
      <section className="grid gap-8 rounded-3xl bg-card p-6 ring-1 ring-foreground/10 sm:p-8 lg:grid-cols-[1fr_1.2fr]">
        <SectionHeading
          eyebrow="Kapsam"
          title="Koçluğa neler dahil?"
          description="Paket ne olursa olsun sürecin omurgası aynıdır."
        />
        <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {INCLUDED.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-success" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col items-center gap-4 text-center">
        <p className="max-w-xl text-sm text-pretty text-muted-foreground">
          Paketleri ve fiyatları merak mı ediyorsun?
        </p>
        <Button variant="outline" render={<Link href="/fiyatlar" />}>
          Fiyatları gör
        </Button>
      </section>

      <CtaBand />
    </div>
  );
}
