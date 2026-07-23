import type { Metadata } from "next";

import { MuhasebeTab } from "../muhasebe-tab";
import { CockpitShell, resolveCockpit } from "../_cockpit";

export const metadata: Metadata = { title: "Muhasebe" };

export default async function MuhasebePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studentId = Number(id);
  const { student, enrollment } = await resolveCockpit(studentId);

  return (
    <>
      <CockpitShell studentId={studentId} active="muhasebe" />
      <MuhasebeTab
        enrollmentId={enrollment.id}
        studentName={student.fullName}
      />
    </>
  );
}
