"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { deleteMock, loadMockForEdit } from "@/actions/tracking";
import type { MockEditPayload } from "@/db/queries/tracking";
import { MockForm } from "@/components/app/mock-form";
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
 * Bir deneme satırının düzenle + sil düğmeleri. Form verisi (kayıt + o sınavın
 * ders ızgarası) düzenlemeye basıldığında sunucudan iner — liste sayfaları
 * yüzlerce satır olabildiği için hiçbir şey peşin taşınmaz. Bu yüzden aynı
 * bileşen her yüzeyde çalışır: öğrenci listesi, kokpit, haftalık pano.
 */
export function MockActions({
  mockExamId,
  label,
}: {
  mockExamId: number;
  /** Silme onayında ve erişilebilirlik etiketlerinde görünen deneme adı. */
  label: string;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [payload, setPayload] = useState<MockEditPayload | null>(null);
  const [busy, setBusy] = useState(false);

  const openEdit = async () => {
    // Her açılışta taze çek — düzenleme sonrası eski değerleri göstermemek için.
    setPayload(null);
    setEditOpen(true);
    const res = await loadMockForEdit(mockExamId);
    if (!res.ok) {
      toast.error(res.error);
      setEditOpen(false);
      return;
    }
    setPayload(res.data);
  };

  const remove = async () => {
    setBusy(true);
    const res = await deleteMock(mockExamId);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setConfirmOpen(false);
    toast.success("Deneme silindi");
    router.refresh();
  };

  return (
    <>
      <span className="inline-flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`${label} denemesini düzenle`}
          onClick={openEdit}
        >
          <PencilIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`${label} denemesini sil`}
          className="text-muted-foreground hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2Icon />
        </Button>
      </span>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Denemeyi düzenle</DialogTitle>
            <DialogDescription>
              Sayıları düzelt — net yeniden hesaplanır.
            </DialogDescription>
          </DialogHeader>
          {payload ? (
            <MockForm
              enrollmentId={payload.mock.enrollmentId}
              sections={payload.sections}
              initial={payload.mock}
              onSuccess={() => {
                setEditOpen(false);
                router.refresh();
              }}
            />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Yükleniyor…
            </p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Denemeyi sil</DialogTitle>
            <DialogDescription>
              <strong>{label}</strong> kaydı, tüm ders netleri ve varsa konu
              analizi silinecek. Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="sm" />}>
              Vazgeç
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={remove}
            >
              <Trash2Icon data-icon="inline-start" />
              {busy ? "Siliniyor…" : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
