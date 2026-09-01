import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusIcon, TargetIcon, TimerIcon } from "lucide-react";

import { getEnrollmentDetailByUserId } from "@/db/queries/enrollment";
import { getMockList, type MockRow } from "@/db/queries/tracking";
import { getCurrentUser, type Role } from "@/lib/session";
import { formatDelta, formatInt, formatNet } from "@/lib/format";
import { groupMocks, type MockGroup } from "@/lib/mock-groups";
import { buildPaceViews, type PaceView } from "@/lib/pace";
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
  // Genel denemeler ve her branş dersi ayrı bloklarda (bkz. @/lib/mock-groups).
  const groups = groupMocks(mocks);

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
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <MockGroupSection key={group.key} group={group} paces={paces} />
          ))}
        </div>
      )}
    </>
  );
}

/** Bir grup (genel deneme bölümü ya da tek branş dersi) + kendi denemeleri. */
function MockGroupSection({
  group,
  paces,
}: {
  group: MockGroup<MockRow>;
  paces: Map<number, PaceView>;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Badge
          variant={group.kind === "full" ? "secondary" : "outline"}
          className="h-5 px-1.5 text-[10px]"
        >
          {group.kind === "full" ? "Genel" : "Branş"}
        </Badge>
        <h2 className="font-heading text-sm font-semibold">{group.title}</h2>
        <span className="text-xs text-muted-foreground">
          {formatInt(group.count)} deneme · ort. {formatNet(group.avgNet)}
        </span>
        {group.deltaNet !== null && group.deltaNet !== 0 && (
          <span
            className={cn(
              "text-xs font-medium tabular-nums",
              group.deltaNet > 0 ? "text-success" : "text-warning",
            )}
            title="Bu dersteki bir önceki denemene göre"
          >
            {formatDelta(group.deltaNet)} net
          </span>
        )}
      </div>
      <ul className="flex flex-col gap-2">
        {group.mocks.map((m) => {
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
                  {/* Bölüm/ders artık grup başlığında — satır tarihe odaklanır. */}
                  {dateFmt.format(m.takenOn)}
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
    </section>
  );
}
