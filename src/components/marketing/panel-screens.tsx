import { SectionHeading } from "@/components/brand/section-heading";

/**
 * "Panelin içinden" — gerçek koç panelinden ekran görüntüleri.
 *
 * Bilerek SUNUCU bileşeni ve JS'siz: yatay kaydırma CSS scroll-snap ile.
 * Görseller ekranın altında kaldığı için `loading="lazy"` — LCP'ye dokunmaz
 * (bkz. AGENTS.md "Performance"). Dosyalar `public/ekran/` altında, 800 ve
 * 1280 genişlikte WebP; adlar sabit, önbellek kuralı `public/_headers`'ta.
 *
 * Görüntülerde öğrenci adı yok. Metinler ekranda görüneni anlatır, fazlasını
 * değil: otomatik içgörüler deterministik kurallardır, AI diye etiketlenmez.
 */
const SCREENS = [
  {
    slug: "program-haftalik",
    title: "Haftalık program",
    body: "Gün gün görevler. Öğrenci yaptıkça işaretler, koç aynı ekrandan izler.",
  },
  {
    slug: "konu-kaynak",
    title: "Konu × kaynak takibi",
    body: "Her konunun hangi kaynakta bittiği tek tabloda.",
  },
  {
    slug: "denemeler",
    title: "Denemeler",
    body: "Her deneme için süre, soru başına tempo, net ve analiz durumu.",
  },
  {
    slug: "ogrenci-ozeti",
    title: "Öğrenci özeti",
    body: "Toplam soru, çalışma süresi, son net ve net gelişimi bir bakışta.",
  },
  {
    slug: "ders-ders-soru",
    title: "Ders ders soru",
    body: "Son 8 haftada hangi dersten kaç soru çözüldüğü.",
  },
  {
    slug: "calisma-suresi",
    title: "Çalışma süresi",
    body: "Kronometre ve elle girilen süreler, hafta hafta.",
  },
  {
    slug: "kaynaklar",
    title: "Kaynak kütüphanesi",
    body: "Öğrencinin kullandığı kitaplar ve testler, ders ders.",
  },
] as const;

export function PanelScreens() {
  return (
    <section className="flex flex-col gap-8">
      <SectionHeading
        eyebrow="Panelin içinden"
        title="Koçunun her hafta baktığı ekran"
        description="Aşağıdakiler gerçek koç panelinden ekran görüntüleri. Takip bir söz değil, her gün dolan bir kayıt."
        align="center"
      />
      <ul
        aria-label="Koç paneli ekran görüntüleri"
        className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:thin]"
      >
        {SCREENS.map((s) => (
          <li
            key={s.slug}
            className="w-[86%] shrink-0 snap-center sm:w-[70%] lg:w-[46%]"
          >
            <figure className="flex flex-col gap-3">
              {/* Ekran görüntüleri yoğun: dokununca tam boyutu açılır. */}
              <a
                href={`/ekran/${s.slug}-1280.webp`}
                target="_blank"
                rel="noopener"
                aria-label={`${s.title} ekranını büyük aç`}
                className="block overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 transition-shadow hover:ring-primary/30"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- statik, önceden boyutlanmış WebP; next/image optimizasyonu Workers'ta ek tur demek */}
                <img
                  src={`/ekran/${s.slug}-800.webp`}
                  srcSet={`/ekran/${s.slug}-800.webp 800w, /ekran/${s.slug}-1280.webp 1280w`}
                  sizes="(min-width: 1024px) 560px, (min-width: 640px) 70vw, 86vw"
                  width={1280}
                  height={730}
                  loading="lazy"
                  decoding="async"
                  alt={`${s.title} ekranı — ${s.body}`}
                  className="h-auto w-full"
                />
              </a>
              <figcaption className="flex flex-col gap-0.5 px-1">
                <span className="font-heading text-sm font-semibold">{s.title}</span>
                <span className="text-sm text-pretty text-muted-foreground">{s.body}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
