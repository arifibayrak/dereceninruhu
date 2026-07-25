"use client";

import * as React from "react";
import { CheckIcon, ListIcon, RotateCcwIcon, SearchIcon } from "lucide-react";

import { matches } from "@/lib/rehber/search";
import type { SectionIndexEntry } from "@/lib/rehber/types";
import { cn } from "@/lib/utils";
import { useRehberProgress } from "@/components/rehber/progress-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Sert yenilemede tarayıcı, hydration'dan önce `#bolum-…` hedefine kayar;
 * ada mount olunca (arama şeridi, ilerleme çubuğu) düzen kayabilir.
 * Tek seferlik yeniden hizalama bunu düzeltir.
 */
function useHashRealign() {
  React.useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView();
    });
    return () => cancelAnimationFrame(frame);
  }, []);
}

/** Aktif bölümü kaydırmaya göre izler. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = React.useState<string | null>(ids[0] ?? null);

  React.useEffect(() => {
    const nodes = ids
      .map((id) => document.getElementById(`bolum-${id}`))
      .filter((n): n is HTMLElement => n !== null);
    if (nodes.length === 0) return;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = e.target.id.replace(/^bolum-/, "");
          if (e.isIntersecting) visible.set(id, e.intersectionRatio);
          else visible.delete(id);
        }
        if (visible.size === 0) return;
        // Görünenler arasında belge sırasında en üstteki aktif sayılır.
        const first = ids.find((id) => visible.has(id));
        if (first) setActive(first);
      },
      // Üst yapışkan başlığın altındaki bandı "aktif" kabul et.
      { rootMargin: "-25% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

function ProgressBar({ total }: { total: number }) {
  const { read, reset } = useRehberProgress();
  const done = read.size;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          {done}/{total} bölüm okundu
        </span>
        {done > 0 && (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="İlerlemeyi sıfırla"
            title="İlerlemeyi sıfırla"
            onClick={reset}
          >
            <RotateCcwIcon />
          </Button>
        )}
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Rehber okuma ilerlemesi"
      >
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TocList({
  entries,
  active,
  onNavigate,
}: {
  entries: SectionIndexEntry[];
  active: string | null;
  onNavigate?: () => void;
}) {
  const { read } = useRehberProgress();

  if (entries.length === 0) {
    return (
      <p className="px-2 py-6 text-sm text-muted-foreground">
        Eşleşen bölüm yok. Başka bir kelime dene.
      </p>
    );
  }

  // Bölümleri kendi bölüm başlıklarına (chapter) göre kümele.
  const groups: { chapter: string; items: SectionIndexEntry[] }[] = [];
  for (const e of entries) {
    const last = groups.at(-1);
    if (last && last.chapter === e.chapter) last.items.push(e);
    else groups.push({ chapter: e.chapter, items: [e] });
  }

  return (
    <nav aria-label="Bölümler" className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.chapter} className="flex flex-col gap-0.5">
          <span className="px-2 pb-1 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground/70 uppercase">
            {group.chapter}
          </span>
          {group.items.map((item) => {
            const isActive = active === item.id;
            return (
              <a
                key={item.id}
                href={`#bolum-${item.id}`}
                onClick={onNavigate}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-secondary font-medium text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span className="w-5 shrink-0 text-[11px] tabular-nums opacity-60">
                  {item.no > 0 ? String(item.no).padStart(2, "0") : "—"}
                </span>
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                {read.has(item.id) && (
                  <CheckIcon
                    aria-hidden
                    className="size-3.5 shrink-0 text-success"
                  />
                )}
              </a>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rehberde ara — buton, ekran, terim…"
        aria-label="Rehberde ara"
        className="h-9 pl-8"
      />
    </div>
  );
}

/** Eşleşme sayacı — yer her zaman ayrılır ki yazarken şerit zıplamasın. */
function MatchCount({
  query,
  count,
  total,
}: {
  query: string;
  count: number;
  total: number;
}) {
  return (
    <span
      aria-live="polite"
      className={cn(
        "block h-4 px-0.5 text-[11px] leading-4 text-muted-foreground tabular-nums",
        query.trim() === "" && "invisible",
      )}
    >
      {count}/{total} bölüm eşleşti
    </span>
  );
}

/**
 * Rehberin tek istemci adası: arama, bölüm listesi, kaydırma takibi ve
 * okuma ilerlemesi. Bölüm gövdeleri sunucuda basılır — buraya yalnız
 * hafif indeks gelir.
 */
export function GuideControls({
  index,
  sidebar,
  stickyClass,
  gutterClass,
}: {
  index: SectionIndexEntry[];
  /** Geniş ekranda yapışkan yan sütun gösterilsin mi (koç paneli). */
  sidebar: boolean;
  /** Yapışkan konumu — kabuğun başlık yüksekliğine göre. */
  stickyClass: string;
  /** Şeridi kabuğun yatay boşluğuna taşıran negatif kenar boşluğu. */
  gutterClass: string;
}) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const ids = React.useMemo(() => index.map((e) => e.id), [index]);
  const active = useActiveSection(ids);
  useHashRealign();

  const filtered = React.useMemo(
    () => index.filter((e) => matches(e, query)),
    [index, query],
  );

  const toc = (
    <TocList
      entries={filtered}
      active={active}
      onNavigate={() => setOpen(false)}
    />
  );

  return (
    <>
      {/* Geniş ekran: yapışkan yan sütun */}
      {sidebar && (
        <aside
          className={cn(
            "sticky hidden h-fit max-h-[calc(100dvh-8rem)] flex-col gap-4 overflow-y-auto pr-2 lg:flex",
            stickyClass,
          )}
        >
          <div className="flex flex-col gap-1.5">
            <SearchBox value={query} onChange={setQuery} />
            <MatchCount
              query={query}
              count={filtered.length}
              total={index.length}
            />
          </div>
          <ProgressBar total={index.length} />
          {toc}
        </aside>
      )}

      {/* Dar ekran: yapışkan arama şeridi + çekmecede bölüm listesi */}
      <div
        className={cn(
          "sticky z-30 flex flex-col gap-1 border-b bg-background/90 pt-1 pb-1.5 backdrop-blur",
          gutterClass,
          sidebar && "lg:hidden",
          stickyClass,
        )}
      >
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <SearchBox value={query} onChange={setQuery} />
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={<Button variant="outline" size="sm" className="shrink-0" />}
            >
              <ListIcon data-icon="inline-start" />
              Bölümler
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-sm">
              <SheetHeader>
                <SheetTitle>Bölümler</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-6">
                <ProgressBar total={index.length} />
                {toc}
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <MatchCount
          query={query}
          count={filtered.length}
          total={index.length}
        />
      </div>
    </>
  );
}
