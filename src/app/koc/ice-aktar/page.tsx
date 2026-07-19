import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getViewer } from "@/lib/session";
import { RosterImportForm } from "@/components/app/roster-import-form";
import { SectionHeading } from "@/components/brand/section-heading";

export const metadata: Metadata = { title: "Kadro içe aktar" };

/** Kadro CSV içe aktarımı + eşitleme — yalnız yönetici. */
export default async function IceAktarPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  if (viewer.role !== "admin") redirect("/koc");

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading
        eyebrow="Kadro"
        title="Listeyi içe aktar ve eşitle"
        description="Güncel öğrenci listesini CSV olarak yapıştır veya yükle. Telefon numarasına göre eşleştirilir: yeni numaralar eklenir, mevcut kayıtlar güncellenir, listede olmayan aktif öğrenciler pasife alınır. Önce 'Önizle' ile ne olacağını gör."
      />

      <div className="rounded-2xl bg-muted/40 p-4 text-sm ring-1 ring-foreground/10">
        <p className="font-semibold">CSV biçimi</p>
        <p className="mt-1 text-muted-foreground">
          İlk satır başlıklar olmalı. Beklenen sütunlar (Türkçe başlıklar da
          kabul edilir):
        </p>
        <code className="mt-2 block overflow-x-auto rounded-lg bg-card px-3 py-2 font-mono text-xs">
          fullName,phone,examCode,trackCode,targetText,grade,status
        </code>
        <ul className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
          <li>
            <b>phone</b>: TR cep (05XX… / 5XX…). Numarası olmayan öğrenci içe
            aktarılamaz ve pasife de alınmaz.
          </li>
          <li>
            <b>examCode</b>: KPSS / YKS / LGS. YKS için <b>trackCode</b> (SAY /
            EA / SOZ) gerekli.
          </li>
          <li>
            <b>status</b>: aktif / pasif / mezun (boşsa <b>aktif</b>). Not:{" "}
            <b>grade</b> (sınıf; ör. 12, mezun) öğrencinin durumunu belirlemez.
          </li>
        </ul>
      </div>

      <RosterImportForm />
    </div>
  );
}
