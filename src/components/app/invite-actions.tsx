"use client";

import { CopyIcon, MessageCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { buildWaLink, waTemplates } from "@/lib/whatsapp";

/** Davet linkini panoya kopyalar (origin istemcide çözülür). */
export function CopyInviteButton({
  invitePath,
  size = "xs",
  label = "Linki kopyala",
}: {
  invitePath: string;
  size?: "xs" | "sm" | "default" | "lg";
  label?: string;
}) {
  return (
    <Button
      variant="outline"
      size={size}
      onClick={async () => {
        const url = new URL(invitePath, window.location.origin).toString();
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Davet linki kopyalandı");
        } catch {
          toast.error("Kopyalanamadı", { description: url });
        }
      }}
    >
      <CopyIcon data-icon="inline-start" />
      {label}
    </Button>
  );
}

/** Daveti WhatsApp'tan gönder — wa.me linki, mesaj + davet URL'i hazır. */
export function WaInviteButton({
  phone,
  studentName,
  invitePath,
  size = "xs",
}: {
  phone: string;
  studentName: string;
  invitePath: string;
  size?: "xs" | "sm" | "default" | "lg";
}) {
  return (
    <Button
      variant="outline"
      size={size}
      onClick={() => {
        const url = new URL(invitePath, window.location.origin).toString();
        const message = `${waTemplates.davet({ studentName })}\n${url}`;
        window.open(buildWaLink(phone, message), "_blank", "noopener");
      }}
    >
      <MessageCircleIcon data-icon="inline-start" />
      WhatsApp&apos;tan gönder
    </Button>
  );
}
