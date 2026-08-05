import type { Metadata, Viewport } from "next";
// Self-hosted (bundled woff2, no Google fetch) — works offline & on Workers.
// Geist includes latin-ext, covering Turkish glyphs (ğ ş ı İ ö ü ç).
import { GeistSans } from "geist/font/sans";
// ⚠️ GeistMono BİLEREK burada DEĞİL. Kök layout'ta olduğunda Next onu her rotanın
// font manifestine yazıyor ve tarayıcı 70KB'lık woff2'yi TEK BİR monospace metin
// içermeyen pazarlama sayfalarında bile "High" öncelikle indiriyordu — CSS
// paketinden bile büyük, tam da LCP penceresinde. `font-mono` yalnız uygulama
// yüzeylerinde (/koc, /ogrenci, /marka) kullanılıyor; font da oralarda yükleniyor.
// Başlık yüzü: Bricolage Grotesque — @font-face'leri globals.css'te, dosyaları
// public/fonts/ altında (SABİT yol; aşağıda preload edilebilsin diye).
import "./globals.css";

import { GoogleAnalytics } from "@/components/app/google-analytics";
import {
  GoogleTagManager,
  GoogleTagManagerNoScript,
} from "@/components/app/google-tag-manager";
import { LazyToaster } from "@/components/app/lazy-toaster";
import { StaleVersionWatch } from "@/components/app/stale-version-watch";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OG_IMAGE, SITE_LOCALE, SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  // metadataBase: göreli canonical/OG URL'lerini prod alan adına çözer
  // (Cloudflare'de VERCEL_URL yok; olmazsa localhost'a çözer / hata verir).
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Derecenin Ruhu — LGS, YKS ve KPSS Birebir Koçluk",
    template: "%s | Derecenin Ruhu",
  },
  description:
    "LGS, YKS ve KPSS için birebir online sınav koçluğu: haftalık program, soru takibi ve deneme analiziyle netlerini artır, hedefine ulaş.",
  applicationName: SITE_NAME,
  // Not: `alternates.canonical` KÖKTE TANIMLANMAZ — tanımlanırsa kendi
  // canonical'ını vermeyen her alt sayfa "/"e canonical'lanır (deindex riski).
  // Her public sayfa kendi canonical'ını buildMetadata ile verir.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    url: SITE_URL,
    title: "Derecenin Ruhu — LGS, YKS ve KPSS Birebir Koçluk",
    description:
      "LGS, YKS ve KPSS için birebir online sınav koçluğu: haftalık program, soru takibi ve deneme analiziyle netlerini artır, hedefine ulaş.",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Derecenin Ruhu — LGS, YKS ve KPSS Birebir Koçluk",
    description:
      "LGS, YKS ve KPSS için birebir online sınav koçluğu; netlerini artır, hedefine ulaş.",
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f9fc" },
    { media: "(prefers-color-scheme: dark)", color: "#110f1f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${GeistSans.variable} h-full antialiased`}
    >
      {/* Başlık fontunu CSS ayrıştırılmasını BEKLEMEDEN indirmeye başla.
          LCP öğesi <h1> `font-heading` kullanıyor; preload olmadan zincir
          HTML → CSS → font şeklinde üçe uzuyor ve son boyama gecikiyordu.
          `crossOrigin` ŞART: fontlar CORS kipinde çekilir, öznitelik olmazsa
          preload eşleşmez ve dosya İKİ KEZ inerdi. React <head>'e taşır. */}
      <link
        rel="preload"
        href="/fonts/bricolage-latin.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/bricolage-latin-ext.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <body className="flex min-h-full flex-col">
        <GoogleTagManagerNoScript />
        {/* OpenNext esbuild, next-themes'in prepaint script'ine __name(...) enjekte
            ediyor; tarayıcıda tanımsız olduğu için tema script'i patlıyordu (FOUC +
            konsol hatası). Tema script'inden ÖNCE çalışan minik bir polyfill. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "window.__name||(window.__name=function(t){return t});",
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
          <LazyToaster />
          <StaleVersionWatch />
        </ThemeProvider>
        <GoogleAnalytics />
        <GoogleTagManager />
      </body>
    </html>
  );
}
