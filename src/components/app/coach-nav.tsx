"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDaysIcon,
  ChevronDownIcon,
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
  TargetIcon,
  UploadIcon,
  UserRoundIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Tam eşleşme (yalnız /koc paneli). */
  exact?: boolean;
  /** Yalnız yönetici görür (koçlarda gizli). */
  adminOnly?: boolean;
};

type NavEntry =
  | { kind: "link"; item: NavItem }
  | { kind: "group"; label: string; icon: LucideIcon; items: NavItem[] };

/**
 * Koç üst gezinmesi. Sık kullanılanlar üst düzey; ilişkili sayfalar açılır
 * menülerde grupludur (nav taşmasın): Talepler (lead/bekleme/başvuru),
 * İçerik (içerik/blog), Ayarlar (profil/ayarlar/site/yönetim).
 */
const ENTRIES: NavEntry[] = [
  {
    kind: "link",
    item: { href: "/koc", label: "Panel", icon: LayoutDashboardIcon, exact: true },
  },
  {
    kind: "link",
    item: { href: "/koc/ogrenciler", label: "Öğrenciler", icon: UsersIcon },
  },
  {
    kind: "link",
    item: { href: "/koc/denemeler", label: "Denemeler", icon: TargetIcon },
  },
  {
    kind: "link",
    item: { href: "/koc/asistan", label: "Asistan", icon: SparklesIcon },
  },
  {
    kind: "link",
    item: { href: "/koc/gorusmeler", label: "Görüşmeler", icon: CalendarDaysIcon },
  },
  {
    kind: "link",
    item: { href: "/koc/muhasebe", label: "Muhasebe", icon: WalletIcon },
  },
  {
    kind: "group",
    label: "Talepler",
    icon: InboxIcon,
    items: [
      { href: "/koc/leadler", label: "Leadler", icon: InboxIcon },
      { href: "/koc/bekleme", label: "Bekleme", icon: ClockIcon },
      {
        href: "/koc/basvurular",
        label: "Başvurular",
        icon: ClipboardCheckIcon,
        adminOnly: true,
      },
    ],
  },
  {
    kind: "group",
    label: "İçerik",
    icon: LibraryIcon,
    items: [
      { href: "/koc/icerik", label: "İçerik", icon: LibraryIcon },
      { href: "/koc/blog", label: "Blog", icon: NewspaperIcon },
    ],
  },
  {
    kind: "group",
    label: "Ayarlar",
    icon: SettingsIcon,
    items: [
      { href: "/koc/profil", label: "Profil", icon: UserRoundIcon },
      { href: "/koc/ayarlar", label: "Ayarlar", icon: SettingsIcon },
      {
        href: "/koc/ice-aktar",
        label: "İçe aktar",
        icon: UploadIcon,
        adminOnly: true,
      },
      { href: "/koc/site", label: "Site", icon: MegaphoneIcon, adminOnly: true },
      {
        href: "/koc/yonetim",
        label: "Yönetim",
        icon: ShieldCheckIcon,
        adminOnly: true,
      },
    ],
  },
];

const itemClass = (active: boolean) =>
  cn(
    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
    active
      ? "bg-secondary text-secondary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

/** Koç üst gezinmesi — aktif bağlantı vurgulu; gruplar açılır menü. */
export function CoachNav({
  className,
  isAdmin = false,
}: {
  className?: string;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <nav
      className={cn(
        // Kendi satırı: taşarsa yatay kayar (sarmalanmaz), kaydırma çubuğu gizli.
        "-mx-1 flex h-12 items-center gap-1 overflow-x-auto px-1",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {ENTRIES.map((entry) => {
        if (entry.kind === "link") {
          const { item } = entry;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={itemClass(isActive(item))}
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        }

        const items = entry.items.filter((it) => isAdmin || !it.adminOnly);
        if (items.length === 0) return null;
        const groupActive = items.some(isActive);
        const Icon = entry.icon;

        return (
          <DropdownMenu key={entry.label}>
            <DropdownMenuTrigger className={cn(itemClass(groupActive), "outline-none")}>
              <Icon className="size-4 shrink-0" />
              <span className="hidden sm:inline">{entry.label}</span>
              <ChevronDownIcon className="size-3.5 shrink-0 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              {items.map((it) => {
                const ItIcon = it.icon;
                return (
                  <DropdownMenuItem
                    key={it.href}
                    render={<Link href={it.href} />}
                    className={cn(
                      "gap-2",
                      isActive(it) && "bg-secondary text-secondary-foreground",
                    )}
                  >
                    <ItIcon className="size-4" />
                    {it.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </nav>
  );
}
