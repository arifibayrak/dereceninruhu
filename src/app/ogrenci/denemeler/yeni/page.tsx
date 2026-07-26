import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import {
  getEnrollmentDetailByUserId,
  getSectionsForEnrollment,
} from "@/db/queries/enrollment";
import { combinedMockLabel } from "@/lib/exam";
import { getCurrentUser, type Role } from "@/lib/session";
import { MockForm, type MockSection } from "@/components/app/mock-form";
import { NoEnrollmentCard } from "@/components/app/no-enrollment";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Yeni Deneme" };

export default async function YeniDenemePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const role = (user as { role?: Role }).role ?? "student";

  const detail = await getEnrollmentDetailByUserId(user.id);
  if (!detail) {
    return <NoEnrollmentCard isCoach={role === "coach" || role === "admin"} />;
  }
  const { enrollment } = detail;
  const sections = await getSectionsForEnrollment(
    enrollment.examTemplateId,
    enrollment.trackCode,
  );
  const mockSections: MockSection[] = sections.map((s) => ({
    id: s.id,
    name: s.name,
    wrongPenaltyDivisor: s.wrongPenaltyDivisor,
    subjects: s.loggable.map((sub) => ({
      id: sub.id,
      name: sub.name,
      isScored: sub.isScored,
      parentSubjectId: sub.parentSubjectId,
      officialQuestionCount: sub.officialQuestionCount,
    })),
  }));

  return (
    <>
      <div className="flex flex-col gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          render={<Link href="/ogrenci/denemeler" />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Denemeler
        </Button>
        <h1 className="font-heading text-title">Yeni deneme</h1>
        <p className="text-sm text-muted-foreground">
          Doğru / yanlış / boş sayılarını gir — net otomatik hesaplanır.
        </p>
      </div>
      <MockForm
        enrollmentId={enrollment.id}
        sections={mockSections}
        combinedLabel={combinedMockLabel(enrollment.examCode)}
        redirectTo="/ogrenci/denemeler"
      />
    </>
  );
}
