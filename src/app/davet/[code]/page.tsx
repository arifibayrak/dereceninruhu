import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlertIcon } from "lucide-react";

import { getInviteInfo } from "@/actions/invite";
import { InviteForm } from "@/components/app/invite-form";
import { LogoLink } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Davet",
  description: "Derecenin Ruhu takip sistemine davetlisin.",
};

export const dynamic = "force-dynamic";

export default async function DavetPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const info = await getInviteInfo(code);

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
        </div>

        {info ? (
          <>
            <div className="flex flex-col gap-1 text-center">
              <h1 className="font-heading text-title">
                Merhaba {info.fullName.split(" ")[0]} 👋
              </h1>
              <p className="text-sm text-muted-foreground">
                Koçun seni Derecenin Ruhu&apos;na davet etti. PIN&apos;ini
                belirle, takibe başlayalım.
              </p>
            </div>
            <div className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
              <InviteForm inviteCode={code} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-card p-6 text-center ring-1 ring-foreground/10">
            <span className="flex size-10 items-center justify-center rounded-full bg-warning/10">
              <CircleAlertIcon className="size-5 text-warning" />
            </span>
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-lg font-semibold">
                Davet bağlantısı geçersiz
              </h1>
              <p className="text-sm text-muted-foreground">
                Bu bağlantı kullanılmış ya da hatalı olabilir. Zaten PIN
                belirlediysen giriş yapabilirsin; yoksa koçundan yeni bir davet
                linki iste.
              </p>
            </div>
            <Button render={<Link href="/giris" />} className="w-full">
              Giriş sayfasına git
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
