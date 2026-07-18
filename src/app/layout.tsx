import type { Metadata, Viewport } from "next";
// Self-hosted (bundled woff2, no Google fetch) — works offline & on Workers.
// Geist includes latin-ext, covering Turkish glyphs (ğ ş ı İ ö ü ç).
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
// Başlık yüzü: Bricolage Grotesque (self-hosted @fontsource-variable, latin-ext).
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: {
    default: "Derecenin Ruhu — Mentorluk",
    template: "%s | Derecenin Ruhu",
  },
  description:
    "LGS, YKS ve KPSS için birebir koçluk ve takip sistemi. Netlerini artır, hedefine ulaş.",
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
