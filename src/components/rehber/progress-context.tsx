"use client";

import * as React from "react";

type ProgressValue = {
  read: ReadonlySet<string>;
  toggle: (id: string) => void;
  reset: () => void;
};

const Ctx = React.createContext<ProgressValue | null>(null);

const EMPTY: ReadonlySet<string> = new Set<string>();

function parse(raw: string | null): ReadonlySet<string> {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return EMPTY;
  }
}

type Store = {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => ReadonlySet<string>;
  getServerSnapshot: () => ReadonlySet<string>;
  toggle: (id: string) => void;
  reset: () => void;
};

/**
 * Rehber başına tek bir depolama deposu. `useSyncExternalStore` ile okunur:
 * sunucuda boş küme döner, hydration sonrası gerçek değere geçer — böylece
 * force-dynamic kabukta uyuşmazlık da, efekt içinde setState de olmaz.
 */
const stores = new Map<string, Store>();

function getStore(storageKey: string): Store {
  const existing = stores.get(storageKey);
  if (existing) return existing;

  const listeners = new Set<() => void>();
  // getSnapshot referans olarak kararlı olmak zorunda: ham metin değişmediyse
  // aynı Set örneğini döndürürüz, yoksa React sonsuz döngüye girer.
  let cachedRaw: string | null | undefined;
  let cached: ReadonlySet<string> = EMPTY;

  const emit = () => listeners.forEach((l) => l());

  const write = (next: ReadonlySet<string>) => {
    const raw = JSON.stringify([...next]);
    try {
      window.localStorage.setItem(storageKey, raw);
    } catch {
      // Kota dolu ya da gizli mod — oturum içi durum yine de güncellenir.
    }
    cachedRaw = raw;
    cached = next;
    emit();
  };

  const store: Store = {
    subscribe(onChange) {
      listeners.add(onChange);
      const onStorage = (e: StorageEvent) => {
        // Başka sekmede değiştiyse önbelleği geçersiz kıl.
        if (e.key === storageKey) {
          cachedRaw = undefined;
          onChange();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(onChange);
        window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot() {
      let raw: string | null = null;
      try {
        raw = window.localStorage.getItem(storageKey);
      } catch {
        return EMPTY;
      }
      if (raw !== cachedRaw) {
        cachedRaw = raw;
        cached = parse(raw);
      }
      return cached;
    },
    getServerSnapshot: () => EMPTY,
    toggle(id) {
      const next = new Set(store.getSnapshot());
      if (next.has(id)) next.delete(id);
      else next.add(id);
      write(next);
    },
    reset: () => write(EMPTY),
  };

  stores.set(storageKey, store);
  return store;
}

/**
 * "Okudum" işaretlerini cihaz bazlı tutar (localStorage).
 * Bilinçli olarak D1'e yazılmaz: kişisel bir okuma imi, paylaşılan bir veri değil.
 */
export function RehberProgressProvider({
  storageKey,
  children,
}: {
  storageKey: string;
  children: React.ReactNode;
}) {
  const store = React.useMemo(() => getStore(storageKey), [storageKey]);
  const read = React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const value = React.useMemo(
    () => ({ read, toggle: store.toggle, reset: store.reset }),
    [read, store],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRehberProgress(): ProgressValue {
  const ctx = React.useContext(Ctx);
  if (!ctx) {
    throw new Error(
      "useRehberProgress, RehberProgressProvider içinde kullanılmalı",
    );
  }
  return ctx;
}
