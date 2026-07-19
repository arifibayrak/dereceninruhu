"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EyeOffIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";

import { hideStudent, restoreStudent } from "@/actions/students";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Yönetici: öğrenciyi gizler (soft-delete) — onay diyaloğu ile. Başarıda kadro
 * listesine döner. Öğrenci tüm ekranlardan kalkar ve sisteme giremez.
 */
export function HideStudentButton({
  studentId,
  fullName,
}: {
  studentId: number;
  fullName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const firstName = fullName.split(" ")[0];

  const doHide = () => {
    startTransition(async () => {
      const res = await hideStudent({ studentId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${firstName} gizlendi.`);
      setOpen(false);
      router.push("/koc/ogrenciler");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="destructive"
            size="sm"
            aria-label={`${firstName} gizle`}
          />
        }
      >
        <EyeOffIcon data-icon="inline-start" />
        Gizle
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Öğrenciyi gizle</DialogTitle>
          <DialogDescription>
            {fullName} tüm koç ekranlarından kalkar ve sisteme giremez — açık
            oturumu hemen kapanır. Verileri silinmez; “Gizlenen öğrenciler”den
            istediğin zaman geri getirebilirsin.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" size="sm" />}>
            Vazgeç
          </DialogClose>
          <Button
            variant="destructive"
            size="sm"
            onClick={doHide}
            disabled={pending}
          >
            <EyeOffIcon data-icon="inline-start" />
            {pending ? "Gizleniyor…" : "Gizle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Yönetici: gizlenen öğrenciyi geri getirir (yeniden aktifleşir). */
export function RestoreStudentButton({
  studentId,
  fullName,
}: {
  studentId: number;
  fullName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const firstName = fullName.split(" ")[0];

  const doRestore = () => {
    startTransition(async () => {
      const res = await restoreStudent({ studentId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${firstName} geri getirildi.`);
      router.refresh();
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={doRestore} disabled={pending}>
      <RotateCcwIcon data-icon="inline-start" />
      {pending ? "Getiriliyor…" : "Geri getir"}
    </Button>
  );
}
