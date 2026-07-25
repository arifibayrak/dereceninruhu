import type { Metadata } from "next";

import { FlowPage } from "@/components/rehber/flow-page";

export const metadata: Metadata = { title: "Akış" };

export default function OgrenciAkisPage() {
  return <FlowPage guideBase="/ogrenci/rehber" />;
}
