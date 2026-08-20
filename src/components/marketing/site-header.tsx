"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogInIcon, MenuIcon, SparklesIcon } from "lucide-react";

import { LogoLink } from "@/components/brand/logo";
import {
  SocialIconRow,
  SocialIconScroller,
  type SocialUrls,
} from "@/components/brand/social-icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/nasil-calisir", label: "Nasıl Çalışır" },
  { href: "/koclar", label: "Koçlar" },
  { href: "/fiyatlar", label: "Fiyatlar" },
  { href: "/blog", label: "Blog" },
  { href: "/basarilar", label: "Başarılar" },
  { href: "/sss", label: "SSS" },
] as const;

/** Pazarlama sitesi üst çubuğu — yapışkan, mobilde çekmece menü. */
export function SiteHeader({ social }: { social: SocialUrls }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      {/*
        Tam genişlik (ortalanmış `max-w-6xl` ray DEĞİL): 2100px ekranda marka
        soldan 498px içeride kalıyordu. Artık sol kenardan 32px. Mobilde
        davranış aynı — ekran zaten rayın altında kaldığı için `max-w` etkisizdi.
        Ödünleşme bilinçli: başlık, sayfa içeriğinin 1152px rayıyla hizalı değil.
      */}
      <div className="flex h-16 w-full items-center gap-3 px-4 sm:px-6 lg:px-8">
        <LogoLink size={28} />

        {/* Masaüstü gezinme */}
        <nav className="ml-4 hidden items-center gap-0.5 lg:flex">
          {NAV.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex h-10 items-center whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            className="hidden lg:inline-flex"
            render={<Link href="/koc-basvuru" />}
          >
            Koç Ol
          </Button>
          {/* Giriş — çerçeveli/ikonlu, sade nav bağlantılarından ayrışsın, kolay bulunsun. */}
          <Button
            variant="outline"
            className="hidden font-semibold md:inline-flex"
            render={<Link href="/giris" />}
          >
            <LogInIcon data-icon="inline-start" />
            Giriş
          </Button>
          <Button className="hidden sm:inline-flex" render={<Link href="/iletisim" />}>
            <SparklesIcon data-icon="inline-start" />
            Ücretsiz Ön Görüşme
          </Button>
          {/*
            Sosyal ikonlar: tek-ikon genişliğinde yatay kayan şerit (alan kazanır);
            her breakpoint'te görünür. Mobil çekmecede tam sıra (aşağıda).
          */}
          <SocialIconScroller urls={social} className="hidden md:flex" />
          <ThemeToggle className="hidden sm:inline-flex" />

          {/* Mobil menü */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Menüyü aç"
                />
              }
            >
              <MenuIcon />
            </SheetTrigger>
            <SheetContent side="right" className="w-[19rem]">
              <SheetHeader>
                <SheetTitle>
                  <LogoLink size={26} onClick={() => setOpen(false)} />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {NAV.map(({ href, label }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex h-10 items-center rounded-lg px-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-secondary text-secondary-foreground"
                          : "text-foreground hover:bg-muted",
                      )}
                    >
                      {label}
                    </Link>
                  );
                })}
                <Link
                  href="/koc-basvuru"
                  onClick={() => setOpen(false)}
                  className="flex h-10 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Koç Ol
                </Link>
                <Link
                  href="/giris"
                  onClick={() => setOpen(false)}
                  className="mt-1 flex h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <LogInIcon className="size-4" />
                  Giriş
                </Link>
              </nav>
              <div className="mt-auto flex flex-col gap-3 p-4">
                <Button
                  size="lg"
                  className="w-full"
                  render={<Link href="/iletisim" onClick={() => setOpen(false)} />}
                >
                  <SparklesIcon data-icon="inline-start" />
                  Ücretsiz Ön Görüşme
                </Button>
                <div className="flex items-center justify-between">
                  <SocialIconRow urls={social} className="-ml-2" />
                  <ThemeToggle />
                </div>
                <span className="text-xs text-muted-foreground">
                  Netlerini artır, hedefine ulaş.
                </span>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
