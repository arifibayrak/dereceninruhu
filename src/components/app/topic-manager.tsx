"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  EyeOffIcon,
  PencilIcon,
  RotateCcwIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";

import { useRefresh } from "@/lib/use-refresh";
import { callAction } from "@/lib/action-client";
import {
  addTopics,
  renameTopic,
  reorderTopics,
  setTopicActive,
} from "@/actions/konu-yonetimi";
import { TOPIC_NAME_MAX } from "@/lib/validation-konu-yonetimi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Topic = { id: number; name: string; sortOrder: number; isActive: boolean };

/** Yapıştırılan metni konulara böler: satır başı madde işaretleri atılır. */
function parseLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-•*·]|\d+[.)])\s*/, "").trim())
    .filter((l) => l.length > 0);
}

/**
 * /koc/konular — bir dersin konu listesi (yalnız yönetici). Toplu ekleme,
 * ad düzeltme, yukarı/aşağı sıralama, pasife alma / geri alma.
 */
export function TopicManager({
  subjectId,
  title,
  topics,
}: {
  subjectId: number;
  title: string;
  topics: Topic[];
}) {
  const { refresh } = useRefresh();
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState(() => topics.filter((t) => t.isActive));
  const inactive = topics.filter((t) => !t.isActive);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(
    null,
  );

  const lines = parseLines(draft);
  const q = query.trim().toLocaleLowerCase("tr");
  const visible = q
    ? active.filter((t) => t.name.toLocaleLowerCase("tr").includes(q))
    : active;

  const onAdd = () => {
    if (lines.length === 0) return;
    startTransition(async () => {
      const res = await callAction(addTopics, { subjectId, names: lines });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const { added, reactivated, skipped } = res.data;
      const parts = [
        added > 0 && `${added} konu eklendi`,
        reactivated > 0 && `${reactivated} pasif konu geri alındı`,
        skipped.length > 0 && `${skipped.length} konu zaten vardı`,
      ].filter(Boolean);
      toast.success(parts.join(" · ") || "Değişiklik yok.");
      setDraft("");
      refresh();
    });
  };

  const onMove = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= active.length) return;
    const previous = active;
    const next = [...active];
    [next[index], next[target]] = [next[target], next[index]];
    setActive(next);
    startTransition(async () => {
      const res = await callAction(reorderTopics, {
        subjectId,
        orderedIds: next.map((t) => t.id),
      });
      if (!res.ok) {
        setActive(previous);
        toast.error(res.error);
        return;
      }
      refresh();
    });
  };

  const onRename = () => {
    if (!editing) return;
    const current = active.find((t) => t.id === editing.id);
    if (current && current.name === editing.name.trim()) {
      setEditing(null);
      return;
    }
    startTransition(async () => {
      const res = await callAction(renameTopic, {
        topicId: editing.id,
        name: editing.name,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Konu adı güncellendi.");
      setEditing(null);
      refresh();
    });
  };

  const onToggle = (topic: Topic, nextActive: boolean) => {
    startTransition(async () => {
      const res = await callAction(setTopicActive, {
        topicId: topic.id,
        active: nextActive,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        nextActive
          ? `“${topic.name}” geri alındı (listenin sonunda).`
          : `“${topic.name}” pasife alındı.`,
      );
      refresh();
    });
  };

  return (
    <section className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">
          {active.length} aktif konu
          {inactive.length > 0 && ` · ${inactive.length} pasif`}
        </p>
      </div>

      {/* Toplu ekleme */}
      <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <label htmlFor="konu-ekle" className="text-sm font-medium">
          Konu ekle
        </label>
        <Textarea
          id="konu-ekle"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          placeholder={"Her satıra bir konu yazın ya da listeyi yapıştırın.\nÖrn. Maarif · 9. Sınıf Sayılar"}
          disabled={pending}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Listenin sonuna eklenir. Baştaki “-”, “•”, “1.” işaretleri atılır;
            aynı adlı konu tekrar eklenmez.
          </p>
          <Button
            onClick={onAdd}
            disabled={pending || lines.length === 0}
            size="lg"
          >
            {lines.length > 1 ? `${lines.length} konuyu ekle` : "Ekle"}
          </Button>
        </div>
      </div>

      {/* Aktif konular */}
      <div className="flex flex-col gap-2">
        {active.length > 8 && (
          <div className="relative">
            <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Konu ara"
              className="pl-8"
            />
          </div>
        )}
        {q && (
          <p className="text-xs text-muted-foreground">
            Arama açıkken sıralama kapalı.
          </p>
        )}

        {active.length === 0 ? (
          <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
            Bu derste aktif konu yok.
          </p>
        ) : (
          <ol className="flex flex-col divide-y rounded-2xl bg-card ring-1 ring-foreground/10">
            {visible.map((t) => {
              const index = active.indexOf(t);
              const isEditing = editing?.id === t.id;
              return (
                <li key={t.id} className="flex items-center gap-2 px-3 py-2">
                  <span className="w-7 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    {index + 1}
                  </span>
                  {isEditing ? (
                    <form
                      className="flex min-w-0 flex-1 items-center gap-1"
                      onSubmit={(e) => {
                        e.preventDefault();
                        onRename();
                      }}
                    >
                      <Input
                        autoFocus
                        value={editing.name}
                        maxLength={TOPIC_NAME_MAX}
                        onChange={(e) =>
                          setEditing({ id: t.id, name: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setEditing(null);
                        }}
                        disabled={pending}
                        aria-label="Konu adı"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={pending}
                        aria-label="Kaydet"
                      >
                        <CheckIcon />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditing(null)}
                        aria-label="Vazgeç"
                      >
                        <XIcon />
                      </Button>
                    </form>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 text-sm break-words">
                        {t.name}
                      </span>
                      <div className="flex shrink-0 items-center">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => onMove(index, -1)}
                          disabled={pending || !!q || index === 0}
                          aria-label="Yukarı taşı"
                        >
                          <ArrowUpIcon />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => onMove(index, 1)}
                          disabled={
                            pending || !!q || index === active.length - 1
                          }
                          aria-label="Aşağı taşı"
                        >
                          <ArrowDownIcon />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setEditing({ id: t.id, name: t.name })}
                          disabled={pending}
                          aria-label="Adı düzenle"
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => onToggle(t, false)}
                          disabled={pending}
                          aria-label="Pasife al"
                          title="Pasife al — seçicilerden kalkar, geçmiş kayıtlar korunur"
                        >
                          <EyeOffIcon />
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
            {visible.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-muted-foreground">
                Aramayla eşleşen konu yok.
              </li>
            )}
          </ol>
        )}
        <p className="text-xs text-muted-foreground">
          Ad düzeltmesi bu konuya bağlı eski kayıtlarda da görünür. Konu
          silinmez: pasife alınan konu seçim listelerinden kalkar, geçmiş
          kayıtlar korunur.
        </p>
      </div>

      {/* Pasif konular */}
      {inactive.length > 0 && (
        <details className="rounded-2xl bg-card ring-1 ring-foreground/10">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
            Pasif konular ({inactive.length})
          </summary>
          <ul className="flex flex-col divide-y border-t">
            {inactive.map((t) => (
              <li key={t.id} className="flex items-center gap-2 px-4 py-2">
                <span className="min-w-0 flex-1 text-sm break-words text-muted-foreground line-through">
                  {t.name}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onToggle(t, true)}
                  disabled={pending}
                >
                  <RotateCcwIcon data-icon="inline-start" />
                  Geri al
                </Button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
