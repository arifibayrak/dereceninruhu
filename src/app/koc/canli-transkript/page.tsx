import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getViewer } from "@/lib/session";
import { getExtensionPickerData } from "@/db/queries/sessions";
import { SectionHeading } from "@/components/brand/section-heading";
import { LiveTranscribePicker } from "@/components/app/live-transcribe-picker";

export const metadata: Metadata = { title: "Canlı transkript" };

// Oturum + öğrenci listesi (D1) — istek başına render.
export const dynamic = "force-dynamic";

export default async function CanliTranskriptPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  if (viewer.role !== "coach" && viewer.role !== "admin") redirect("/ogrenci");

  const { students } = await getExtensionPickerData({
    id: viewer.id,
    role: viewer.role,
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <SectionHeading
        eyebrow="Transkript"
        title="Canlı transkript"
        description="Öğrenci seç, Başlat'a bas ve görüşmeyi cihazında (WebGPU) canlı yazıya çevir. Ses kaydedilmez; yalnız metin kaydedilir ve AI önerileri çıkarılır."
      />

      <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <LiveTranscribePicker students={students} />
      </section>

      <p className="text-xs text-muted-foreground">
        İpucu: herhangi bir koç sayfasında{" "}
        <kbd className="rounded border px-1 font-mono">g</kbd> ardından{" "}
        <kbd className="rounded border px-1 font-mono">t</kbd> ile buraya hızlıca
        gel.
      </p>
    </div>
  );
}
