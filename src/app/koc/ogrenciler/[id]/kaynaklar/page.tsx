import type { Metadata } from "next";

import { KaynaklarTab } from "../kaynaklar-tab";
import { CockpitShell, resolveCockpit } from "../_cockpit";

export const metadata: Metadata = { title: "Kaynaklar" };

export default async function KaynaklarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studentId = Number(id);
  const { enrollment } = await resolveCockpit(studentId);

  return (
    <>
      <CockpitShell studentId={studentId} active="kaynaklar" />
      <KaynaklarTab enrollmentId={enrollment.id} exam={enrollment} />
    </>
  );
}
