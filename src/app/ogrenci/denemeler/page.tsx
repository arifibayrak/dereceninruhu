import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusIcon, TargetIcon, TimerIcon } from "lucide-react";

import { getEnrollmentDetailByUserId } from "@/db/queries/enrollment";
import { getMockList } from "@/db/queries/tracking";
import { getCurrentUser, type Role } from "@/lib/session";
import { formatInt, formatNet } from "@/lib/format";
import { buildPaceViews } from "@/lib/pace";
import { formatMinutes } from "@/lib/study";
import { cn } from "@/lib/utils";
import { MockActions } from "@/components/app/mock-actions";
import { NoEnrollmentCard } from "@/components/app/no-enrollment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Denemeler" };

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
});

export default async function DenemelerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const role = (user as { role?: Role }).role ?? "student";

  const detail = await getEnrollmentDetailByUserId(user.id);
  if (!detail) {
    return <NoEnrollmentCard isCoach={role === "coach" || role === "admin"} />;
  }
  const mocks = await getMockList(detail.enrollment.id);
  // Tempo, aynı dersin bir önceki denemesiyle kıyaslanır (bkz. @/lib/pace).
  const paces = buildPaceViews(mocks);

  return (
    <>
      <div
        data-tour="denemeler-liste"
        className="flex items-end justify-between gap-3"
      >
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-title">Denemeler</h1>
          <p className="text-sm text-muted-foreground">
            {formatInt(mocks.length)} deneme kayıtlı
          </p>
        </div>
        <Button
          render={<Link href="/ogrenci/denemeler/yeni" />}
          className="h-11"
        >
          <PlusIcon data-icon="inline-start" />
          Deneme ekle
        </Button>
      </div>

      {mocks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-14 text-center ring-1 ring-foreground/10">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/10">
            <TargetIcon className="size-5 text-primary" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-heading text-lg font-semibold">
              İlk denemeni ekle
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Doğru ve yanlışlarını gir; netini biz hesaplayalım, gelişimini
              birlikte izleyelim.
            </p>
          </div>
          <Button render={<Link href="/ogrenci/denemeler/yeni" />}>
            <PlusIcon data-icon="inline-start" />
            Deneme ekle
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {mocks.map((m) => {
            const pace = paces.get(m.id);
            return (
            <li
              key={m.id}
              className="flex items-center gap-2 rounded-xl bg-card p-3.5 ring-1 ring-foreground/10"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-medium">
                  {m.name?.trim() || m.publisher?.trim() || m.sectionCode}
                </span>
                <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  {dateFmt.format(m.takenOn)} · {m.sectionName}
                  {/* Branşta asıl kimlik ders adıdır — "TYT" tek başına yetmez. */}
                  {m.scope === "branch" && m.subjectNames.length > 0 && (
                    <span className="font-medium text-foreground/70">
                      {m.subjectNames.join(" · ")}
                    </span>
                  )}
                  <Badge
                    variant={m.scope === "full" ? "secondary" : "outline"}
                    className="h-4 px-1.5 text-[10px]"
                  >
                    {m.scope === "full" ? "Tam" : "Branş"}
                  </Badge>
                  {m.analysisDone ? (
                    <Badge className="h-4 bg-success/10 px-1.5 text-[10px] text-success">
                      Analiz yapıldı
                    </Badge>
                  ) : (
                    <Link
                      href={`/ogrenci/denemeler/${m.id}/analiz`}
                      className="text-[10px] font-medium text-primary hover:underline"
                    >
                      Analiz gir →
                    </Link>
                  )}
                </span>
                {pace ? (
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
                    <TimerIcon className="size-3 shrink-0 text-muted-foreground" />
                    <span className="tabular-nums text-muted-foreground">
                      {formatMinutes(m.durationMinutes ?? 0)} · {pace.label}
                    </span>
                    {pace.deltaLabel && (
                      <span
                        className={cn(
                          "rounded px-1 py-px text-[10px] font-medium tabular-nums",
                          pace.faster === true && "bg-success/10 text-success",
                          pace.faster === false && "bg-warning/10 text-warning",
                          pace.faster === null && "bg-muted text-muted-foreground",
                        )}
                        title="Aynı dersin bir önceki denemesine göre"
                      >
                        {pace.deltaLabel}
                      </span>
                    )}
                  </span>
                ) : m.scope === "branch" ? (
                  // Düzenleme kalem düğmesiyle açılır (satırın sağında) — burada
                  // yalnız eksik veriyi görünür kılıyoruz.
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground/70">
                    <TimerIcon className="size-3 shrink-0" />
                    Süre girilmedi
                  </span>
                ) : null}
              </div>
              <Link
                href={`/ogrenci/denemeler/${m.id}/analiz`}
                className="flex shrink-0 flex-col items-end leading-tight"
                aria-label={`${m.name?.trim() || m.sectionName} analizini aç`}
              >
                <span className="font-heading text-xl font-bold tabular-nums">
                  {formatNet(m.totalNet)}
                </span>
                <span className="text-[10px] text-muted-foreground">net</span>
              </Link>
              <MockActions
                mockExamId={m.id}
                label={m.name?.trim() || m.publisher?.trim() || m.sectionName}
              />
            </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
