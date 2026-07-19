import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusIcon, UsersIcon } from "lucide-react";

import { listCoaches } from "@/db/queries/admin";
import { getHiddenStudents, getRoster } from "@/db/queries/roster";
import { formatInt } from "@/lib/format";
import { getViewer } from "@/lib/session";
import { RestoreStudentButton } from "@/components/app/hide-student-actions";
import { RosterTable } from "@/components/app/roster-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Öğrenciler" };

const FILTERS = ["KPSS", "YKS", "LGS"] as const;

/** Atanmamış öğrenciler için ?koc= değeri. */
const KOC_YOK = "yok";

const HIDDEN_DATE_FMT = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" });

function rosterHref(params: { sinav?: string | null; koc?: string | null }) {
  const qs = new URLSearchParams();
  if (params.sinav) qs.set("sinav", params.sinav);
  if (params.koc) qs.set("koc", params.koc);
  const s = qs.toString();
  return s ? `/koc/ogrenciler?${s}` : "/koc/ogrenciler";
}

export default async function OgrencilerPage({
  searchParams,
}: {
  searchParams: Promise<{ sinav?: string; koc?: string }>;
}) {
  const { sinav, koc } = await searchParams;
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  const isAdmin = viewer.role === "admin";

  const [roster, coaches, hidden] = await Promise.all([
    getRoster(viewer),
    isAdmin ? listCoaches() : Promise.resolve([]),
    isAdmin ? getHiddenStudents() : Promise.resolve([]),
  ]);

  const activeFilter = FILTERS.find((f) => f === sinav) ?? null;
  const activeKoc =
    isAdmin && koc && (koc === KOC_YOK || coaches.some((c) => c.id === koc))
      ? koc
      : null;

  let rows = activeFilter
    ? roster.filter((r) => r.examCode === activeFilter)
    : roster;
  if (activeKoc) {
    rows =
      activeKoc === KOC_YOK
        ? rows.filter((r) => r.coachUserId === null)
        : rows.filter((r) => r.coachUserId === activeKoc);
  }

  const unassignedCount = roster.filter((r) => r.coachUserId === null).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            <span aria-hidden className="size-1.5 rounded-full bg-gold" />
            Kadro · {formatInt(roster.length)} öğrenci
          </span>
          <h1 className="font-heading text-title">Öğrenciler</h1>
        </div>
        <Button render={<Link href="/koc/ogrenciler/yeni" />}>
          <PlusIcon data-icon="inline-start" />
          Yeni öğrenci
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            href={rosterHref({ koc: activeKoc })}
            active={activeFilter === null}
          >
            Tümü
          </FilterChip>
          {FILTERS.map((f) => (
            <FilterChip
              key={f}
              href={rosterHref({ sinav: f, koc: activeKoc })}
              active={activeFilter === f}
            >
              {f}
            </FilterChip>
          ))}
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Koça göre:
            </span>
            <FilterChip
              href={rosterHref({ sinav: activeFilter })}
              active={activeKoc === null}
            >
              Tümü
            </FilterChip>
            {coaches.map((c) => (
              <FilterChip
                key={c.id}
                href={rosterHref({ sinav: activeFilter, koc: c.id })}
                active={activeKoc === c.id}
              >
                {c.name}
              </FilterChip>
            ))}
            <FilterChip
              href={rosterHref({ sinav: activeFilter, koc: KOC_YOK })}
              active={activeKoc === KOC_YOK}
            >
              Atanmamış{unassignedCount > 0 ? ` · ${formatInt(unassignedCount)}` : ""}
            </FilterChip>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-14 text-center ring-1 ring-foreground/10">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/10">
            <UsersIcon className="size-5 text-primary" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-heading text-lg font-semibold">
              {activeKoc
                ? "Bu filtrede öğrenci yok"
                : activeFilter
                  ? `${activeFilter} öğrencisi yok`
                  : isAdmin
                    ? "Henüz öğrenci yok"
                    : "Sana atanmış öğrenci yok"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? "İlk öğrencini ekle, davet linkini WhatsApp'tan gönder."
                : "Yönetici öğrenci ataması yaptığında burada görünür."}
            </p>
          </div>
          <Button render={<Link href="/koc/ogrenciler/yeni" />}>
            <PlusIcon data-icon="inline-start" />
            Yeni öğrenci
          </Button>
        </div>
      ) : (
        <RosterTable
          rows={rows.map((r) => ({
            studentId: r.studentId,
            enrollmentId: r.enrollmentId,
            fullName: r.fullName,
            phone: r.phone,
            examCode: r.examCode,
            trackCode: r.trackCode,
            targetText: r.targetText,
            weekQuestionTotal: r.weekQuestionTotal,
            staleDays: r.staleDays,
            inviteAccepted: r.inviteAccepted,
            inviteCode: r.inviteCode,
            coachUserId: r.coachUserId,
          }))}
          coaches={coaches.map((c) => ({ id: c.id, name: c.name }))}
          isAdmin={isAdmin}
        />
      )}

      {isAdmin && hidden.length > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-heading text-lg font-semibold">
              Gizlenen öğrenciler · {formatInt(hidden.length)}
            </h2>
            <p className="text-sm text-muted-foreground">
              Bu öğrenciler tüm ekranlardan gizli ve sisteme giremez. Geri
              getirince yeniden aktifleşir; verileri hiç silinmedi.
            </p>
          </div>
          <ul className="flex flex-col divide-y divide-foreground/5">
            {hidden.map((h) => (
              <li
                key={h.studentId}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{h.fullName}</span>
                  <span className="text-xs text-muted-foreground">
                    {h.examCode ?? "—"} ·{" "}
                    {HIDDEN_DATE_FMT.format(h.deletedAt)} tarihinde gizlendi
                  </span>
                </div>
                <RestoreStudentButton
                  studentId={h.studentId}
                  fullName={h.fullName}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
      )}
    >
      {children}
    </Link>
  );
}
