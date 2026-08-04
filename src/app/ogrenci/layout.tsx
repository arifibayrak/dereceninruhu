import Link from "next/link";
import { redirect } from "next/navigation";
import { GeistMono } from "geist/font/mono";
import { UserRoundIcon } from "lucide-react";

import { getSession, type Role } from "@/lib/session";
import { FloatingAssistant } from "@/components/app/floating-assistant";
import { SignOutButton } from "@/components/app/sign-out-button";
import { StudentBottomNav } from "@/components/app/student-nav";
import { RehberLink } from "@/components/rehber/rehber-link";
import { TourLauncherIcon } from "@/components/rehber/tour-launcher";
import { ProductTour } from "@/components/rehber/product-tour";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Session/D1-backed — render per-request (applies to all /ogrenci/* segments).
export const dynamic = "force-dynamic";

/**
 * Öğrenci alanı — mobil öncelikli, alt gezinme çubuğu.
 * Koçlar önizleme için girebilir (rozetle belli edilir).
 */
export default async function OgrenciLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/giris");
  const role = (session.user as { role?: Role }).role ?? "student";
  const isCoachPreview = role === "coach" || role === "admin";

  return (
    /*
     * `--app-bottom-nav` = alt gezinme çubuğunun kapladığı yükseklik. Yapışkan
     * (sticky) kaydet çubukları bunu ekleyerek konumlanır; aksi halde SABİT nav
     * çubuğun ÜSTÜNE biner ve dokunuşu o yutar — buton görünür ama basılamaz.
     * Koç tarafında değişken tanımlı değildir (alt nav yok), 0px'e düşer.
     */
    <div
      className={`${GeistMono.variable} flex min-h-full flex-1 flex-col [--app-bottom-nav:calc(3.5rem+env(safe-area-inset-bottom))]`}
    >
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-13 w-full max-w-lg items-center justify-between gap-2 px-4">
          <Link href="/ogrenci" aria-label="Ana sayfa">
            <Logo size={24} />
          </Link>
          <div className="flex items-center gap-1.5">
            {isCoachPreview && (
              <Badge variant="secondary">Koç önizlemesi</Badge>
            )}
            <TourLauncherIcon tourId="ogrenci" />
            <RehberLink />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Profil"
              render={<Link href="/ogrenci/profil" />}
            >
              <UserRoundIcon />
            </Button>
            <ThemeToggle />
            <SignOutButton iconOnly />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 pt-5 pb-24">
        {children}
      </main>
      <StudentBottomNav />
      {/* Koç önizlemesinde öğrenci sohbeti (kendi verisi) çalışmaz; yalnız öğrenciye göster. */}
      <ProductTour />
      {!isCoachPreview && <FloatingAssistant role="student" />}
    </div>
  );
}
