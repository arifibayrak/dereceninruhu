"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import {
  countNoteItems,
  isStructuredNote,
  parseCoachNote,
  type NoteGroup,
} from "@/lib/plan-note";
import { cn } from "@/lib/utils";

/** Katlamadan önce gösterilen madde sayısı. */
const VISIBLE_ITEMS = 4;

/**
 * İlk `limit` maddeyi grup yapısını koruyarak alır (grup sınırları bozulmasın
 * diye düz listeye açıp yeniden bölmüyoruz). Saf fonksiyon — render sırasında
 * dışarıdaki bir değişkeni mutasyona uğratmamak için bileşenin dışında.
 */
function takeItems(groups: NoteGroup[], limit: number): NoteGroup[] {
  const out: NoteGroup[] = [];
  let remaining = limit;
  for (const group of groups) {
    if (remaining <= 0) break;
    const items = group.items.slice(0, remaining);
    remaining -= items.length;
    out.push({ ...group, items });
  }
  return out;
}

/**
 * Koçun haftalık notu — metin duvarı yerine okunabilir madde listesi.
 *
 * Koçlar haftanın tamamını buraya yapıştırdığı için (bkz. Görsel 7) not
 * satır/orta-nokta sınırlarından maddelere bölünür ve ilk birkaç maddeden
 * sonrası katlanır. Ayırıcı içermeyen kısa notlar paragraf olarak kalır.
 *
 * Not artık görev listesinin ALTINDA duruyor: öğrenci önce "ne yapacağım"ı
 * görsün, sonra koçun serbest notunu.
 */
export function CoachNote({ note }: { note: string }) {
  const [expanded, setExpanded] = useState(false);
  const groups = parseCoachNote(note);
  if (groups.length === 0) return null;

  const structured = isStructuredNote(groups);
  const total = countNoteItems(groups);
  const collapsible = structured && total > VISIBLE_ITEMS;

  const shown =
    expanded || !collapsible ? groups : takeItems(groups, VISIBLE_ITEMS);
  const hiddenCount = total - countNoteItems(shown);

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card p-3.5 ring-1 ring-foreground/10">
      <span className="text-xs font-semibold text-muted-foreground">
        Koçunun notu
      </span>

      {structured ? (
        <div className="flex flex-col gap-2.5">
          {shown.map((group) => (
            <ul key={group.index} className="flex flex-col gap-1">
              {group.items.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span
                    aria-hidden
                    className="mt-1.75 size-1.5 shrink-0 rounded-full bg-primary/50"
                  />
                  <span className="min-w-0 break-words">{item}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      ) : (
        <p className="text-sm whitespace-pre-line">{note}</p>
      )}

      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="inline-flex w-fit items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? "Daha az göster" : `Devamını gör (${hiddenCount})`}
          <ChevronDownIcon
            className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
          />
        </button>
      )}
    </div>
  );
}
