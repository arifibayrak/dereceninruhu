"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDaysIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/koc", label: "Panel", icon: LayoutDashboardIcon, exact: true },
  { href: "/koc/ogrenciler", label: "Öğrenciler", icon: UsersIcon, exact: false },
  {
    href: "/koc/gorusmeler",
    label: "Görüşmeler",
    icon: CalendarDaysIcon,
    exact: false,
  },
  { href: "/koc/ayarlar", label: "Ayarlar", icon: SettingsIcon, exact: false },
] as const;

/** Koç üst gezinmesi — aktif bağlantı vurgulu. */
export function CoachNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center gap-1", className)}>
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
