import type { Metadata } from "next";

import { CoachAddForm } from "@/components/app/coach-add-form";
import { SectionHeading } from "@/components/brand/section-heading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Ayarlar" };

export default function AyarlarPage() {
  return (
    <>
      <SectionHeading
        eyebrow="Ayarlar"
        title="Ekip ve hesap"
        description="Şimdilik yalnız koç ekleme; diğer ayarlar sonraki fazlarda."
      />
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Koç ekle</CardTitle>
          <CardDescription>
            İkinci koç hesabını oluştur (örn. Ahmet + Arif). Yeni koç e-posta ve
            şifresiyle giriş yapar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CoachAddForm />
        </CardContent>
      </Card>
    </>
  );
}
