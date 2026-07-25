import type { Metadata } from "next";

import { ogrenciRehberi } from "@/lib/rehber/ogrenci";
import { GuidePage } from "@/components/rehber/guide-page";

export const metadata: Metadata = { title: "Rehber" };

export default function OgrenciRehberPage() {
  return (
    <GuidePage
      guide={ogrenciRehberi}
      variant="ogrenci"
      storageKey="dr:rehber:ogrenci:v1"
    />
  );
}
