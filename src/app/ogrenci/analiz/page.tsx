import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRightIcon, LibraryIcon } from "lucide-react";

import { getTopicDeficits, getTopicHeatmap } from "@/db/queries/analiz";
import { getEnrollmentDetailByUserId } from "@/db/queries/enrollment";
import { getCurrentUser, type Role } from "@/lib/session";
import { formatInt } from "@/lib/format";
import { NoEnrollmentCard } from "@/components/app/no-enrollment";
import { TopicDeficitList } from "@/components/app/topic-deficit-list";
import { TopicHeatmap } from "@/components/app/topic-heatmap";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Eksik Konular" };

export default async function OgrenciAnalizPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const role = (user as { role?: Role }).role ?? "student";

  const detail = await getEnrollmentDetailByUserId(user.id);
  if (!detail) {
    return <NoEnrollmentCard isCoach={role === "coach" || role === "admin"} />;
  }
  const enrollmentId = detail.enrollment.id;

  const [deficits, heatmap] = await Promise.all([
    getTopicDeficits(enrollmentId),
    getTopicHeatmap(enrollmentId),
  ]);
  const totalDeficit = deficits.reduce((acc, d) => acc + d.total, 0);

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-title">Eksik konular</h1>
        <p className="text-sm text-muted-foreground">
          Deneme analizlerinden toplam{" "}
          <strong className="text-foreground">{formatInt(totalDeficit)}</strong>{" "}
          eksik
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Toplam eksik sıralaması</CardTitle>
          <CardDescription>
            En çok soru kaçırdığın konular — çalışma önceliğin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopicDeficitList
            data-tour="analiz-siralama"
            deficits={deficits}
            limit={10}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Konu ısı haritası</CardTitle>
          <CardDescription>
            Deneme deneme eksikler — koyulaşan hücre tekrarlayan eksik demek.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopicHeatmap data={heatmap} />
        </CardContent>
      </Card>

      <Link
        href="/ogrenci/kaynaklar"
        className="flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:ring-primary/40"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <LibraryIcon className="size-4 text-primary" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-medium">Kaynak takibi</span>
          <span className="truncate text-xs text-muted-foreground">
            Kaynaklarını ekle, soru sayısını gir, biten konuları işaretle
          </span>
        </span>
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </>
  );
}
