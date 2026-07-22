"use client";

import { useState } from "react";
import { CopyIcon, KeyRoundIcon, MessageCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { resetStudentPin, type PinResetResult } from "@/actions/pin";
import { buildWaLink, waTemplates } from "@/lib/whatsapp";
import {
  CopyInviteButton,
  WaInviteButton,
} from "@/components/app/invite-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

/** Koç: öğrencinin PIN'ini sıfırlar (hesabı varsa) ya da davetini yeniler. */
export function PinResetButton({
  studentId,
  phone,
  fullName,
  inviteAccepted,
}: {
  studentId: number;
  phone: string | null;
  fullName: string;
  inviteAccepted: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<PinResetResult | null>(null);
  const firstName = fullName.split(" ")[0];

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      // Kapanışta sonucu temizle (PIN ekranda kalmasın).
      setResult(null);
      setPin("");
      setLoading(false);
    }
  };

  const doReset = async () => {
    if (pin && !/^\d{4,6}$/.test(pin)) {
      toast.error("PIN 4-6 rakam olmalı.");
      return;
    }
    setLoading(true);
    const res = await resetStudentPin({ studentId, pin });
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setResult(res.data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="xs" aria-label={`${firstName} PIN sıfırla`} />
        }
      >
        <KeyRoundIcon data-icon="inline-start" />
        PIN
      </DialogTrigger>
      <DialogContent>
        {result ? (
          result.mode === "reset" ? (
            <>
              <DialogHeader>
                <DialogTitle>Yeni PIN hazır</DialogTitle>
                <DialogDescription>
                  {firstName} bu PIN ile telefonundan giriş yapar. Eski PIN
                  artık geçersiz — PIN&apos;i ilet.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-center rounded-xl bg-muted py-4 font-mono text-3xl font-semibold tracking-[0.3em]">
                {result.pin}
              </div>
              <DialogFooter className="sm:justify-start">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(result.pin);
                      toast.success("PIN kopyalandı");
                    } catch {
                      toast.error("Kopyalanamadı");
                    }
                  }}
                >
                  <CopyIcon data-icon="inline-start" />
                  PIN&apos;i kopyala
                </Button>
                {phone && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const message = waTemplates.pinSifirla({
                        studentName: firstName,
                        pin: result.pin,
                      });
                      window.open(
                        buildWaLink(phone, message),
                        "_blank",
                        "noopener",
                      );
                    }}
                  >
                    <MessageCircleIcon data-icon="inline-start" />
                    WhatsApp&apos;tan gönder
                  </Button>
                )}
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Yeni davet linki hazır</DialogTitle>
                <DialogDescription>
                  {firstName} henüz PIN belirlememiş. Aşağıdaki linkten PIN
                  belirleyip başlayabilir.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap items-center gap-1.5">
                <CopyInviteButton invitePath={result.invitePath} size="sm" />
                {phone && (
                  <WaInviteButton
                    phone={phone}
                    studentName={firstName}
                    invitePath={result.invitePath}
                    size="sm"
                  />
                )}
              </div>
            </>
          )
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>PIN&apos;i sıfırla</DialogTitle>
              <DialogDescription>
                {inviteAccepted
                  ? `${firstName} için PIN yenilenecek ve mevcut PIN geçersiz olacak. Girişi kayıttaki telefon numarasına da yeniden eşitlenir.`
                  : `${firstName} henüz hesabını açmamış — yeni bir davet linki üretilecek.`}
              </DialogDescription>
            </DialogHeader>
            {inviteAccepted && (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={`pin-${studentId}`}
                  className="text-sm font-medium"
                >
                  PIN belirle{" "}
                  <span className="font-normal text-muted-foreground">
                    (boş bırakırsan rastgele üretilir)
                  </span>
                </label>
                <Input
                  id={`pin-${studentId}`}
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="off"
                  placeholder="Örn. 1234"
                  value={pin}
                  onChange={(e) =>
                    setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="h-11 font-mono tracking-[0.3em]"
                />
              </div>
            )}
            <DialogFooter>
              <DialogClose render={<Button variant="outline" size="sm" />}>
                Vazgeç
              </DialogClose>
              <Button size="sm" onClick={doReset} disabled={loading}>
                <KeyRoundIcon data-icon="inline-start" />
                {loading ? "Sıfırlanıyor…" : "Sıfırla"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
