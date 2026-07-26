"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
import {
  elapsedOf,
  formatStopwatch,
  MAX_TIMER_MIN,
  parseTimerState,
  type TimerState,
} from "@/lib/study";
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

/* --------------------------- Kronometre kalıcılığı -------------------------- */

/**
 * Kronometrenin GERÇEK durumu cihazda (localStorage) durur, React state'inde
 * değil. Telefonda uygulamadan çıkınca sayfa bellekten atılabiliyor; dönünce
 * React state'i sıfır olduğu için sayaç durmuş görünüyordu. Geçen süre artık
 * `startedAt` duvar saatinden türetilir (bkz. `elapsedOf`) — sekme uyusa,
 * sayfa atılsa da doğru.
 */
type TimerStore = {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => TimerState | null;
  getServerSnapshot: () => null;
  set: (next: TimerState | null) => void;
};

/**
 * Kayıt başına tek depo. `useSyncExternalStore` ile okunur: sunucuda null
 * döner, hydration sonrası cihazdaki gerçek duruma geçer — böylece ne
 * uyuşmazlık ne de efekt içinde setState olur (bkz. rehber/progress-context).
 */
const timerStores = new Map<string, TimerStore>();

function getTimerStore(enrollmentId: number): TimerStore {
  const key = `dr:kronometre:v1:${enrollmentId}`;
  const existing = timerStores.get(key);
  if (existing) return existing;

  const listeners = new Set<() => void>();
  // getSnapshot referans olarak kararlı olmalı: ham metin değişmediyse aynı
  // nesneyi döndürürüz, yoksa React sonsuz döngüye girer.
  let cachedRaw: string | null | undefined;
  let cached: TimerState | null = null;

  const store: TimerStore = {
    subscribe(onChange) {
      listeners.add(onChange);
      const onStorage = (e: StorageEvent) => {
        // Başka sekmede değiştiyse önbelleği geçersiz kıl.
        if (e.key === key) {
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
        raw = window.localStorage.getItem(key);
      } catch {
        return null;
      }
      if (raw !== cachedRaw) {
        cachedRaw = raw;
        cached = parseTimerState(raw, GENEL);
      }
      return cached;
    },
    getServerSnapshot: () => null,
    set(next) {
      const raw = next === null ? null : JSON.stringify(next);
      try {
        if (raw === null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, raw);
      } catch {
        // Kota dolu ya da gizli mod — sayaç oturum içinde yine de çalışır.
      }
      cachedRaw = raw;
      cached = next;
      listeners.forEach((l) => l());
    },
  };
  timerStores.set(key, store);
  return store;
}

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
  const [saving, setSaving] = useState(false);

  const store = useMemo(() => getTimerStore(enrollmentId), [enrollmentId]);
  const timer = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  const running = timer?.startedAt != null;
  const subject = timer?.subject ?? GENEL;

  /*
   * Ekrandaki süre `timer` + `now`dan TÜRETİLİR; ayrı bir sayaç state'i yok.
   * `now` yalnız çalışırken ilerler (duraklatıldığında elapsedOf zaten `now`u
   * kullanmaz), böylece boşta render tetiklenmez.
   */
  const [now, setNow] = useState(() => Date.now());
  const elapsedSec = elapsedOf(timer, now);

  useEffect(() => {
    if (!running) return;
    const tick = () => setNow(Date.now());
    const t = setInterval(tick, 250);
    // Arka planda interval kısılır/durur; öne dönünce hemen gerçek değeri yaz.
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("pageshow", tick);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("pageshow", tick);
    };
  }, [running]);

  const start = () => {
    const startedAt = Date.now();
    setNow(startedAt);
    store.set({ subject, accumulated: timer?.accumulated ?? 0, startedAt });
  };
  const pause = () =>
    store.set({ subject, accumulated: elapsedOf(timer, Date.now()), startedAt: null });
  /** Süreyi sıfırlar ama seçili dersi korur (cihazda da kalır). */
  const reset = () => store.set({ subject, accumulated: 0, startedAt: null });
  const pickSubject = (value: string) =>
    store.set({
      subject: value,
      accumulated: timer?.accumulated ?? 0,
      startedAt: timer?.startedAt ?? null,
    });

  const finish = async () => {
    const minutes = Math.min(
      MAX_TIMER_MIN,
      Math.round(elapsedOf(timer, Date.now()) / 60),
    );
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
          onChange={pickSubject}
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
        Uygulamadan çıksan da sayaç durmaz — döndüğünde kaldığın yerden devam
        eder. Kaydetmek için en az 1 dakika; koçun da toplam süreni görür.
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
