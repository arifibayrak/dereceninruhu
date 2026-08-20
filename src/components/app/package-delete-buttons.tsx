"use client";

import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  deleteEnrollmentPackage,
  deletePrivateLesson,
} from "@/actions/paketler";
import { callAction } from "@/lib/action-client";
import { useRefresh } from "@/lib/use-refresh";
import { Button } from "@/components/ui/button";

/**
 * Paket atamasını siler.
 *
 * Onay penceresi bilinçli: silinen atama, ona bağlı derslerin hak sayacını da
 * düşürür. Dersler SİLİNMEZ — verilmiş bir ders gerçektir; yalnız "pakete bağlı
 * değil" (ekstra ders) durumuna düşerler.
 */
export function PackageDeleteButton({
  enrollmentPackageId,
  name,
}: {
  enrollmentPackageId: number;
  name: string;
}) {
  const { refresh } = useRefresh();

  const remove = async () => {
    if (
      !window.confirm(
        `"${name}" ataması silinsin mi? Bu pakete işlenen dersler silinmez, "ekstra ders" olarak kalır.`,
      )
    ) {
      return;
    }
    const res = await callAction(deleteEnrollmentPackage, {
      enrollmentPackageId,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Paket ataması silindi");
    refresh();
  };

  return (
    <Button variant="ghost" size="icon-sm" aria-label="Paketi sil" onClick={remove}>
      <Trash2Icon className="text-destructive" />
    </Button>
  );
}

export function LessonDeleteButton({
  lessonId,
  label,
}: {
  lessonId: number;
  label: string;
}) {
  const { refresh } = useRefresh();

  const remove = async () => {
    if (!window.confirm(`${label} dersi silinsin mi?`)) return;
    const res = await callAction(deletePrivateLesson, { lessonId });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Ders silindi");
    refresh();
  };

  return (
    <Button variant="ghost" size="icon-sm" aria-label="Dersi sil" onClick={remove}>
      <Trash2Icon className="text-destructive" />
    </Button>
  );
}
