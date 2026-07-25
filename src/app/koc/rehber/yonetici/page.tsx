import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { getViewer } from "@/lib/session";
import { yoneticiRehberi } from "@/lib/rehber/yonetici";
import { GuidePage } from "@/components/rehber/guide-page";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Yönetici rehberi" };

// Oturum (D1) okunur → istek başına render.
export const dynamic = "force-dynamic";

export default async function YoneticiRehberPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  // Yönetici olmayan koç buraya hiç giremez — içerik de gönderilmez.
  if (viewer.role !== "admin") redirect("/koc/rehber");

  return (
    <GuidePage
      guide={yoneticiRehberi}
      variant="koc"
      storageKey="dr:rehber:yonetici:v1"
      intro={
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          render={<Link href="/koc/rehber" />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Koç rehberine dön
        </Button>
      }
    />
  );
}
