import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession, type Role } from "@/lib/session";
import { CoachNav } from "@/components/app/coach-nav";
import { SignOutButton } from "@/components/app/sign-out-button";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

// Session/D1-backed — render per-request (applies to all /koc/* segments).
export const dynamic = "force-dynamic";

/** Koç alanı — yalnız koç/yönetici; masaüstü öncelikli çalışma yüzeyi. */
export default async function KocLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const role = (session?.user as { role?: Role } | undefined)?.role;
  if (!session?.user || (role !== "coach" && role !== "admin")) {
    redirect("/giris");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/koc" aria-label="Koç paneli">
            <Logo size={26} />
          </Link>
          <CoachNav className="ml-2" />
          <div className="ml-auto flex items-center gap-1.5">
            <span className="hidden text-sm text-muted-foreground md:block">
              {session.user.name}
            </span>
            <ThemeToggle />
            <SignOutButton iconOnly />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 md:py-8">
        {children}
      </main>
    </div>
  );
}
