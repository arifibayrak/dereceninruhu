"use client";

import { useMemo, useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  MegaphoneIcon,
  MessageCircleIcon,
  SearchIcon,
} from "lucide-react";
import { toast } from "sonner";

import { buildWaLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type AnnouncementStudent = {
  studentId: number;
  fullName: string;
  phone: string | null;
  examCode: string;
  trackName: string | null;
};

/** Hazır duyuru şablonları — {ad} öğrenci adıyla değişir. */
const TEMPLATES: { label: string; text: string }[] = [
  {
    label: "Haftalık hatırlatma",
    text: "Merhaba {ad}! Bu haftanın programını ve soru takibini uygulamaya işlemeyi unutma, birlikte takip edelim 💪",
  },
  {
    label: "Deneme duyurusu",
    text: "Merhaba {ad}! Bu hafta sonu deneme var — hazırlıklı olalım, eksik konularını birlikte kapatalım 📊",
  },
  {
    label: "Motivasyon",
    text: "Merhaba {ad} 👋 Bu hafta güzel gidiyorsun, tempoyu koruyalım — hedefe emin adımlarla 🎯",
  },
  {
    label: "Görüşme hatırlatma",
    text: "Merhaba {ad}, yaklaşan koçluk görüşmemiz öncesi programını ve sorularını doldurmayı unutma 🙌",
  },
];

const firstName = (fullName: string) => fullName.trim().split(/\s+/)[0] || "";
const personalize = (msg: string, fullName: string) =>
  msg.replaceAll("{ad}", firstName(fullName));

export function AnnouncementComposer({
  students,
}: {
  students: AnnouncementStudent[];
}) {
  const [message, setMessage] = useState("Merhaba {ad} 👋 ");
  const [exam, setExam] = useState<string>("tumu");
  const [query, setQuery] = useState("");
  const [opened, setOpened] = useState<Set<number>>(new Set());

  const exams = useMemo(
    () => [...new Set(students.map((s) => s.examCode))].sort(),
    [students],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return students.filter(
      (s) =>
        (exam === "tumu" || s.examCode === exam) &&
        (q === "" || s.fullName.toLocaleLowerCase("tr").includes(q)),
    );
  }, [students, exam, query]);

  const withPhone = filtered.filter((s) => s.phone);
  const messagedCount = filtered.filter((s) => opened.has(s.studentId)).length;
  const previewName = filtered[0]?.fullName ?? "Ahmet Yılmaz";

  const markOpened = (id: number) =>
    setOpened((prev) => new Set(prev).add(id));

  const copyOne = async (s: AnnouncementStudent) => {
    try {
      await navigator.clipboard.writeText(personalize(message, s.fullName));
      toast.success("Mesaj kopyalandı");
    } catch {
      toast.error("Kopyalanamadı");
    }
  };

  const messageEmpty = message.trim() === "";

  return (
    <div className="flex flex-col gap-5">
      {/* Mesaj */}
      <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Mesaj</span>
          <span className="text-xs text-muted-foreground">
            <code className="rounded bg-muted px-1 py-0.5">{"{ad}"}</code> öğrencinin
            adıyla değişir
          </span>
        </div>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Merhaba {ad} 👋 …"
          className="resize-y"
        />
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATES.map((t) => (
            <Button
              key={t.label}
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setMessage(t.text)}
            >
              {t.label}
            </Button>
          ))}
        </div>
        {!messageEmpty && (
          <p className="rounded-lg bg-muted/60 p-2.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Önizleme: </span>
            {personalize(message, previewName)}
          </p>
        )}
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <FilterChip active={exam === "tumu"} onClick={() => setExam("tumu")}>
            Tümü
          </FilterChip>
          {exams.map((code) => (
            <FilterChip
              key={code}
              active={exam === code}
              onClick={() => setExam(code)}
            >
              {code}
            </FilterChip>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-56">
          <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Öğrenci ara"
            className="pl-8"
          />
        </div>
      </div>

      {/* Özet */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">{withPhone.length}</span>{" "}
          öğrenciye WhatsApp
        </span>
        <span>
          <span className="font-semibold text-foreground">{messagedCount}</span>{" "}
          mesajlandı
        </span>
        {filtered.length - withPhone.length > 0 && (
          <span className="text-destructive">
            {filtered.length - withPhone.length} telefonu yok
          </span>
        )}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
          <MegaphoneIcon className="size-4 shrink-0" />
          Bu filtrede öğrenci yok.
        </div>
      ) : (
        <ul className="flex flex-col divide-y rounded-2xl ring-1 ring-foreground/10">
          {filtered.map((s) => {
            const isOpened = opened.has(s.studentId);
            return (
              <li
                key={s.studentId}
                className="flex items-center gap-3 px-4 py-2.5 first:pt-3 last:pb-3"
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs",
                    isOpened
                      ? "bg-success/15 text-success"
                      : "bg-muted text-muted-foreground",
                  )}
                  aria-hidden
                >
                  {isOpened ? (
                    <CheckIcon className="size-3.5" />
                  ) : (
                    firstName(s.fullName).charAt(0)
                  )}
                </span>
                <div className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate text-sm font-medium">
                    {s.fullName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {s.examCode}
                    {s.trackName ? ` · ${s.trackName}` : ""}
                  </span>
                </div>
                {s.phone ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Mesajı kopyala"
                      onClick={() => copyOne(s)}
                    >
                      <CopyIcon className="size-4" />
                    </Button>
                    <Button
                      size="xs"
                      variant={isOpened ? "outline" : "default"}
                      disabled={messageEmpty}
                      render={
                        <a
                          href={buildWaLink(
                            s.phone,
                            personalize(message, s.fullName),
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => markOpened(s.studentId)}
                        />
                      }
                    >
                      <MessageCircleIcon data-icon="inline-start" />
                      {isOpened ? "Tekrar" : "WhatsApp"}
                    </Button>
                  </>
                ) : (
                  <Badge variant="outline">Telefon yok</Badge>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/70",
      )}
    >
      {children}
    </button>
  );
}
