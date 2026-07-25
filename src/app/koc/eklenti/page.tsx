import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PuzzleIcon } from "lucide-react";

import { getViewer } from "@/lib/session";
import { listExtensionTokensForCoach } from "@/db/queries/extension-tokens";
import { SectionHeading } from "@/components/brand/section-heading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExtensionTokensManager } from "@/components/app/extension-tokens-manager";

export const metadata: Metadata = { title: "Canlı transkript eklentisi" };

// Oturum + token'lar (D1) okunur → istek başına render.
export const dynamic = "force-dynamic";

export default async function EklentiPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  if (viewer.role !== "coach" && viewer.role !== "admin") redirect("/ogrenci");

  const tokens = await listExtensionTokensForCoach(viewer.id);

  return (
    <>
      <SectionHeading
        eyebrow="Eklenti"
        title="Canlı transkript eklentisi"
        description="Görüşmelerini tarayıcıda cihaz-içi (Whisper) canlı yazıya çevir; ses kaydedilmez, yalnız metin uygulamaya işlenir."
      />

      <div className="grid max-w-3xl gap-4">
        <ExtensionTokensManager tokens={tokens} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PuzzleIcon className="size-4" />
              Kurulum
            </CardTitle>
            <CardDescription>Eklentiyi bağlamak için adımlar.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
              <li>
                Eklentiyi Chrome&apos;a yükle (mağazadan ya da geliştirici
                modunda &quot;paketlenmemiş&quot; olarak{" "}
                <code className="rounded bg-muted px-1">extension/.output</code>
                ).
              </li>
              <li>
                Yukarıdan bir token oluştur ve eklenti panelindeki
                &quot;Eklentiyi bağla&quot; alanına yapıştır.
              </li>
              <li>
                Bir Google Meet / Zoom sekmesi aç. Eklenti simgesine tıkla —
                görüşme sağ panelde açılır ve planlı görüşmeni otomatik eşler.
              </li>
              <li>
                &quot;Başlat&quot;a bas; konuşuldukça canlı Türkçe transkript
                akar. &quot;Durdur → Kaydet&quot; ile metin uygulamaya işlenir
                ve AI önerileri çıkarılır.
              </li>
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">
              Gizlilik: ses hiçbir zaman kaydedilmez ya da sunucuya gönderilmez;
              yazıya çevirme tamamen senin cihazında (WebGPU) çalışır.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
