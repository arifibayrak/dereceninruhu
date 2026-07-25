"use client";

import { CheckIcon } from "lucide-react";

import { useRehberProgress } from "@/components/rehber/progress-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Bölüm sonundaki "Okudum" imi — sunucuda basılan bölümün içine gömülür. */
export function SectionReadToggle({ sectionId }: { sectionId: string }) {
  const { read, toggle } = useRehberProgress();
  const isRead = read.has(sectionId);

  return (
    <Button
      variant={isRead ? "secondary" : "outline"}
      size="sm"
      className="w-fit"
      aria-pressed={isRead}
      onClick={() => toggle(sectionId)}
    >
      <CheckIcon
        data-icon="inline-start"
        className={cn(!isRead && "opacity-40")}
      />
      {isRead ? "Okundu" : "Okudum"}
    </Button>
  );
}
