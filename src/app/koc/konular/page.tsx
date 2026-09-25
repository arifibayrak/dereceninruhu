import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  getSubjectTopicsForAdmin,
  getTopicAdminTree,
} from "@/db/queries/konu-yonetimi";
import { getViewer } from "@/lib/session";
import { SectionHeading } from "@/components/brand/section-heading";
import { TopicManager } from "@/components/app/topic-manager";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Konular" };

const chipClass = (active: boolean) =>
  cn(
    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
    active
      ? "bg-secondary text-secondary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

export default async function KonularPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Konular tüm öğrencilerde ortak — YALNIZ yönetici düzenler.
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  if (viewer.role !== "admin") redirect("/koc");

  const sp = await searchParams;
  const tree = await getTopicAdminTree();

  const allSubjects = tree.flatMap((exam) =>
    exam.sections.flatMap((sec) =>
      sec.subjects.map((sub) => ({ exam, sec, sub })),
    ),
  );
  const dersParam = Number(sp.ders);
  const sinavParam = typeof sp.sinav === "string" ? sp.sinav : undefined;
  const selected =
    allSubjects.find((s) => s.sub.id === dersParam) ??
    allSubjects.find((s) => s.exam.code === sinavParam) ??
    allSubjects[0];

  if (!selected) {
    return (
      <SectionHeading
        eyebrow="Yönetim"
        title="Konular"
        description="Henüz sınav şablonu yok."
      />
    );
  }

  const activeExam = selected.exam;
  const rows = await getSubjectTopicsForAdmin(selected.sub.id);
  const subjectLabel = selected.sub.parentName
    ? `${selected.sub.name} (${selected.sub.parentName})`
    : selected.sub.name;

  return (
    <>
      <SectionHeading
        eyebrow="Yönetim"
        title="Konular"
        description="Program, soru takibi, deneme analizi ve içeriklerde seçilen konu listesi. Tüm öğrencilerde ortaktır; değişiklik hemen herkese yansır."
      />

      {/* Sınav seçimi */}
      <div className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tree.map((exam) => (
          <Link
            key={exam.code}
            href={`/koc/konular?sinav=${encodeURIComponent(exam.code)}`}
            className={chipClass(exam.code === activeExam.code)}
          >
            {exam.code}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-[15rem_1fr] md:items-start">
        {/* Ders listesi — bölüm bölüm */}
        <nav aria-label="Dersler" className="flex flex-col gap-4">
          {activeExam.sections.map((sec) => (
            <div key={sec.id} className="flex flex-col gap-1">
              {activeExam.sections.length > 1 && (
                <p className="px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {sec.name}
                </p>
              )}
              <div className="flex flex-wrap gap-1 md:flex-col">
                {sec.subjects.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/koc/konular?ders=${sub.id}`}
                    className={cn(
                      chipClass(sub.id === selected.sub.id),
                      "md:justify-between",
                      sub.parentName && "md:pl-6",
                    )}
                  >
                    <span className="truncate">{sub.name}</span>
                    <span className="rounded-full bg-background/70 px-1.5 text-xs tabular-nums ring-1 ring-foreground/10">
                      {sub.activeCount}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <TopicManager
          // Sunucudan yeni liste gelince yerel durum sıfırlansın.
          key={rows
            .map((r) => `${r.id}:${r.sortOrder}:${r.isActive ? 1 : 0}:${r.name}`)
            .join("|")}
          subjectId={selected.sub.id}
          title={`${activeExam.code} · ${selected.sec.name} · ${subjectLabel}`}
          topics={rows}
        />
      </div>
    </>
  );
}
