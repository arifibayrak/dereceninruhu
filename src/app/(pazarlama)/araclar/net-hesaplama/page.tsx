import Link from "next/link";
import { ArrowUpRightIcon, InfoIcon } from "lucide-react";

import { getCalculatorExams } from "@/db/queries/cms";
import { CtaBand } from "@/components/marketing/cta-band";
import { NetCalculator } from "@/components/marketing/net-calculator";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/schema";

// Sınav yapısı D1'den okunur → istek başına render.
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Net Hesaplama — YKS, LGS ve KPSS",
  description:
    "Ücretsiz net hesaplama aracı: doğru ve yanlış sayılarını gir, ders ders ve toplam netini anında gör. YKS (TYT-AYT), LGS ve KPSS için resmî yanlış katsayılarıyla hesaplar.",
  path: "/araclar/net-hesaplama",
});

export default async function NetHesaplamaPage() {
  const exams = await getCalculatorExams();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10 sm:px-6 md:py-16">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Ana Sayfa", path: "/" },
          { name: "Ücretsiz Kaynaklar", path: "/kaynaklar" },
          { name: "Net Hesaplama", path: "/araclar/net-hesaplama" },
        ])}
      />

      <section className="flex flex-col gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-gold" />
          Ücretsiz araç
        </span>
        <h1 className="font-heading text-headline text-balance">
          Net hesaplama
        </h1>
        <p className="text-base text-pretty text-muted-foreground">
          Doğru ve yanlış sayılarını gir; ders ders ve toplam netini anında
          gör. Net = doğru − yanlış ÷ katsayı. Katsayı LGS&apos;de 3,
          YKS ve KPSS&apos;de 4&apos;tür.
        </p>
      </section>

      {exams.length > 0 ? (
        <NetCalculator exams={exams} />
      ) : (
        <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
          Sınav yapısı yüklenemedi. Birazdan tekrar dener misin?
        </p>
      )}

      {/*
        Dürüstlük notu: puan/sıralama tahmini bilerek yapılmıyor. Yerleştirme
        puanı ÖSYM'nin o yılki TÜM adaylar üzerinden hesapladığı standart
        puanlara dayanır; istemcide üretilen bir "tahmini puan" uydurma sayı
        olurdu. Öğrenciyi resmî kaynağa yönlendiriyoruz.
      */}
      <div className="flex items-start gap-3 rounded-xl bg-info/10 p-4 text-sm text-pretty text-muted-foreground">
        <InfoIcon className="mt-0.5 size-4 shrink-0 text-info" />
        <span>
          <strong className="text-foreground">
            Neden puan ve sıralama tahmini yok?
          </strong>{" "}
          Yerleştirme puanı, netlerin o yıl sınava giren tüm adaylara göre
          standartlaştırılmasıyla bulunur — yani puanın, senin netin kadar
          başkalarının netine de bağlıdır. Sınav öncesi hesaplanan &ldquo;tahmini
          puan&rdquo; rakamları bu yüzden gerçeği tutmaz. Doğru sıralama bilgisi
          için{" "}
          <a
            href="https://yokatlas.yok.gov.tr/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
          >
            YÖK Atlas
            <ArrowUpRightIcon className="size-3.5" />
          </a>{" "}
          ve ÖSYM&apos;nin resmî sonuç açıklamalarını kullan.
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        Netini düzenli takip etmek istersen{" "}
        <Link href="/kaynaklar" className="font-medium text-primary hover:underline">
          diğer ücretsiz kaynaklarımıza
        </Link>{" "}
        da göz at.
      </p>

      <CtaBand
        title="Netin arttı mı, artmadı mı — emin misin?"
        description="Koçlukta her denemenin neti kaydedilir, grafikte görünür ve konu konu analiz edilir. Tahmin yok, ölçüm var."
      />
    </div>
  );
}
