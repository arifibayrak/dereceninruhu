import type { Metadata } from "next";

import { ogrenciTuru } from "@/lib/rehber/tur-ogrenci";
import { TourPage, parseStepParam } from "@/components/rehber/tour-page";

export const metadata: Metadata = { title: "Tur" };

// searchParams tipi elle yazıldı: `PageProps<"/koc/tur">` kullanılırsa
// typegen bu dosyayı çözemeyip rotayı hiç üretmiyor (yumurta-tavuk).
export default async function OgrenciTurPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { adim } = await searchParams;
  return (
    <TourPage
      tour={ogrenciTuru}
      shell="ogrenci"
      flowHref="/ogrenci/rehber/akis"
      initialStep={parseStepParam(adim, ogrenciTuru.steps.length)}
    />
  );
}
