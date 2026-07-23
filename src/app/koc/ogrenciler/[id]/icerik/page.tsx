import type { Metadata } from "next";

import { IcerikTab } from "../icerik-tab";
import { CockpitShell, resolveCockpit } from "../_cockpit";

export const metadata: Metadata = { title: "İçerik" };

export default async function IcerikPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studentId = Number(id);
  const { student, enrollment } = await resolveCockpit(studentId);

  return (
    <>
      <CockpitShell studentId={studentId} active="icerik" />
      <IcerikTab
        enrollmentId={enrollment.id}
        examTemplateId={enrollment.examTemplateId}
        studentName={student.fullName}
      />
    </>
  );
}
