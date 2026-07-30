"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Atanabilir öğrenci — sınav kodları hızlı seçimi besler. */
export type AssignableStudent = {
  enrollmentId: number;
  label: string;
  /** Bir öğrenci iki sınava birden hazırlanabilir → iki kod. */
  examCodes: string[];
  grade?: string | null;
};

/** İsim aramasında Türkçe harfleri eşitler ("İ" arayan "i"yi de bulur). */
function foldTr(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

/** Aramada 8'den az öğrenci varsa arama kutusu gürültü olur. */
const SEARCH_THRESHOLD = 8;

const CIFT = "cift"; // iki sınava hazırlananlar için sanal filtre anahtarı

/**
 * Öğrenci seçici — sınava göre katmanlı hızlı seçim.
 *
 * Tek tek tıklamak koçun en çok vakit kaybettiği yerdi: filtre sekmeleri
 * (Tümü / YKS / LGS / KPSS / Çift sınav) listeyi daraltır, "Görünenleri seç"
 * o kümenin tamamını tek dokunuşta ekler. Seçim daima tüm öğrenciler
 * üzerinden tutulur — filtre yalnız görünürlüğü değiştirir, seçimi silmez.
 */
export function StudentAssignPicker({
  students,
  value,
  onChange,
  emptyText = "Aktif öğrenci yok.",
}: {
  students: AssignableStudent[];
  value: number[];
  onChange: (ids: number[]) => void;
  emptyText?: string;
}) {
  const [filter, setFilter] = useState<string>("tum");
  const [query, setQuery] = useState("");

  /** Sınav kodu sekmeleri — yalnız listede geçen kodlar, sayılarıyla. */
  const tabs = useMemo(() => {
    const counts = new Map<string, number>();
    let cift = 0;
    for (const s of students) {
      for (const code of new Set(s.examCodes)) {
        counts.set(code, (counts.get(code) ?? 0) + 1);
      }
      if (new Set(s.examCodes).size > 1) cift += 1;
    }
    const out = [{ key: "tum", label: "Tümü", count: students.length }];
    for (const [code, count] of [...counts].sort((a, b) => b[1] - a[1])) {
      out.push({ key: code, label: code, count });
    }
    if (cift > 0) out.push({ key: CIFT, label: "Çift sınav", count: cift });
    return out;
  }, [students]);

  const visible = useMemo(() => {
    const q = foldTr(query.trim());
    return students.filter((s) => {
      if (filter === CIFT && new Set(s.examCodes).size < 2) return false;
      if (filter !== "tum" && filter !== CIFT && !s.examCodes.includes(filter)) {
        return false;
      }
      return q ? foldTr(s.label).includes(q) : true;
    });
  }, [students, filter, query]);

  const selected = new Set(value);
  const visibleIds = visible.map((s) => s.enrollmentId);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const toggle = (enrollmentId: number) => {
    onChange(
      selected.has(enrollmentId)
        ? value.filter((id) => id !== enrollmentId)
        : [...value, enrollmentId],
    );
  };

  /** Görünen kümeyi topluca ekler ya da çıkarır (diğer seçime dokunmaz). */
  const toggleVisible = () => {
    if (allVisibleSelected) {
      onChange(value.filter((id) => !visibleIds.includes(id)));
    } else {
      onChange([...new Set([...value, ...visibleIds])]);
    }
  };

  if (students.length === 0) {
    return <span className="text-sm text-muted-foreground">{emptyText}</span>;
  }

  return (
    <div className="flex flex-col gap-2">
      {tabs.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              aria-pressed={filter === t.key}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                filter === t.key
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {t.label} · {t.count}
            </button>
          ))}
        </div>
      )}

      {students.length >= SEARCH_THRESHOLD && (
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Öğrenci ara"
            aria-label="Öğrenci ara"
            className="h-8 pl-8 text-sm"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={visibleIds.length === 0}
          onClick={toggleVisible}
        >
          {allVisibleSelected
            ? `Görünen ${visibleIds.length} seçimi kaldır`
            : `Görünen ${visibleIds.length} öğrenciyi seç`}
        </Button>
        {value.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onChange([])}
          >
            Temizle
          </Button>
        )}
        <span className="ml-auto text-xs font-medium text-muted-foreground">
          {value.length} seçili
        </span>
      </div>

      <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border p-2.5">
        {visible.length === 0 ? (
          <span className="px-0.5 py-1 text-sm text-muted-foreground">
            Bu filtreye uyan öğrenci yok.
          </span>
        ) : (
          visible.map((s) => (
            <label
              key={s.enrollmentId}
              className="flex items-center gap-2 rounded-md px-0.5 py-1 text-sm hover:bg-muted/60"
            >
              <input
                type="checkbox"
                checked={selected.has(s.enrollmentId)}
                onChange={() => toggle(s.enrollmentId)}
                className="size-4 shrink-0 accent-primary"
              />
              <span className="min-w-0 flex-1 truncate">{s.label}</span>
              {s.grade && (
                // Sınıf serbest metin ("Önlisans / mezun") → daralt, taşırma.
                <span className="max-w-24 shrink-0 truncate text-[10px] text-muted-foreground">
                  {s.grade}
                </span>
              )}
              {[...new Set(s.examCodes)].map((code) => (
                <span
                  key={code}
                  className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {code}
                </span>
              ))}
            </label>
          ))
        )}
      </div>
    </div>
  );
}
