"use client";

import { useState, useTransition } from "react";

import Link from "next/link";
import { CopyCheckIcon, KeyRoundIcon, MergeIcon, PhoneIcon } from "lucide-react";
import { toast } from "sonner";

import { useRefresh } from "@/lib/use-refresh";
import { callAction } from "@/lib/action-client";
import { mergeStudents } from "@/actions/merge-students";
import type { DuplicateGroup } from "@/db/queries/students";
import { formatInt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Yönetici: yinelenen öğrenci kayıtları paneli. Aynı telefonda birden çok kayıt
 * girişi kırar (PIN yanlış kayda sıfırlanır, veri ikiye bölünür) — burada
 * kalacak kaydı seçip birleştirilir. Veri silinmez; eski kayıt gizlenir.
 */
export function DuplicateStudents({ groups }: { groups: DuplicateGroup[] }) {
  const phoneCount = groups.filter((g) => g.kind === "phone").length;

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-warning/30">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-heading text-lg font-semibold">
          Yinelenen kayıtlar · {formatInt(groups.length)}
        </h2>
        <p className="text-sm text-muted-foreground">
          {phoneCount > 0
            ? `${formatInt(phoneCount)} numarada birden çok kayıt var — öğrencinin verisi bölünür ve PIN yanlış kayda sıfırlandığı için giriş yapamaz. `
            : ""}
          Kalacak kaydı seçin (varsayılan: en çok verisi olan): diğerinin tüm
          soru/deneme/ödeme verisi ona taşınır, giriş hesabı da kalan kayda
          bağlanır, eski kayıt gizlenir (silinmez).
        </p>
      </div>
      <ul className="flex flex-col divide-y divide-foreground/5">
        {groups.map((g) => (
          <GroupRow key={`${g.kind}:${g.key}`} group={g} />
        ))}
      </ul>
    </section>
  );
}

function GroupRow({ group }: { group: DuplicateGroup }) {
  const { refresh } = useRefresh();
  const [keepId, setKeepId] = useState(group.students[0].studentId);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const keep = group.students.find((s) => s.studentId === keepId)!;
  const drops = group.students.filter((s) => s.studentId !== keepId);

  const doMerge = () => {
    startTransition(async () => {
      for (const d of drops) {
        const res = await callAction(mergeStudents, {
          keepStudentId: keepId,
          dropStudentId: d.studentId,
        });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
      }
      toast.success(`${keep.fullName} kayıtları birleştirildi.`);
      setOpen(false);
      refresh();
    });
  };

  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium">
          {group.kind === "phone" ? (
            <PhoneIcon className="size-3.5 text-warning" />
          ) : (
            <CopyCheckIcon className="size-3.5 text-muted-foreground" />
          )}
          {group.label}
        </span>
        <span className="text-xs text-muted-foreground">
          {group.kind === "phone"
            ? "aynı telefon — giriş kırılıyor"
            : "aynı ad, telefon yok — muhtemel çift kayıt"}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        {group.students.map((s) => (
          <label
            key={s.studentId}
            className="flex flex-wrap items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/60"
          >
            <input
              type="radio"
              name={`keep-${group.kind}-${group.key}`}
              checked={s.studentId === keepId}
              onChange={() => setKeepId(s.studentId)}
              className="size-4 accent-primary"
            />
            <Link
              href={`/koc/ogrenciler/${s.studentId}`}
              className="font-medium hover:text-primary"
            >
              {s.fullName}
            </Link>
            <span className="text-xs text-muted-foreground">
              #{s.studentId}
              {s.examCode ? ` · ${s.examCode}` : ""} ·{" "}
              {formatInt(s.entryCount)} kayıt
            </span>
            {s.hasAccount && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                <KeyRoundIcon className="size-3" />
                hesabı var
              </span>
            )}
          </label>
        ))}
      </div>

      <div>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <MergeIcon data-icon="inline-start" />
          Seçileni koru, birleştir
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kayıtları birleştir</DialogTitle>
            <DialogDescription>
              <strong>{keep.fullName}</strong> (#{keep.studentId}) kalacak.{" "}
              {drops.map((d) => `#${d.studentId}`).join(", ")} kaydındaki tüm
              soru, deneme, plan ve ödeme verisi bu kayda taşınacak; eski
              kayıt(lar) gizlenecek. Veri silinmez, bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="sm" />}>
              Vazgeç
            </DialogClose>
            <Button size="sm" onClick={doMerge} disabled={pending}>
              <MergeIcon data-icon="inline-start" />
              {pending ? "Birleştiriliyor…" : "Birleştir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}
