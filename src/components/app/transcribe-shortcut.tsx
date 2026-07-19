"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Küresel kısayol: herhangi bir koç sayfasında "g" ardından (1 sn içinde) "t" →
 * canlı transkript sayfası. Form alanlarında yazarken ve değiştirici tuşlarla
 * (Cmd/Ctrl/Alt) devre dışı, böylece normal yazımı bozmaz.
 */
export function TranscribeShortcut() {
  const router = useRouter();

  useEffect(() => {
    let lastG = 0;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const now = Date.now();
      if (e.key === "g") {
        lastG = now;
        return;
      }
      if (e.key === "t" && now - lastG < 1000) {
        e.preventDefault();
        lastG = 0;
        router.push("/koc/canli-transkript");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return null;
}
