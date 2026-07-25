import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { getViewer } from "@/lib/session";
import { yoneticiTuru } from "@/lib/rehber/tur-yonetici";
import { TourPage, parseStepParam } from "@/components/rehber/tour-page";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Yönetici turu" };

// Oturum (D1) okunur → istek başına render.
export const dynamic = "force-dynamic";

// searchParams tipi elle yazıldı: `PageProps<"/koc/tur">` kullanılırsa
// typegen bu dosyayı çözemeyip rotayı hiç üretmiyor (yumurta-tavuk).
export default async function YoneticiTurPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  // Yönetici olmayan koç buraya giremez — içerik de gönderilmez.
  if (viewer.role !== "admin") redirect("/koc/tur");
  const { adim } = await searchParams;

  return (
    <TourPage
      tour={yoneticiTuru}
      flowHref="/koc/rehber/akis"
      initialStep={parseStepParam(adim, yoneticiTuru.steps.length)}
      extra={
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          render={<Link href="/koc/tur" />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Koç turuna dön
        </Button>
      }
    />
  );
}
