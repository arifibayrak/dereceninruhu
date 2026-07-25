import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon, FlaskConicalIcon } from "lucide-react";

import { getViewer } from "@/lib/session";
import { ORNEK_BASE, ornekOgrenci } from "@/lib/rehber/ornek-ogrenci";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrnekTabs } from "./_tabs";

// Oturum (D1) okunur → istek başına render.
export const dynamic = "force-dynamic";

/**
 * Örnek öğrenci kokpiti — yalnız tur için.
 *
 * Gerçek kokpit bir öğrenci kaydı ister; tur kimin kaydını açacağını seçemez
 * ve tanıtım için gerçek bir öğrencinin verisini gezdirmek doğru olmaz.
 * Bu kabuk gerçek kokpitin birebir yapısını (başlık + 10 sekme) kurgusal
 * veriyle gösterir. Hiçbir sorgu çalışmaz, hiçbir şey yazılmaz.
 */
export default async function OrnekLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  if (viewer.role !== "coach" && viewer.role !== "admin") redirect("/ogrenci");

  return (
    <div className="flex flex-col gap-5">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        render={<Link href="/koc/ogrenciler" />}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        Öğrenciler
      </Button>

      {/* Kurgusal veri olduğu her ekranda açıkça yazar. */}
      <div className="flex items-start gap-3 rounded-2xl bg-warning/10 px-4 py-3 ring-1 ring-warning/30">
        <FlaskConicalIcon className="mt-0.5 size-4 shrink-0 text-warning" />
        <p className="text-sm leading-relaxed text-pretty">
          <span className="font-semibold text-warning">Örnek kayıt: </span>
          Bu sayfadaki her şey tur için uydurulmuş temsili veridir — gerçek bir
          öğrenci değildir ve hiçbir veri kaydedilmez. Gerçek kokpit için
          Öğrenciler listesinden bir öğrenci aç.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-title">{ornekOgrenci.fullName}</h1>
          <Badge variant="secondary">
            {ornekOgrenci.examCode} · {ornekOgrenci.trackName}
          </Badge>
          <Badge variant="outline">Davet kabul edildi</Badge>
          <span className="text-sm text-muted-foreground">
            🎯 {ornekOgrenci.target}
          </span>
        </div>
        <OrnekTabs base={ORNEK_BASE} />
      </div>

      <div className={cn("flex flex-col gap-5")}>{children}</div>
    </div>
  );
}
