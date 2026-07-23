import type { Metadata } from "next";

import { KonularTab } from "../konular-tab";
import { CockpitShell, resolveCockpit } from "../_cockpit";

export const metadata: Metadata = { title: "Konular" };

export default async function KonularPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studentId = Number(id);
  const { enrollment } = await resolveCockpit(studentId);

  return (
    <>
      <CockpitShell studentId={studentId} active="konular" />
      <KonularTab
        enrollmentId={enrollment.id}
        examTemplateId={enrollment.examTemplateId}
        trackCode={enrollment.trackCode}
      />
    </>
  );
}
