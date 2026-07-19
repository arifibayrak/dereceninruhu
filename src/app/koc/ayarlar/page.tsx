import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRightIcon, ShieldCheckIcon, UserRoundIcon } from "lucide-react";

import { getCurrentUser, getViewer } from "@/lib/session";
import { SectionHeading } from "@/components/brand/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Ayarlar" };

// Oturum (D1) okunur → istek başına render.
export const dynamic = "force-dynamic";

export default async function AyarlarPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  if (viewer.role !== "coach" && viewer.role !== "admin") redirect("/ogrenci");
  const user = await getCurrentUser();
  const isAdmin = viewer.role === "admin";

  return (
    <>
      <SectionHeading
        eyebrow="Ayarlar"
        title="Hesap ve ekip"
        description="Hesap bilgilerin, herkese açık profilin ve (yöneticiyseniz) ekip yönetimi."
      />

      <div className="grid max-w-3xl gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Hesabın</CardTitle>
            <CardDescription>Giriş bilgilerin ve rolün.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {(user as { name?: string } | null)?.name ?? "—"}
              </span>
              <Badge variant={isAdmin ? "default" : "secondary"}>
                {isAdmin ? "Yönetici" : "Koç"}
              </Badge>
            </div>
            <span className="text-muted-foreground">
              {(user as { email?: string } | null)?.email ?? ""}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRoundIcon className="size-4" />
              Herkese açık profilin
            </CardTitle>
            <CardDescription>
              Fotoğrafın, tanıtımın, dereceler ve platform bağlantıların —
              /koclar sayfasındaki kendi sayfanı besler.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" render={<Link href="/koc/profil" />}>
              Profilimi düzenle
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </CardContent>
        </Card>

        {isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon className="size-4" />
                Ekip yönetimi
              </CardTitle>
              <CardDescription>
                Koç ve yönetici hesapları ekle, rolleri değiştir, öğrenci
                atamalarını yönet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button render={<Link href="/koc/yonetim" />}>
                Yönetime git
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Ekip</CardTitle>
              <CardDescription>
                Yeni koç veya yönetici ekleme yalnız yöneticilere (Arif / Hakan)
                açıktır. Bir değişiklik gerekiyorsa yöneticinle iletişime geç.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </>
  );
}
