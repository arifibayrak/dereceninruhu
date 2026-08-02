"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { callAction } from "@/lib/action-client";
import { deleteStudyLog } from "@/actions/study";
import { Button } from "@/components/ui/button";

export function StudyLogDelete({ id }: { id: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onDelete = async () => {
    setBusy(true);
    const res = await callAction(deleteStudyLog, id);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Kayıt silindi");
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Kaydı sil"
      disabled={busy}
      onClick={onDelete}
    >
      <Trash2Icon className="size-4" />
    </Button>
  );
}
