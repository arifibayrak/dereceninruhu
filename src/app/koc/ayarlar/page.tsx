import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRightIcon,
  BookOpenIcon,
  PuzzleIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";

import { getCurrentUser, getViewer } from "@/lib/session";
import { TourLauncher } from "@/components/rehber/tour-launcher";
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

      <div data-tour="ayarlar-kartlar" className="grid max-w-3xl gap-4">
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
              <BookOpenIcon className="size-4" />
              Kullanım rehberi
            </CardTitle>
            <CardDescription>
              Paneldeki her ekran ve her buton adım adım anlatılıyor.
              {isAdmin
                ? " Yöneticiye açık ekranlar için ayrı bir rehber var."
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <TourLauncher
              tourId="koc"
              label="Paneli tanı (tur)"
              variant="default"
            />
            <Button variant="outline" render={<Link href="/koc/rehber" />}>
              Koç rehberini aç
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <Button variant="outline" render={<Link href="/koc/rehber/akis" />}>
              Baştan sona nasıl işler
            </Button>
            <Button variant="ghost" render={<Link href="/koc/tur" />}>
              Turu yazılı oku
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                render={<Link href="/koc/rehber/yonetici" />}
              >
                Yönetici rehberi
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            )}
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PuzzleIcon className="size-4" />
              Canlı transkript eklentisi
            </CardTitle>
            <CardDescription>
              Görüşmelerini tarayıcıda cihaz-içi canlı yazıya çevir (Whisper
              Turbo); eklenti token&apos;ını buradan yönet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" render={<Link href="/koc/eklenti" />}>
              Eklentiyi bağla
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
