"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";

import { MockForm, type MockSection } from "@/components/app/mock-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Koç kokpiti — "Yeni deneme" diyaloğu (kayıtta kapanır + listeyi tazeler). */
export function MockCreateDialog({
  enrollmentId,
  sections,
  combinedLabel,
}: {
  enrollmentId: number;
  sections: MockSection[];
  combinedLabel?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon data-icon="inline-start" />
        Yeni deneme
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Yeni deneme</DialogTitle>
          <DialogDescription>
            Doğru ve yanlış sayılarını gir; neti biz hesaplayalım.
          </DialogDescription>
        </DialogHeader>
        <MockForm
          enrollmentId={enrollmentId}
          sections={sections}
          combinedLabel={combinedLabel}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
