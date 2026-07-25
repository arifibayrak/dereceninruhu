import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon, FlaskConicalIcon, MicIcon } from "lucide-react";

import { getViewer } from "@/lib/session";
import {
  ornekGorusme,
  ornekKonusma,
  ornekOneriler,
  ornekOzet,
} from "@/lib/rehber/ornek-transkript";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Örnek transkript" };

// Oturum (D1) okunur → istek başına render.
export const dynamic = "force-dynamic";

/**
 * Örnek görüşme transkripti — yalnız tur için.
 *
 * Canlı transkript mikrofon ister; turda gerçek kayıt başlatmak doğru olmaz.
 * Bu ekran tamamlanmış kurgusal bir görüşmeyi gösterir: döküm, AI özeti ve
 * onay bekleyen öneriler. Hiçbir sorgu çalışmaz, hiçbir şey yazılmaz.
 */
export default async function OrnekTranskriptPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  if (viewer.role !== "coach" && viewer.role !== "admin") redirect("/ogrenci");

  return (
    <div className="flex flex-col gap-5">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        render={<Link href="/koc/canli-transkript" />}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        Canlı transkript
      </Button>

      <div className="flex items-start gap-3 rounded-2xl bg-warning/10 px-4 py-3 ring-1 ring-warning/30">
        <FlaskConicalIcon className="mt-0.5 size-4 shrink-0 text-warning" />
        <p className="text-sm leading-relaxed text-pretty">
          <span className="font-semibold text-warning">Örnek görüşme: </span>
          Bu döküm ve öneriler tur için uydurulmuştur. Gerçek bir görüşme
          değildir, hiçbir şey kaydedilmez. Gerçek kayıt için Canlı transkript
          ekranından öğrenci seçip başlat.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-heading text-title">
          {ornekGorusme.ogrenci} · Transkript incelemesi
        </h1>
        <Badge variant="secondary">
          <MicIcon className="size-3" />
          {ornekGorusme.kaynak}
        </Badge>
        <Badge variant="outline">{ornekGorusme.durum}</Badge>
        <span className="text-sm text-muted-foreground">
          {ornekGorusme.tarih} · {ornekGorusme.sure}
        </span>
      </div>

      <Card data-tour="transkript-ozet">
        <CardHeader>
          <CardTitle>Özet</CardTitle>
          <CardDescription>
            Görüşmeden AI ile çıkarılan kısa özet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
            {ornekOzet}
          </p>
        </CardContent>
      </Card>

      <Card data-tour="transkript-oneriler">
        <CardHeader>
          <CardTitle>Öneriler · {ornekOneriler.length}</CardTitle>
          <CardDescription>
            Onaylamadan hiçbiri yazılmaz. Onayladığında gerçek kaydı oluşturur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y">
            {ornekOneriler.map((o) => (
              <li
                key={o.ozet}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0"
              >
                <Badge variant="outline" className="shrink-0">
                  {o.tur}
                </Badge>
                <span className="min-w-0 flex-1 text-sm text-pretty">
                  {o.ozet}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  %{o.guven}
                </span>
                {o.durum === "Onaylandı" ? (
                  <Badge variant="secondary" className="shrink-0">
                    Onaylandı
                  </Badge>
                ) : (
                  <span className="flex shrink-0 gap-1.5">
                    <Button size="xs" variant="outline" disabled>
                      Reddet
                    </Button>
                    <Button size="xs" disabled>
                      Onayla
                    </Button>
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="pt-3 text-xs text-muted-foreground">
            Düğmeler örnek kayıtta devre dışıdır.
          </p>
        </CardContent>
      </Card>

      <Card data-tour="transkript-dokum">
        <CardHeader>
          <CardTitle>Transkript metni</CardTitle>
          <CardDescription>Konuşmanın tam dökümü.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3">
            {ornekKonusma.map((c, i) => (
              <li
                key={i}
                className={cn(
                  "flex flex-col gap-0.5",
                  c.kim === "koc" ? "items-start" : "items-start pl-4",
                )}
              >
                <span
                  className={cn(
                    "text-[11px] font-semibold tracking-wide uppercase",
                    c.kim === "koc" ? "text-primary" : "text-info",
                  )}
                >
                  {c.kim === "koc" ? "Koç" : ornekGorusme.ogrenci}
                </span>
                <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
                  {c.metin}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
