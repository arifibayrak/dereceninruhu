import Link from "next/link";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckIcon,
  ClipboardListIcon,
  LineChartIcon,
  MessageCircleIcon,
  NotebookPenIcon,
  RotateCwIcon,
  UsersIcon,
} from "lucide-react";

import { COACHING_INCLUDES } from "@/lib/coaching-includes";
import { CtaBand } from "@/components/marketing/cta-band";
import { SectionHeading } from "@/components/brand/section-heading";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/schema";

// Saf statik sayfa — D1 okumaz, prerender edilir.

export const metadata = buildMetadata({
  title: "Nasıl Çalışır",
  description:
    "Derecenin Ruhu koçluk süreci: ücretsiz ön görüşme, sana özel haftalık program, soru takibi, deneme analizi ve haftalık birebir görüşmeler.",
  path: "/nasil-calisir",
});

/**
 * Süreç adımları. Her adımın `output`'u var: o adım bittiğinde elinde TAM
 * OLARAK ne olduğu. Geri bildirim (Görsel 13) rakiplerin daha detaylı
 * anlattığını söylüyordu — derinliği somut çıktı vererek veriyoruz, sıfatla
 * değil (bkz. AGENTS.md, sakin ve kanıtlı ton).
 */
const TIMELINE = [
  {
    icon: MessageCircleIcon,
    label: "1. hafta öncesi",
    title: "Ücretsiz ön görüşme",
    body:
      "20-30 dakikalık tanışma: hedefin, güncel netlerin, günlük düzenin. " +
      "Sana nasıl bir yol haritası çizeceğimizi somut olarak anlatırız — ödeme yükümlülüğü yoktur.",
    output:
      "Hedefine karşılık gelen net aralığı ve ilk ayda neye odaklanacağın.",
  },
  {
    icon: ClipboardListIcon,
    label: "1. hafta",
    title: "Seviye tespiti ve ilk program",
    body:
      "Mevcut deneme sonuçların ve kaynakların incelenir; eksik konu haritan çıkarılır. " +
      "İlk haftalık programın gün gün, çıktı odaklı (soru sayısı, konu, deneme) hazırlanır.",
    output:
      "Konu konu eksik haritan, kaynak listen ve ilk haftanın gün gün görev listesi.",
  },
  {
    icon: NotebookPenIcon,
    label: "Her gün",
    title: "Soru ve çalışma takibi",
    body:
      "Çözdüğün soruları uygulamaya girersin — istersen sadece toplam, istersen doğru/yanlış/boş ayrımıyla. " +
      "Kırılımı girdiğinde netin ve ders bazlı doğruluk yüzden otomatik hesaplanır. Koçun aynı tabloyu canlı görür.",
    output:
      "Hangi hafta hangi dersten kaç soru çözdüğünü gösteren tablo ve ders bazlı doğruluk yüzden.",
  },
  {
    icon: CalendarDaysIcon,
    label: "Her hafta",
    title: "Birebir koçluk görüşmesi",
    body:
      "Haftanın verisi önümüzde: neler çalıştın, denemede ne oldu, nerede tıkandın? " +
      "Program bir sonraki haftaya göre birlikte revize edilir. Görüşmeler online yapılır.",
    output:
      "Güncellenmiş haftalık program ve görüşmede konuşulanların yazılı özeti.",
  },
  {
    icon: LineChartIcon,
    label: "Her deneme",
    title: "Deneme analizi",
    body:
      "Doğru/yanlış/boş dağılımı ve net gelişimi grafiğe işlenir; yanlışlar konu konu haritalanır. " +
      "Analizden çıkan eksikler doğrudan programına girer — döngü böyle kapanır.",
    output:
      "Net gelişim grafiğinde yeni bir nokta ve o denemeden çıkan eksik konuların programına eklenmiş hâli.",
  },
  {
    icon: UsersIcon,
    label: "Düzenli",
    title: "Veli bilgilendirmesi",
    body:
      "LGS ve YKS öğrencilerinde veli, süreci somut verilerle (net grafiği, çalışma takibi) düzenli olarak öğrenir. " +
      "Kimse karanlıkta kalmaz.",
    output:
      "Velinin elindeki tahmin değil, çocuğunun gerçek soru ve net verisi.",
  },
] as const;

/** Hero'daki döngünün görselleştirilmiş hâli. */
const CYCLE = [
  "Planla",
  "Çalış ve kaydet",
  "Deneme çöz",
  "Analiz et",
  "Programı güncelle",
] as const;

export default function NasilCalisirPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-10 sm:px-6 md:gap-20 md:py-16">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Ana Sayfa", path: "/" },
          { name: "Nasıl Çalışır", path: "/nasil-calisir" },
        ])}
      />
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
          Derecenin Ruhu&apos;nda her hafta aynı döngü işler. Net artışı bu
          döngünün doğal sonucudur.
        </p>

        {/* Haftalık döngü — metinde geçen adımların görünür hâli. */}
        <ol className="flex w-full flex-wrap items-center gap-x-2 gap-y-2 pt-1">
          {CYCLE.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-card px-3.5 py-1.5 text-sm font-medium ring-1 ring-foreground/10">
                <span className="font-heading text-xs text-primary tabular-nums">
                  {i + 1}
                </span>
                {step}
              </span>
              {i < CYCLE.length - 1 && (
                <ArrowRightIcon
                  className="size-4 shrink-0 text-muted-foreground/50"
                  aria-hidden
                />
              )}
            </li>
          ))}
          <li aria-hidden className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RotateCwIcon className="size-3.5" />
            baştan
          </li>
        </ol>
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
              {/* Somut çıktı — "bu adım bitince elimde ne olacak?" */}
              <p className="max-w-2xl rounded-lg bg-success/8 px-3 py-2 text-sm text-pretty text-foreground/85">
                <span className="font-medium">Çıktı: </span>
                {step.output}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/*
        Kapsam listesi /fiyatlar ile AYNI kaynaktan (`COACHING_INCLUDES`) gelir
        — iki sayfanın birbirinden kayması en kolay tutarsızlık kaynağıydı.
      */}
      <section className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Kapsam"
          title="Koçluğa neler dahil?"
          description="Paket ne olursa olsun sürecin omurgası aynıdır."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COACHING_INCLUDES.map((group) => (
            <div
              key={group.title}
              className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10"
            >
              <h3 className="font-heading text-sm font-semibold tracking-wide uppercase">
                {group.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-success" />
                    <span className="text-pretty">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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
