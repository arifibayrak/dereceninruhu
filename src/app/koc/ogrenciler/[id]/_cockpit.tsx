import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { getEnrollmentDetailByStudentId } from "@/db/queries/enrollment";
import { listMessageTemplates } from "@/db/queries/message-templates";
import { getViewer } from "@/lib/session";
import { cn } from "@/lib/utils";
import { HideStudentButton } from "@/components/app/hide-student-actions";
import {
  CopyInviteButton,
  WaInviteButton,
} from "@/components/app/invite-actions";
import { StudentWaButton } from "@/components/app/student-wa-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** Kokpit sekmeleri — ikincil gezinme sırası. */
const NAV = [
  { seg: "", label: "Genel Bakış" },
  { seg: "soru-takibi", label: "Soru Takibi" },
  { seg: "denemeler", label: "Denemeler" },
  { seg: "program", label: "Program" },
  { seg: "gorusmeler", label: "Görüşmeler" },
  { seg: "konular", label: "Konular" },
  { seg: "kaynaklar", label: "Kaynaklar" },
  { seg: "icerik", label: "İçerik" },
  { seg: "muhasebe", label: "Muhasebe" },
  { seg: "profil", label: "Profil" },
] as const;

export type CockpitSeg = (typeof NAV)[number]["seg"];

/**
 * Öğrenci + kayıt çözümü ve rol kapısı — kokpit sayfalarının hepsi çağırır.
 * React cache: aynı istekte kabuk + sayfa tek sorguyu paylaşır.
 */
export const resolveCockpit = cache(async (studentId: number) => {
  if (!Number.isInteger(studentId) || studentId <= 0) notFound();
  const detail = await getEnrollmentDetailByStudentId(studentId);
  if (!detail) notFound();
  const viewer = await getViewer();
  // Koç yalnız kendisine atanan öğrencinin kokpitini görür.
  if (viewer?.role === "coach" && detail.enrollment.coachUserId !== viewer.id) {
    notFound();
  }
  return { ...detail, viewer, isAdmin: viewer?.role === "admin" };
});

/**
 * Ortak kokpit kabuğu: geri butonu + öğrenci başlığı (rozetler + hızlı
 * eylemler) + ikincil sekme gezinmesi. Her kokpit sayfası en üstte render eder;
 * derin rotalar (deneme analizi, transkript) bu kabuğu KULLANMAZ.
 */
export async function CockpitShell({
  studentId,
  active,
}: {
  studentId: number;
  active: CockpitSeg;
}) {
  const { student, enrollment, isAdmin } = await resolveCockpit(studentId);
  const messageTemplates = await listMessageTemplates();
  const invitePath = student.inviteCode ? `/davet/${student.inviteCode}` : null;
  const base = `/koc/ogrenciler/${studentId}`;

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        render={<Link href="/koc/ogrenciler" />}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        Öğrenciler
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-title">{student.fullName}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {enrollment.examCode}
              {enrollment.trackName ? ` · ${enrollment.trackName}` : ""}
            </Badge>
            {student.userId ? (
              <Badge className="bg-success/10 text-success">
                Davet kabul edildi
              </Badge>
            ) : (
              <Badge className="bg-warning/10 text-warning">
                Davet bekliyor
              </Badge>
            )}
            {enrollment.coachName && (
              <Badge variant="outline">Koç: {enrollment.coachName}</Badge>
            )}
            {enrollment.targetText && (
              <span className="text-sm text-muted-foreground">
                🎯 {enrollment.targetText}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {student.phone && (
            <StudentWaButton
              phone={student.phone}
              fullName={student.fullName}
              templates={messageTemplates}
              size="lg"
            />
          )}
          {!student.userId && invitePath && (
            <>
              <CopyInviteButton invitePath={invitePath} size="lg" />
              {student.phone && (
                <WaInviteButton
                  phone={student.phone}
                  studentName={student.fullName.split(" ")[0]}
                  invitePath={invitePath}
                  size="lg"
                />
              )}
            </>
          )}
          {isAdmin && (
            <HideStudentButton
              studentId={student.id}
              fullName={student.fullName}
            />
          )}
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <nav className="inline-flex min-w-max items-center gap-1 rounded-xl bg-muted p-1">
          {NAV.map((it) => {
            const href = it.seg ? `${base}/${it.seg}` : base;
            const isActive = it.seg === active;
            return (
              <Link
                key={it.seg || "overview"}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center rounded-lg px-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-card text-foreground shadow-sm ring-1 ring-foreground/10"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
