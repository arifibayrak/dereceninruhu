"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckIcon } from "lucide-react";
import { toast } from "sonner";

import { callAction } from "@/lib/action-client";
import { toggleTopicResourceDone } from "@/actions/konular";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type MatrixGroup = {
  subjectId: number;
  subjectName: string;
  sectionName: string;
  topics: { id: number; name: string }[];
};

export type MatrixResource = {
  id: number;
  name: string;
  subjectId: number | null;
};

/**
 * Konu × kaynak "Bitti" matrisi — ders seç, konuları kaynak kaynak işaretle.
 * Hem koç hem öğrenci kullanır (yetki aksiyon katmanında). Optimistic toggle.
 */
export function TopicResourceMatrix({
  enrollmentId,
  groups,
  resources,
  initialDone,
}: {
  enrollmentId: number;
  groups: MatrixGroup[];
  resources: MatrixResource[];
  /** `${topicId}:${resourceId}` → true. */
  initialDone: Record<string, boolean>;
}) {
  const [subjectId, setSubjectId] = useState<number | null>(
    groups[0]?.subjectId ?? null,
  );
  const [done, setDone] = useState<Record<string, boolean>>(initialDone);
  const [, startTransition] = useTransition();

  const group = useMemo(
    () => groups.find((g) => g.subjectId === subjectId) ?? null,
    [groups, subjectId],
  );
  const cols = useMemo(
    () =>
      resources.filter(
        (r) => r.subjectId === null || r.subjectId === subjectId,
      ),
    [resources, subjectId],
  );

  if (groups.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
        Bu sınav için konu listesi yok (konu seed&apos;i bekleniyor).
      </div>
    );
  }

  const toggle = (topicId: number, resourceId: number) => {
    const key = `${topicId}:${resourceId}`;
    const next = !done[key];
    setDone((prev) => ({ ...prev, [key]: next }));
    startTransition(async () => {
      const res = await callAction(toggleTopicResourceDone, {
        enrollmentId,
        topicId,
        resourceId,
        isDone: next,
      });
      if (!res.ok) {
        // Geri al — sunucu reddetti.
        setDone((prev) => ({ ...prev, [key]: !next }));
        toast.error(res.error);
      }
    });
  };

  const doneCountFor = (topicId: number) =>
    cols.filter((c) => done[`${topicId}:${c.id}`]).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select
          items={groups.map((g) => ({
            value: String(g.subjectId),
            label: g.subjectName,
          }))}
          value={subjectId != null ? String(subjectId) : null}
          onValueChange={(value) =>
            setSubjectId(value != null ? Number(value) : null)
          }
        >
          <SelectTrigger className="w-52" aria-label="Ders seç">
            <SelectValue placeholder="Ders seç" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((g) => (
              <SelectItem key={g.subjectId} value={String(g.subjectId)}>
                {g.subjectName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          Hücreye dokun → &quot;Bitti&quot; işaretle
        </span>
      </div>

      {!group ? null : cols.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
          Bu ders için kaynak yok — önce kaynak ekleyin.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium">
                  Konu
                </th>
                {cols.map((r) => (
                  <th
                    key={r.id}
                    className="max-w-24 px-1 py-2 text-center text-[11px] font-medium"
                  >
                    <span className="line-clamp-2" title={r.name}>
                      {r.name}
                    </span>
                  </th>
                ))}
                <th className="px-2 py-2 text-right font-medium">✓</th>
              </tr>
            </thead>
            <tbody>
              {group.topics.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="sticky left-0 z-10 max-w-52 truncate bg-card px-3 py-1.5 font-medium whitespace-nowrap">
                    {t.name}
                  </td>
                  {cols.map((r) => {
                    const isDone = !!done[`${t.id}:${r.id}`];
                    return (
                      <td key={r.id} className="px-0.5 py-1 text-center">
                        <button
                          type="button"
                          aria-label={`${t.name} — ${r.name}: ${
                            isDone ? "bitti, geri al" : "bitti işaretle"
                          }`}
                          aria-pressed={isDone}
                          onClick={() => toggle(t.id, r.id)}
                          className={cn(
                            "inline-flex size-8 items-center justify-center rounded-md ring-1 transition-colors",
                            isDone
                              ? "bg-success/15 text-success ring-success/30"
                              : "text-muted-foreground/30 ring-foreground/10 hover:text-muted-foreground",
                          )}
                        >
                          <CheckIcon className="size-4" />
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5 text-right text-xs text-muted-foreground tabular-nums">
                    {doneCountFor(t.id)}/{cols.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
