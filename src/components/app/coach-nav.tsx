"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDaysIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  MegaphoneIcon,
  NewspaperIcon,
  SettingsIcon,
  ShieldCheckIcon,
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
};

const LINKS: NavLink[] = [
  { href: "/koc", label: "Panel", icon: LayoutDashboardIcon, exact: true },
  { href: "/koc/ogrenciler", label: "Öğrenciler", icon: UsersIcon, exact: false },
  { href: "/koc/leadler", label: "Leadler", icon: InboxIcon, exact: false },
  {
    href: "/koc/gorusmeler",
    label: "Görüşmeler",
    icon: CalendarDaysIcon,
    exact: false,
  },
  { href: "/koc/muhasebe", label: "Muhasebe", icon: WalletIcon, exact: false },
  { href: "/koc/icerik", label: "İçerik", icon: LibraryIcon, exact: false },
  { href: "/koc/blog", label: "Blog", icon: NewspaperIcon, exact: false },
  { href: "/koc/site", label: "Site", icon: MegaphoneIcon, exact: false },
  { href: "/koc/ayarlar", label: "Ayarlar", icon: SettingsIcon, exact: false },
];

/** Yalnız yöneticinin gördüğü Yönetim bağlantısı (Ayarlar'dan önce). */
const ADMIN_LINK: NavLink = {
  href: "/koc/yonetim",
  label: "Yönetim",
  icon: ShieldCheckIcon,
  exact: false,
};

/** Koç üst gezinmesi — aktif bağlantı vurgulu; Yönetim yalnız yöneticide. */
export function CoachNav({
  className,
  isAdmin = false,
}: {
  className?: string;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const links = isAdmin
    ? [...LINKS.slice(0, -1), ADMIN_LINK, LINKS[LINKS.length - 1]]
    : LINKS;

  return (
    <nav className={cn("flex items-center gap-1", className)}>
      {links.map(({ href, label, icon: Icon, exact }) => {
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
