"use client";

/**
 * Öğrenciye WhatsApp — düzenlenebilir toplu mesaj şablonlarından seçtirir.
 * Şablonlar /koc/duyuru'daki aynı havuzdan gelir (message_templates); {ad}
 * öğrencinin adıyla değişir. Şablon yoksa düz "sohbet aç" bağlantısına düşer.
 * Gönderim yine koçun kendi WhatsApp'ından (wa.me deep-link, otomatik yok).
 */

import { ChevronDownIcon, MessageCircleIcon } from "lucide-react";

import { buildWaLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MessageTemplate } from "@/components/app/template-manager";

/** Grup görüntüleme sırası (composer ile aynı); bilinmeyen gruplar sona. */
const CATEGORY_ORDER = ["Takip", "Ödeme", "Yeni öğrenci", "Önemli"];

export function StudentWaButton({
  phone,
  fullName,
  templates,
  size = "lg",
}: {
  phone: string;
  fullName: string;
  templates: MessageTemplate[];
  size?: "xs" | "sm" | "lg" | "default";
}) {
  const first = fullName.trim().split(/\s+/)[0] || fullName;
  const active = templates.filter((t) => t.isActive);
  const personalize = (body: string) => body.replaceAll("{ad}", first);

  // Şablon yoksa sade WhatsApp bağlantısı (ön dolgu yok, sohbeti açar).
  if (active.length === 0) {
    return (
      <Button
        variant="outline"
        size={size}
        render={
          <a
            href={buildWaLink(phone)}
            target="_blank"
            rel="noopener noreferrer"
          />
        }
      >
        <MessageCircleIcon data-icon="inline-start" />
        WhatsApp
      </Button>
    );
  }

  const groups = [...new Set(active.map((t) => t.category))].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (
      (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib) || a.localeCompare(b, "tr")
    );
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size={size} />}>
        <MessageCircleIcon data-icon="inline-start" />
        WhatsApp
        <ChevronDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 w-64 overflow-y-auto">
        <DropdownMenuItem
          render={
            <a
              href={buildWaLink(phone)}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <MessageCircleIcon />
          Boş sohbet aç
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {groups.map((g) => (
          <DropdownMenuGroup key={g}>
            <DropdownMenuLabel>{g}</DropdownMenuLabel>
            {active
              .filter((t) => t.category === g)
              .map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  render={
                    <a
                      href={buildWaLink(phone, personalize(t.body))}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  {t.label}
                </DropdownMenuItem>
              ))}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
