import type { Metadata, Viewport } from "next";
// Self-hosted (bundled woff2, no Google fetch) — works offline & on Workers.
// Geist includes latin-ext, covering Turkish glyphs (ğ ş ı İ ö ü ç).
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
// Başlık yüzü: Bricolage Grotesque (self-hosted @fontsource-variable, latin-ext).
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";

import { StaleVersionWatch } from "@/components/app/stale-version-watch";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
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
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
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
          <Toaster position="top-center" />
          <StaleVersionWatch />
        </ThemeProvider>
      </body>
    </html>
  );
}
