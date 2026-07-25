import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenIcon, WalletIcon } from "lucide-react";

import { getEnrollmentDetailByUserId } from "@/db/queries/enrollment";
import { getCurrentUser, type Role } from "@/lib/session";
import { NoEnrollmentCard } from "@/components/app/no-enrollment";
import { StudentProfileForm } from "@/components/app/student-profile-form";
import { TourLauncher } from "@/components/rehber/tour-launcher";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Profil" };

export default async function OgrenciProfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const role = (user as { role?: Role }).role ?? "student";

  const detail = await getEnrollmentDetailByUserId(user.id);
  if (!detail) {
    return <NoEnrollmentCard isCoach={role === "coach" || role === "admin"} />;
  }
  const { student, enrollment } = detail;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-semibold">Profil</h1>
        <p className="text-sm text-muted-foreground">
          Bilgilerini güncel tut; koçun bunları görür.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Bilgilerim</CardTitle>
          <CardDescription>
            {enrollment.examName}
            {enrollment.trackName ? ` · ${enrollment.trackName}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentProfileForm
            variant="self"
            initial={{
              fullName: student.fullName,
              phone: student.phone ?? "",
              parentPhone: student.parentPhone ?? "",
              targetText: enrollment.targetText ?? "",
              grade: student.grade ?? "",
              field: student.field ?? "",
              school: student.school ?? "",
              dershane: student.dershane ?? "",
              email: student.email ?? "",
              telegram: student.telegram ?? "",
              city: student.city ?? "",
              birthYear: student.birthYear ?? undefined,
            }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ödemelerim</CardTitle>
          <CardDescription>
            Bakiyeni gör, gönderdiğin ödemeyi bildir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" render={<Link href="/ogrenci/odemeler" />}>
            <WalletIcon data-icon="inline-start" />
            Ödemelerime git
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Kullanım rehberi</CardTitle>
          <CardDescription>
            Hangi ekran ne işe yarıyor, hangi butona basınca ne oluyor — hepsi
            adım adım.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <TourLauncher
            tourId="ogrenci"
            label="Uygulamayı tanı (tur)"
            variant="default"
          />
          <Button variant="outline" render={<Link href="/ogrenci/rehber" />}>
            <BookOpenIcon data-icon="inline-start" />
            Rehberi aç
          </Button>
          <Button
            variant="outline"
            render={<Link href="/ogrenci/rehber/akis" />}
          >
            Baştan sona nasıl işler
          </Button>
          <Button variant="ghost" render={<Link href="/ogrenci/tur" />}>
            Turu yazılı oku
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
