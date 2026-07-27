import type { Metadata } from "next";

import { listCoaches } from "@/db/queries/admin";
import { CoachAssignSelect } from "@/components/app/coach-assign-select";
import { SecondaryExamSelect } from "@/components/app/secondary-exam-select";
import { StudentProfileForm } from "@/components/app/student-profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CockpitShell, resolveCockpit } from "../_cockpit";

export const metadata: Metadata = { title: "Profil" };

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function ProfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studentId = Number(id);
  const { student, enrollment, isAdmin } = await resolveCockpit(studentId);
  const coaches = isAdmin ? await listCoaches() : [];

  return (
    <>
      <CockpitShell studentId={studentId} active="profil" />
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Öğrenci bilgilerini düzenle.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2 text-sm">
            {isAdmin ? (
              <>
                <dt className="self-center text-muted-foreground">Koç</dt>
                <dd>
                  <CoachAssignSelect
                    key={enrollment.coachUserId ?? "koc-yok"}
                    enrollmentId={enrollment.id}
                    coachUserId={enrollment.coachUserId}
                    coaches={coaches.map((c) => ({ id: c.id, name: c.name }))}
                  />
                </dd>
              </>
            ) : (
              <ProfileRow label="Koç" value={enrollment.coachName} />
            )}
            <dt className="self-center text-muted-foreground">Sınav</dt>
            <dd className="py-1 text-sm">
              {enrollment.examCode}
              {enrollment.trackName ? ` · ${enrollment.trackName}` : ""}
            </dd>
            <dt className="self-center text-muted-foreground">İkinci sınav</dt>
            <dd>
              <SecondaryExamSelect
                studentId={studentId}
                primaryExamCode={enrollment.examCode}
                secondaryExamCode={enrollment.secondaryExamCode}
                secondaryTrackCode={enrollment.secondaryTrackCode}
              />
            </dd>
            <ProfileRow
              label="Başlangıç"
              value={
                enrollment.startDate ? dateFmt.format(enrollment.startDate) : null
              }
            />
          </dl>
          <StudentProfileForm
            variant="coach"
            studentId={studentId}
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
    </>
  );
}

function ProfileRow({ label, value }: { label: string; value: string | null }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value?.trim() || "—"}</dd>
    </>
  );
}
