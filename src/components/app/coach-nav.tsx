"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDaysIcon,
  ClipboardCheckIcon,
  ClockIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  MegaphoneIcon,
  NewspaperIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact: boolean;
  /** Yalnız yönetici görür (koçlarda gizli). */
  adminOnly?: boolean;
};

const LINKS: NavLink[] = [
  { href: "/koc", label: "Panel", icon: LayoutDashboardIcon, exact: true },
  { href: "/koc/ogrenciler", label: "Öğrenciler", icon: UsersIcon, exact: false },
  { href: "/koc/asistan", label: "Asistan", icon: SparklesIcon, exact: false },
  { href: "/koc/leadler", label: "Leadler", icon: InboxIcon, exact: false },
  { href: "/koc/bekleme", label: "Bekleme", icon: ClockIcon, exact: false },
  {
    href: "/koc/gorusmeler",
    label: "Görüşmeler",
    icon: CalendarDaysIcon,
    exact: false,
  },
  { href: "/koc/muhasebe", label: "Muhasebe", icon: WalletIcon, exact: false },
  { href: "/koc/icerik", label: "İçerik", icon: LibraryIcon, exact: false },
  { href: "/koc/blog", label: "Blog", icon: NewspaperIcon, exact: false },
  // Pazarlama sitesi (yorum/paket/SSS/koç profili) tek marka → yalnız yönetici.
  {
    href: "/koc/site",
    label: "Site",
    icon: MegaphoneIcon,
    exact: false,
    adminOnly: true,
  },
  {
    href: "/koc/basvurular",
    label: "Başvurular",
    icon: ClipboardCheckIcon,
    exact: false,
    adminOnly: true,
  },
  {
    href: "/koc/yonetim",
    label: "Yönetim",
    icon: ShieldCheckIcon,
    exact: false,
    adminOnly: true,
  },
  { href: "/koc/ayarlar", label: "Ayarlar", icon: SettingsIcon, exact: false },
];

/** Koç üst gezinmesi — aktif bağlantı vurgulu; Yönetim yalnız yöneticide. */
export function CoachNav({
  className,
  isAdmin = false,
}: {
  className?: string;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const links = LINKS.filter((l) => isAdmin || !l.adminOnly);

  return (
    <nav
      className={cn(
        // Kendi satırı: taşarsa yatay kayar (sarmalanmaz), kaydırma çubuğu gizli.
        "-mx-1 flex h-12 items-center gap-1 overflow-x-auto px-1",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
              active
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
