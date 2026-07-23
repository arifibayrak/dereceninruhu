"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, SparklesIcon } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import {
  SocialIconRow,
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
  { href: "/kaynaklar", label: "Kaynaklar" },
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
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" aria-label="Derecenin Ruhu — ana sayfa" className="shrink-0">
          <Logo size={28} />
        </Link>

        {/* Masaüstü gezinme */}
        <nav className="ml-4 hidden items-center gap-0.5 lg:flex">
          {NAV.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex h-8 items-center rounded-lg px-2.5 text-sm font-medium transition-colors",
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
          <Button
            variant="ghost"
            className="hidden md:inline-flex"
            render={<Link href="/giris" />}
          >
            Giriş
          </Button>
          <Button className="hidden sm:inline-flex" render={<Link href="/iletisim" />}>
            <SparklesIcon data-icon="inline-start" />
            Ücretsiz Ön Görüşme
          </Button>
          {/*
            Sosyal ikonlar: md'de gezinme gizli olduğu için yer var; lg'de
            7 maddelik gezinme + 3 buton çubuğu doldurduğundan gizlenir,
            xl'de yeniden görünür. Mobilde çekmecenin altında (aşağıda).
          */}
          <SocialIconRow
            urls={social}
            className="hidden md:flex lg:hidden xl:flex"
          />
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
                  <Logo size={26} />
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
                  className="flex h-10 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
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
