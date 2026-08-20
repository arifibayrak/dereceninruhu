"use client";

import { useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { SparklesIcon, XIcon } from "lucide-react";

import {
  getTourServerSnapshot,
  getTourSnapshot,
  subscribeTour,
} from "@/lib/rehber/tour-store";
import { cn } from "@/lib/utils";

/*
 * Sohbetler bir FAB'ın arkasında ama panel HER sayfada monte ediliyordu
 * (yalnız `hidden` ile gizli). Hem koç hem öğrenci sohbeti, hiç açılmasa bile
 * her gezinmede canlanıyordu. Artık kod da ilk açılışta iniyor, bileşen de o
 * an monte oluyor.
 */
const CoachAgentChat = dynamic(
  () => import("./coach-agent-chat").then((m) => m.CoachAgentChat),
  { ssr: false },
);
const StudentChat = dynamic(
  () => import("./student-chat").then((m) => m.StudentChat),
  { ssr: false },
);

type Role = "coach" | "student";

const META: Record<
  Role,
  { title: string; subtitle: string; fabLabel: string }
> = {
  coach: {
    title: "Koç Asistanı",
    subtitle: "Öğrencilerini sor, plan/soru önerisini onayla",
    fabLabel: "Koç Asistanı",
  },
  student: {
    title: "Asistan",
    subtitle: "Gelişimin hakkında sor",
    fabLabel: "Asistan",
  },
};

/**
 * Sağ-alt köşede her sayfada duran yüzen asistan.
 * - Koç: araç çağıran ajan (yazma önerileri onayla).
 * - Öğrenci: yalnız kendi verisine dayanan sohbet.
 * Panel her zaman monte kalır (kapalıyken gizli) — sohbet açıp kapatınca korunur.
 */
export function FloatingAssistant({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const meta = META[role];

  // Tur çalışırken FAB gizlenir: ikisi de sağ-alt köşeyi paylaşıyor ve
  // asistan tur kartının üstüne biniyor. Tur bitince geri gelir.
  const tourActive = useSyncExternalStore(
    subscribeTour,
    getTourSnapshot,
    getTourServerSnapshot,
  );
  if (tourActive) return null;

  // Öğrenci alt gezinme çubuğunun üstünde; koçta köşede.
  const fabPos =
    role === "student"
      ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4"
      : "bottom-6 right-6";
  const panelPos =
    role === "student"
      ? "inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-4"
      : "bottom-24 right-6";

  return (
    <>
      <div
        role="dialog"
        aria-label={meta.title}
        className={cn(
          "fixed z-50 flex flex-col overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-foreground/10",
          "h-[min(70vh,560px)] sm:w-[380px]",
          panelPos,
          !open && "hidden",
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <SparklesIcon className="size-4 text-primary" />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">
                {meta.title}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {meta.subtitle}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Kapat"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <XIcon className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 p-3">
          {/* İlk açılıştan sonra monte kalır — sohbet geçmişi kapatınca silinmesin. */}
          {everOpened &&
            (role === "coach" ? (
              <CoachAgentChat heightClassName="h-full" />
            ) : (
              <StudentChat heightClassName="h-full" />
            ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setEverOpened(true);
          setOpen((o) => !o);
        }}
        aria-label={`${meta.title} — aç`}
        className={cn(
          "fixed z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg ring-1 ring-black/5 transition hover:bg-primary/90 active:scale-95",
          fabPos,
          open && "hidden",
        )}
      >
        <SparklesIcon className="size-5" />
        <span>{meta.fabLabel}</span>
      </button>
    </>
  );
}
