"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenIcon } from "lucide-react";

import { resolveRehberHref } from "@/lib/rehber/route-map";
import { Button } from "@/components/ui/button";

/**
 * Başlıktaki rehber düğmesi — bulunduğun ekranın bölümüne doğrudan atlar.
 * Eşleşme yoksa alanın rehber ana sayfasına düşer; rehberin kendi
 * sayfalarında hiç görünmez.
 */
export function RehberLink() {
  const pathname = usePathname();
  const href = resolveRehberHref(pathname ?? "");
  if (!href) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Rehber — bu ekran"
      title="Rehber — bu ekran"
      render={<Link href={href} />}
    >
      <BookOpenIcon />
    </Button>
  );
}
