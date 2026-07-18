import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRightIcon } from "lucide-react";

import { listStaff } from "@/db/queries/admin";
import { formatInt } from "@/lib/format";
import { getViewer } from "@/lib/session";
import { AdminAddForm } from "@/components/app/admin-add-form";
import { CoachAddForm } from "@/components/app/coach-add-form";
import { StaffRoleSelect } from "@/components/app/staff-role-select";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Yönetim" };

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Ekip yönetimi — yalnız yönetici (koçlar /koc'a yönlendirilir). */
export default async function YonetimPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  if (viewer.role !== "admin") redirect("/koc");

  const staff = await listStaff();
  const adminCount = staff.filter((s) => s.role === "admin").length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Yönetim"
          title="Ekip yönetimi"
          description="Koç ve yönetici hesapları, roller ve öğrenci dağılımı. Öğrenci → koç ataması Öğrenciler sayfasındaki Koç sütunundan yapılır."
        />
        <Button variant="outline" render={<Link href="/koc/ogrenciler" />}>
          Öğrenci atamaları
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </div>

      <div className="rounded-xl bg-card ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Ad</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right">Öğrenci</TableHead>
              <TableHead>Katılım</TableHead>
              <TableHead className="pr-4">Rol değiştir</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((s) => {
              const lastAdmin = s.role === "admin" && adminCount <= 1;
              return (
                <TableRow key={s.id}>
                  <TableCell className="pl-4 font-medium">
                    {s.name}
                    {s.id === viewer.id && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        (sen)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.email}
                  </TableCell>
                  <TableCell>
                    {s.role === "admin" ? (
                      <Badge>Yönetici</Badge>
                    ) : (
                      <Badge variant="secondary">Koç</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatInt(s.activeStudentCount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dateFmt.format(s.createdAt)}
                  </TableCell>
                  <TableCell className="pr-4">
                    <StaffRoleSelect
                      key={`${s.id}:${s.role}`}
                      userId={s.id}
                      role={s.role}
                      disabled={lastAdmin}
                    />
                    {lastAdmin && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Son yönetici — rol kilitli
                      </p>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Koç ekle</CardTitle>
            <CardDescription>
              Yeni koç e-posta ve şifresiyle giriş yapar; yalnız kendisine
              atanan öğrencileri görür.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CoachAddForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Yönetici ekle</CardTitle>
            <CardDescription>
              Yöneticiler tüm öğrencileri görür, ekip ve atamaları yönetir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminAddForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
