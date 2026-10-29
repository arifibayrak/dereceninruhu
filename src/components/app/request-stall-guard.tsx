"use client";

import { useEffect } from "react";

import { installRequestStallGuard } from "@/lib/request-stall-guard";

/**
 * Askıda kalan Server Action / RSC isteklerini iptal eden korumayı bir kez
 * kurar (bkz. `@/lib/request-stall-guard`). Hiçbir şey render etmez.
 */
export function RequestStallGuard() {
  useEffect(
    () =>
      installRequestStallGuard(window, {
        document,
        setTimeout: (fn, ms) => window.setTimeout(fn, ms),
        clearTimeout: (id) => window.clearTimeout(id as number),
        now: () => performance.now(),
      }),
    [],
  );
  return null;
}
