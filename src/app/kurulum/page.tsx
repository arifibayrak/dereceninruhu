import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { hasAnyCoach } from "@/actions/setup";
import { SetupForm } from "@/components/app/setup-form";
import { LogoLink } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Kurulum",
  description: "Derecenin Ruhu — ilk yönetici hesabını oluştur.",
};

// DB'ye istek anında bakmalı; asla önceden derlenmemeli.
export const dynamic = "force-dynamic";

export default async function KurulumPage() {
  if (await hasAnyCoach()) redirect("/giris");

  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[12%] left-1/2 h-64 w-[min(30rem,90vw)] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-[12%] bottom-[18%] size-36 rounded-full bg-gold/15 blur-2xl" />
      </div>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <LogoLink size={40} />
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-title">İlk kurulum</h1>
            <p className="text-sm text-muted-foreground">
              Henüz koç hesabı yok. İlk yönetici hesabını oluşturarak başla.
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
          <SetupForm />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          İkinci koçu daha sonra Ayarlar &gt; Koç ekle&apos;den davet
          edebilirsin.
        </p>
      </div>
    </div>
  );
}
