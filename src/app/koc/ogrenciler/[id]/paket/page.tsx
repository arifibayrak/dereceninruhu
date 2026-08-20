import type { Metadata } from "next";

import { PaketTab } from "../paket-tab";
import { CockpitShell, resolveCockpit } from "../_cockpit";

export const metadata: Metadata = { title: "Paket & Ders" };

export default async function PaketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studentId = Number(id);
  const { enrollment } = await resolveCockpit(studentId);

  return (
    <>
      <CockpitShell studentId={studentId} active="paket" />
      <PaketTab enrollment={enrollment} />
    </>
  );
}
