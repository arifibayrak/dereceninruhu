"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ImageIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  SquareIcon,
} from "lucide-react";
import { toast } from "sonner";

import { createStudyLog, uploadStudyProof } from "@/actions/study";
import { formatStopwatch } from "@/lib/study";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type StudySubject = { id: number; name: string; sectionName: string };

const GENEL = "genel";

function subjectItems(subjects: StudySubject[]) {
  return [
    { value: GENEL, label: "Genel / karışık" },
    ...subjects.map((s) => ({ value: String(s.id), label: s.name })),
  ];
}

function toSubjectId(value: string): number | null {
  return value === GENEL ? null : Number(value);
}

export function StudyLogger({
  enrollmentId,
  subjects,
  todayKey,
}: {
  enrollmentId: number;
  subjects: StudySubject[];
  todayKey: string;
}) {
  return (
    <Tabs defaultValue="kronometre">
      <TabsList className="w-full">
        <TabsTrigger value="kronometre" className="flex-1">
          Kronometre
        </TabsTrigger>
        <TabsTrigger value="manuel" className="flex-1">
          Manuel giriş
        </TabsTrigger>
      </TabsList>
      <TabsContent value="kronometre" className="pt-4">
        <TimerPane
          enrollmentId={enrollmentId}
          subjects={subjects}
          todayKey={todayKey}
        />
      </TabsContent>
      <TabsContent value="manuel" className="pt-4">
        <ManualPane
          enrollmentId={enrollmentId}
          subjects={subjects}
          todayKey={todayKey}
        />
      </TabsContent>
    </Tabs>
  );
}

function SubjectSelect({
  id,
  items,
  value,
  onChange,
}: {
  id: string;
  items: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select items={items} value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((i) => (
          <SelectItem key={i.value} value={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ------------------------------- Kronometre ------------------------------- */

function TimerPane({
  enrollmentId,
  subjects,
  todayKey,
}: {
  enrollmentId: number;
  subjects: StudySubject[];
  todayKey: string;
}) {
  const router = useRouter();
  const items = subjectItems(subjects);
  const [subject, setSubject] = useState<string>(GENEL);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  // Süre ölçümü ref'te tutulur; render Date.now() çağırmaz (saf kalır).
  const accumulatedRef = useRef(0);
  const startMsRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const tick = () =>
      setElapsedSec(
        accumulatedRef.current + (Date.now() - startMsRef.current) / 1000,
      );
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [running]);

  const start = () => {
    startMsRef.current = Date.now();
    setRunning(true);
  };
  const pause = () => {
    accumulatedRef.current += (Date.now() - startMsRef.current) / 1000;
    setRunning(false);
    setElapsedSec(accumulatedRef.current);
  };
  const reset = () => {
    accumulatedRef.current = 0;
    setRunning(false);
    setElapsedSec(0);
  };

  const finish = async () => {
    const total =
      accumulatedRef.current +
      (running ? (Date.now() - startMsRef.current) / 1000 : 0);
    const minutes = Math.round(total / 60);
    if (minutes < 1) {
      toast.error("En az 1 dakika çalışmalısın.");
      return;
    }
    setSaving(true);
    const res = await createStudyLog({
      enrollmentId,
      logDate: todayKey,
      subjectId: toSubjectId(subject),
      minutes,
      source: "timer",
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`${minutes} dk kaydedildi 💪`);
    reset();
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="timer-ders">Ders</FieldLabel>
        <SubjectSelect
          id="timer-ders"
          items={items}
          value={subject}
          onChange={setSubject}
        />
      </Field>

      <div className="flex flex-col items-center gap-1 rounded-2xl bg-card py-8 ring-1 ring-foreground/10">
        <span className="font-heading text-5xl font-semibold tabular-nums">
          {formatStopwatch(elapsedSec)}
        </span>
        <span className="text-xs text-muted-foreground">
          {running ? "Çalışıyor…" : "Duraklatıldı"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {running ? (
          <Button variant="outline" onClick={pause}>
            <PauseIcon data-icon="inline-start" />
            Duraklat
          </Button>
        ) : (
          <Button onClick={start}>
            <PlayIcon data-icon="inline-start" />
            {elapsedSec > 0 ? "Devam" : "Başla"}
          </Button>
        )}
        <Button
          variant="outline"
          onClick={reset}
          disabled={elapsedSec === 0 || saving}
        >
          <RotateCcwIcon data-icon="inline-start" />
          Sıfırla
        </Button>
        <Button onClick={finish} disabled={elapsedSec < 60 || saving}>
          <SquareIcon data-icon="inline-start" />
          {saving ? "…" : "Bitir"}
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Kaydetmek için en az 1 dakika. Koçun da toplam süreni görür.
      </p>
    </div>
  );
}

/* ------------------------------ Manuel giriş ------------------------------ */

function ManualPane({
  enrollmentId,
  subjects,
  todayKey,
}: {
  enrollmentId: number;
  subjects: StudySubject[];
  todayKey: string;
}) {
  const router = useRouter();
  const items = subjectItems(subjects);
  const fileRef = useRef<HTMLInputElement>(null);
  const [subject, setSubject] = useState<string>(GENEL);
  const [minutes, setMinutes] = useState("");
  const [date, setDate] = useState(todayKey);
  const [note, setNote] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mins = Number(minutes);
    if (!Number.isFinite(mins) || mins < 1) {
      setError("En az 1 dakika gir.");
      return;
    }
    setError(null);
    setSaving(true);

    // Kanıt görseli varsa önce yükle → key al.
    let proofKey: string | undefined;
    const file = fileRef.current?.files?.[0];
    if (file) {
      const fd = new FormData();
      fd.set("enrollmentId", String(enrollmentId));
      fd.set("file", file);
      const up = await uploadStudyProof(fd);
      if (!up.ok) {
        setSaving(false);
        toast.error(up.error);
        return;
      }
      proofKey = up.data.key;
    }

    const res = await createStudyLog({
      enrollmentId,
      logDate: date,
      subjectId: toSubjectId(subject),
      minutes: mins,
      source: "manual",
      note,
      proofKey,
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`${mins} dk eklendi`);
    setMinutes("");
    setNote("");
    setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  };

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="manuel-ders">Ders</FieldLabel>
            <SubjectSelect
              id="manuel-ders"
              items={items}
              value={subject}
              onChange={setSubject}
            />
          </Field>
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="manuel-dakika">Süre (dakika) *</FieldLabel>
            <Input
              id="manuel-dakika"
              inputMode="numeric"
              placeholder="Örn. 90"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              aria-invalid={error ? true : undefined}
            />
            <FieldError errors={error ? [{ message: error }] : []} />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="manuel-tarih">Gün</FieldLabel>
          <Input
            id="manuel-tarih"
            type="date"
            value={date}
            max={todayKey}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="manuel-not">Not (opsiyonel)</FieldLabel>
          <Input
            id="manuel-not"
            placeholder="Örn. paragraf çalışması"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="manuel-kanit">
            Kanıt ekran görüntüsü (opsiyonel)
          </FieldLabel>
          <input
            ref={fileRef}
            id="manuel-kanit"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <ImageIcon data-icon="inline-start" />
              Görsel seç
            </Button>
            {fileName && (
              <span className="truncate text-xs text-muted-foreground">
                {fileName}
              </span>
            )}
          </div>
        </Field>

        <Button type="submit" disabled={saving} className="self-start">
          {saving ? "Kaydediliyor…" : "Süreyi ekle"}
        </Button>
      </FieldGroup>
    </form>
  );
}
