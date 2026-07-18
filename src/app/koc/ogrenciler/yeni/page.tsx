import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { StudentCreateForm } from "@/components/app/student-create-form";
import { SectionHeading } from "@/components/brand/section-heading";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Yeni Öğrenci" };

export default function YeniOgrenciPage() {
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
        <StudentCreateForm />
      </div>
    </>
  );
}
