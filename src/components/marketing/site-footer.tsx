import Link from "next/link";
import { ExternalLinkIcon, MapPinIcon, StarIcon } from "lucide-react";

import { coachStats } from "@/db/seed/cms-content";
import { Logo } from "@/components/brand/logo";
import {
  SocialIconRow,
  type SocialUrls,
} from "@/components/brand/social-icons";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Koçluk",
    links: [
      { href: "/yks-koclugu", label: "YKS Koçluğu" },
      { href: "/lgs-koclugu", label: "LGS Koçluğu" },
      { href: "/kpss-koclugu", label: "KPSS Koçluğu" },
      { href: "/sayac", label: "Sınav Sayacı" },
    ],
  },
  {
    title: "Keşfet",
    links: [
      { href: "/nasil-calisir", label: "Nasıl Çalışır" },
      { href: "/koclar", label: "Koçlar" },
      { href: "/hakkinda", label: "Hakkında" },
      { href: "/fiyatlar", label: "Fiyatlar" },
    ],
  },
  {
    title: "Ücretsiz",
    links: [
      { href: "/kaynaklar", label: "Kaynaklar" },
      { href: "/araclar/net-hesaplama", label: "Net Hesaplama" },
      { href: "/sayac", label: "Sınav Sayacı" },
      { href: "/blog", label: "Blog" },
      { href: "/basarilar", label: "Başarı Hikayeleri" },
      { href: "/sss", label: "Sıkça Sorulan Sorular" },
    ],
  },
  {
    title: "Başla",
    links: [
      { href: "/iletisim", label: "Ücretsiz Ön Görüşme" },
      { href: "/bekleme-listesi", label: "Bekleme Listesi" },
      { href: "/koc-basvuru", label: "Koç Başvurusu" },
      { href: "/giris", label: "Öğrenci / Koç Girişi" },
    ],
  },
];

/** Pazarlama sitesi alt bilgisi. */
export function SiteFooter({ social }: { social: SocialUrls }) {
  return (
    <footer className="border-t bg-card/50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 md:py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="flex flex-col items-start gap-3">
            <Logo size={28} />
            <p className="max-w-xs text-sm text-pretty text-muted-foreground">
              LGS, YKS ve KPSS için birebir koçluk: haftalık program, soru
              takibi ve deneme analiziyle görünür net artışı.
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <StarIcon className="size-4 fill-gold text-gold" />
              5,0 · {coachStats.reviewCount} yorum
              <a
                href={coachStats.proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                Gigbi&apos;de doğrula
                <ExternalLinkIcon className="size-3.5" />
              </a>
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPinIcon className="size-3.5" />
              Kartal, İstanbul — görüşmeler online
            </span>
            <div className="flex flex-col gap-1 pt-1">
              <span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Bizi takip et
              </span>
              <SocialIconRow urls={social} className="-ml-2.5" />
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {col.title}
              </span>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/80 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Derecenin Ruhu · Tüm hakları saklıdır.
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            Netlerini artır, <span className="text-primary">hedefine ulaş</span>
            <span className="text-gold">.</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
