"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheckIcon,
  ChartLineIcon,
  HomeIcon,
  LibraryIcon,
  NotebookPenIcon,
  TargetIcon,
  TimerIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/ogrenci", label: "Bugün", icon: HomeIcon, exact: true },
  {
    href: "/ogrenci/program",
    label: "Program",
    icon: CalendarCheckIcon,
    exact: false,
  },
  {
    href: "/ogrenci/soru-takibi",
    label: "Sorular",
    icon: NotebookPenIcon,
    exact: false,
  },
  {
    href: "/ogrenci/kronometre",
    label: "Süre",
    icon: TimerIcon,
    exact: false,
  },
  {
    href: "/ogrenci/denemeler",
    label: "Denemeler",
    icon: TargetIcon,
    exact: false,
  },
  {
    href: "/ogrenci/gelisim",
    label: "Gelişim",
    icon: ChartLineIcon,
    exact: false,
  },
  {
    href: "/ogrenci/icerik",
    label: "İçerik",
    icon: LibraryIcon,
    exact: false,
  },
] as const;

/** Öğrenci alt gezinmesi — mobil öncelikli, büyük dokunma alanları. */
export function StudentBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Öğrenci gezinmesi"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="mx-auto grid w-full max-w-lg grid-cols-7">
        {LINKS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("size-5", active && "stroke-[2.25]")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
