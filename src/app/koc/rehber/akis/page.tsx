import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getViewer } from "@/lib/session";
import { FlowPage } from "@/components/rehber/flow-page";

export const metadata: Metadata = { title: "Akış" };

// Oturum (D1) okunur → istek başına render.
export const dynamic = "force-dynamic";

export default async function KocAkisPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  if (viewer.role !== "coach" && viewer.role !== "admin") redirect("/ogrenci");

  return <FlowPage guideBase="/koc/rehber" />;
}
