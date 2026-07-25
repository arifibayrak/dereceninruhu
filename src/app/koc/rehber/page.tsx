import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRightIcon, ShieldCheckIcon } from "lucide-react";

import { getViewer } from "@/lib/session";
import { kocRehberi } from "@/lib/rehber/koc";
import { GuidePage } from "@/components/rehber/guide-page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Rehber" };

// Oturum (D1) okunur → istek başına render.
export const dynamic = "force-dynamic";

export default async function KocRehberPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  if (viewer.role !== "coach" && viewer.role !== "admin") redirect("/ogrenci");

  return (
    <GuidePage
      guide={kocRehberi}
      variant="koc"
      storageKey="dr:rehber:koc:v1"
      flowHref="/koc/rehber/akis"
      intro={
        viewer.role === "admin" ? (
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon className="size-4" />
                Yönetici rehberi
              </CardTitle>
              <CardDescription>
                Ekip yönetimi, kadro içe aktarma, mutabakat, koç başvuruları ve
                site içeriği — yalnız yöneticilere açık ekranlar ayrı bir
                rehberde anlatılıyor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                render={<Link href="/koc/rehber/yonetici" />}
              >
                Yönetici rehberini aç
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </CardContent>
          </Card>
        ) : null
      }
    />
  );
}
