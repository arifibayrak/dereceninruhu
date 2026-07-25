import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRightIcon, ShieldCheckIcon } from "lucide-react";

import { getViewer } from "@/lib/session";
import { kocTuru } from "@/lib/rehber/tur-koc";
import { TourPage, parseStepParam } from "@/components/rehber/tour-page";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Tur" };

// Oturum (D1) okunur → istek başına render.
export const dynamic = "force-dynamic";

// searchParams tipi elle yazıldı: `PageProps<"/koc/tur">` kullanılırsa
// typegen bu dosyayı çözemeyip rotayı hiç üretmiyor (yumurta-tavuk).
export default async function KocTurPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  if (viewer.role !== "coach" && viewer.role !== "admin") redirect("/ogrenci");
  const { adim } = await searchParams;

  return (
    <TourPage
      tour={kocTuru}
      flowHref="/koc/rehber/akis"
      initialStep={parseStepParam(adim, kocTuru.steps.length)}
      extra={
        viewer.role === "admin" ? (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">
            <ShieldCheckIcon className="size-4 shrink-0 text-gold" />
            <span className="min-w-0 flex-1 text-sm text-muted-foreground">
              Bu tur her koçun gördüğü ekranları gezer. Yalnız yöneticiye açık
              ekranlar için ayrı bir tur var.
            </span>
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/koc/tur/yonetici" />}
            >
              Yönetici turu
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
        ) : null
      }
    />
  );
}
