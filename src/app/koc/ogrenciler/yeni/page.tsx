import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import {
  StudentCreateForm,
  type StudentPrefill,
} from "@/components/app/student-create-form";
import { SectionHeading } from "@/components/brand/section-heading";
import { EXAM_CODES } from "@/lib/tracks";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Yeni Öğrenci" };

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v.trim() !== "" ? v : undefined;
}

export default async function YeniOgrenciPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Lead'den "Öğrenciye çevir": ?ad=…&telefon=…&sinav=… ile ön dolgu.
  const sp = await searchParams;
  const sinav = str(sp.sinav);
  const prefill: StudentPrefill = {
    fullName: str(sp.ad),
    phone: str(sp.telefon),
    examCode:
      EXAM_CODES.find((c) => c === sinav),
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          render={<Link href="/koc/ogrenciler" />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Öğrenciler
        </Button>
        <SectionHeading
          eyebrow="Kadro"
          title="Yeni öğrenci"
          description="Öğrenciyi oluştur; ardından WhatsApp davet linkiyle hesabını açsın."
        />
      </div>
      <div className="max-w-2xl">
        <StudentCreateForm prefill={prefill} />
      </div>
    </>
  );
}
