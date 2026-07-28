import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { getSession, type Role } from "@/lib/session";
import { LoginForm } from "@/components/app/login-form";
import { Logo } from "@/components/brand/logo";
import { WhatsappFabSlot } from "@/components/marketing/whatsapp-fab-slot";
import { ThemeToggle } from "@/components/theme-toggle";

// Reads the session (D1 binding) → must render per-request, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Giriş",
  description: "Derecenin Ruhu takip sistemine giriş yap.",
};

export default async function GirisPage() {
  const session = await getSession();
  if (session?.user) {
    const role = (session.user as { role?: Role }).role;
    redirect(role === "coach" || role === "admin" ? "/koc" : "/ogrenci");
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[12%] left-1/2 h-64 w-[min(30rem,90vw)] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-[12%] bottom-[18%] size-36 rounded-full bg-gold/15 blur-2xl" />
      </div>
      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Ana sayfa
        </Link>
      </div>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo size={40} />
          <p className="text-sm text-muted-foreground">
            Netlerini artır, hedefine ulaş.
          </p>
        </div>
        <div className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
          <LoginForm />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          İlk kez mi geliyorsun?{" "}
          <Link
            href="/katil"
            className="font-medium text-foreground hover:text-primary"
          >
            Telefonunla başla
          </Link>
        </p>
      </div>

      {/* Giriş yapamayan/PIN'ini unutan doğrudan koça ulaşabilsin. */}
      <WhatsappFabSlot />
    </div>
  );
}
