import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { getViewer } from "@/lib/session";
import { ReconcileForm } from "@/components/app/reconcile-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Ekstre mutabakatı" };

/** Yönetici — banka ekstresinden gelen havaleleri öğrencilerle eşleştir + kaydet. */
export default async function MutabakatPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  if (viewer.role !== "admin") redirect("/koc/muhasebe");

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        render={<Link href="/koc/muhasebe" />}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        Muhasebe
      </Button>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-title">Ekstre mutabakatı</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Banka hesap ekstreni CSV olarak yükle ya da yapıştır; gelen havaleler
          gönderen adına göre öğrencilerle eşleştirilir. Eşleşmeleri incele,
          düzelt ve onayladıklarını havale ödemesi olarak kaydet. Tutar ve
          eşleşmeyi onaylamadan hiçbir şey yazılmaz.
        </p>
      </div>
      <ReconcileForm data-tour="mutabakat-form" />
    </div>
  );
}
