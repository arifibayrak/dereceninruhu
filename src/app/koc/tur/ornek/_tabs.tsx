"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/** Gerçek kokpitle aynı 10 sekme. Turda ışık tutulan hedefler burada. */
const NAV = [
  { seg: "", label: "Genel Bakış" },
  { seg: "soru-takibi", label: "Soru Takibi" },
  { seg: "denemeler", label: "Denemeler" },
  { seg: "program", label: "Program" },
  { seg: "gorusmeler", label: "Görüşmeler" },
  { seg: "konular", label: "Konular" },
  { seg: "kaynaklar", label: "Kaynaklar" },
  { seg: "icerik", label: "İçerik" },
  { seg: "muhasebe", label: "Muhasebe" },
  { seg: "profil", label: "Profil" },
];

export function OrnekTabs({ base }: { base: string }) {
  const pathname = usePathname();

  return (
    <div className="overflow-x-auto pb-1">
      <nav className="inline-flex min-w-max items-center gap-1 rounded-xl bg-muted p-1">
        {NAV.map((it) => {
          const href = it.seg ? `${base}/${it.seg}` : base;
          const isActive = pathname === href;
          const built = ["", "soru-takibi", "denemeler", "program", "konular"];
          const isBuilt = built.includes(it.seg);
          return (
            <Link
              key={it.seg || "overview"}
              href={isBuilt ? href : base}
              // Tur bu sekmelere ışık tutar.
              data-tour-nav={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex h-8 items-center rounded-lg px-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-card text-foreground shadow-sm ring-1 ring-foreground/10"
                  : "text-muted-foreground hover:text-foreground",
                !isBuilt && "opacity-40",
              )}
              title={isBuilt ? undefined : "Bu sekme örnek kayıtta gösterilmiyor"}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
