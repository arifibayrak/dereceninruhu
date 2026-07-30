"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheckIcon, Trash2Icon, UsersIcon } from "lucide-react";
import { toast } from "sonner";

import {
  assignContent,
  deleteContentItem,
  toggleContentViewed,
} from "@/actions/icerik";
import {
  StudentAssignPicker,
  type AssignableStudent,
} from "@/components/app/student-assign-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type AssignOption = AssignableStudent;

/** Koç: içeriği öğrencilere atama diyaloğu (küme değiştirme). */
export function ContentAssignDialog({
  contentItemId,
  title,
  students,
  assignedEnrollmentIds,
}: {
  contentItemId: number;
  title: string;
  students: AssignOption[];
  assignedEnrollmentIds: number[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ids, setIds] = useState<number[]>(assignedEnrollmentIds);

  const save = async () => {
    setSaving(true);
    const res = await assignContent({ contentItemId, enrollmentIds: ids });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(
      ids.length === 0
        ? "Atamalar kaldırıldı"
        : `${ids.length} öğrenciye atandı`,
    );
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Her açılışta kayıtlı kümeye dön (kaydetmeden kapatılan seçim kalmasın).
        if (next) setIds(assignedEnrollmentIds);
      }}
    >
      <DialogTrigger
        render={<Button variant="outline" size="xs" aria-label="Öğrencilere ata" />}
      >
        <UsersIcon data-icon="inline-start" />
        Ata ({assignedEnrollmentIds.length})
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Öğrencilere ata</DialogTitle>
          <DialogDescription className="truncate">{title}</DialogDescription>
        </DialogHeader>
        <StudentAssignPicker
          students={students}
          value={ids}
          onChange={setIds}
        />
        <Button onClick={save} disabled={saving} className="self-start">
          {saving ? "Kaydediliyor…" : "Atamaları kaydet"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

/** Koç: içeriği siler (onaylı). */
export function ContentDeleteButton({
  contentItemId,
}: {
  contentItemId: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const remove = () => {
    if (!window.confirm("Bu içerik silinsin mi? Atamalar ve izlenme kayıtları da silinir."))
      return;
    startTransition(async () => {
      const res = await deleteContentItem({ contentItemId });
      if (res.ok) {
        toast.success("İçerik silindi");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="İçeriği sil"
      disabled={pending}
      onClick={remove}
      className="text-muted-foreground hover:text-destructive"
    >
      <Trash2Icon />
    </Button>
  );
}

/** Öğrenci: izledim/okudum işareti (geri alınabilir). */
export function ContentViewedButton({
  contentItemId,
  enrollmentId,
  viewed,
}: {
  contentItemId: number;
  enrollmentId: number;
  viewed: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      const res = await toggleContentViewed({
        contentItemId,
        enrollmentId,
        viewed: !viewed,
      });
      if (res.ok) {
        toast.success(!viewed ? "İzlendi olarak işaretlendi 🎉" : "İşaret kaldırıldı");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Button
      variant={viewed ? "ghost" : "outline"}
      size="xs"
      disabled={pending}
      onClick={toggle}
      className={viewed ? "text-success hover:text-success" : undefined}
    >
      <CircleCheckIcon data-icon="inline-start" />
      {viewed ? "İzlendi" : "İzledim işaretle"}
    </Button>
  );
}
