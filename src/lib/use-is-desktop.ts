import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 1024px)"; // Tailwind `lg`

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * `lg` ve üstü mü? Sunucuda (ve hidrasyonda) `null` — o an iki düzen de CSS ile
 * render edilir, sonra yalnız ekrana uyan kalır. Telefonda masaüstü ağacını
 * gizli tutup her dokunuşta yeniden kurmamak için.
 */
export function useIsDesktop(): boolean | null {
  return useSyncExternalStore<boolean | null>(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => null,
  );
}
