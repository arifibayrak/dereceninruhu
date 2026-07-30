"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TargetIcon } from "lucide-react";
import { toast } from "sonner";

import { createMock, updateMock } from "@/actions/tracking";
import type { MockEditData } from "@/db/queries/tracking";
import { trDayKey } from "@/lib/dates";
import { formatNet } from "@/lib/format";
import { formatPace, secondsPerQuestion } from "@/lib/pace";
import {
  computeNet,
  rollUpChildren,
  type SubjectCounts,
  type SubjectNode,
} from "@/lib/net";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { combinedMockLabel, durationPresets } from "@/lib/exam";
import { cn } from "@/lib/utils";

export type MockSubject = {
  id: number;
  name: string;
  isScored: boolean;
  parentSubjectId: number | null;
  officialQuestionCount: number | null;
};

export type MockSection = {
  id: number;
  /** Bölüm kodu (TYT, AYT, KPSS_GY…) — resmî süre önerileri buna bakar. */
  code: string;
  name: string;
  wrongPenaltyDivisor: number;
  /** Bölümün sınavı — çift sınavlı kayıtta seçenekler sınava göre gruplanır. */
  examTemplateId: number;
  examCode: string;
  examName: string;
  subjects: MockSubject[];
};

type Counts = { d: string; y: string; b: string };

type Props = {
  enrollmentId: number;
  sections: MockSection[];
  /** Başarıda gidilecek yol (öğrenci akışı); yoksa yalnız refresh (koç). */
  redirectTo?: string;
  /** Koç diyaloğunda kapatma vb. için (istemci-istemci callback). */
  onSuccess?: () => void;
  /**
   * Doluysa form DÜZENLEME modundadır: alanlar bu kayıttan doldurulur ve
   * kaydetme `updateMock`'a gider (yeni satır açmaz).
   */
  initial?: MockEditData;
};

const SCOPES = [
  { value: "full", label: "Tam deneme" },
  { value: "branch", label: "Branş denemesi" },
] as const;

/** Birleşik seçenek değeri — hangi SINAVIN birleşik denemesi olduğunu taşır. */
const combinedValue = (examTemplateId: number) => `combined:${examTemplateId}`;
const combinedTemplateId = (value: string): number | null =>
  value.startsWith("combined:") ? Number(value.slice("combined:".length)) : null;

/** Deneme girişi — D/Y/B gir, net canlı hesaplanır (D − Y ÷ bölen). */
/** Kayıtlı sonuç satırları → ızgaranın metin durumuna. */
function countsOf(initial: MockEditData | undefined): Record<number, Counts> {
  if (!initial) return {};
  const out: Record<number, Counts> = {};
  for (const r of initial.results) {
    out[r.subjectId] = {
      d: String(r.correctCount),
      y: String(r.wrongCount),
      b: String(r.blankCount),
    };
  }
  return out;
}

export function MockForm({
  enrollmentId,
  sections,
  redirectTo,
  onSuccess,
  initial,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  /*
   * Seçenekler SINAV SINAV kurulur: bir şablonun bölümleri tek oturumda
   * çözülüyorsa (KPSS GY + GK) önce onun birleşik seçeneği, ardından tek tek
   * bölümleri gelir. Çift sınavlı kayıtta liste iki sınavı da kapsar.
   */
  const examGroups = useMemo(() => {
    const byTemplate = new Map<number, MockSection[]>();
    for (const s of sections) {
      const list = byTemplate.get(s.examTemplateId) ?? [];
      list.push(s);
      byTemplate.set(s.examTemplateId, list);
    }
    return [...byTemplate.entries()].map(([examTemplateId, secs]) => {
      const label = combinedMockLabel(secs[0].examCode);
      return {
        examTemplateId,
        examName: secs[0].examName,
        sections: secs,
        /** Birleşik giriş yalnız çok bölümlü tek-oturum sınavlarında anlamlı. */
        combinedLabel: label && secs.length > 1 ? label : null,
      };
    });
  }, [sections]);

  const multiExam = examGroups.length > 1;
  const sectionById = useMemo(
    () => new Map(sections.map((s) => [s.id, s])),
    [sections],
  );

  const [selection, setSelection] = useState<string>(() => {
    if (initial) {
      const tid = sectionById.get(initial.examSectionId)?.examTemplateId;
      const group = examGroups.find((g) => g.examTemplateId === tid);
      return initial.combined && group?.combinedLabel
        ? combinedValue(group.examTemplateId)
        : String(initial.examSectionId);
    }
    // Varsayılan: birincil sınavın birleşiği varsa o, yoksa ilk bölüm.
    const first = examGroups[0];
    return first?.combinedLabel
      ? combinedValue(first.examTemplateId)
      : String(sections[0]?.id ?? 0);
  });
  const [scope, setScope] = useState<"full" | "branch">(initial?.scope ?? "full");
  const [takenOn, setTakenOn] = useState(
    () => initial?.takenOn ?? trDayKey(new Date()),
  );
  const [publisher, setPublisher] = useState(initial?.publisher ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  /** Çözüm süresi, dakika (metin). Kaydetmek için ZORUNLU. */
  const [duration, setDuration] = useState(
    initial?.durationMinutes != null ? String(initial.durationMinutes) : "",
  );
  /** Süresiz kaydetmeye çalışıldı — alan kırmızıya döner. */
  const [durationError, setDurationError] = useState(false);
  const [counts, setCounts] = useState<Record<number, Counts>>(() =>
    countsOf(initial),
  );

  const combinedOf = combinedTemplateId(selection);
  const combinedGroup = examGroups.find(
    (g) => g.examTemplateId === combinedOf && g.combinedLabel,
  );
  const isCombined = Boolean(combinedGroup);
  /**
   * Girişe dahil bölümler — birleşikte O SINAVIN tüm bölümleri, değilse yalnız
   * seçilen bölüm. Diğer sınavın bölümleri asla aynı denemeye karışmaz.
   */
  const activeSections = combinedGroup
    ? combinedGroup.sections
    : sections.filter((s) => String(s.id) === selection);
  const section = activeSections[0] ?? sections[0];

  /** Çift sınavda etiketlere sınav adı eklenir (iki sınavda da "Türkçe" var). */
  const options = examGroups.flatMap((g) => [
    ...(g.combinedLabel
      ? [{ value: combinedValue(g.examTemplateId), label: g.combinedLabel }]
      : []),
    ...g.sections.map((s) => ({
      value: String(s.id),
      label: multiExam ? `${g.examName} · ${s.name}` : s.name,
    })),
  ]);

  const setCount = (subjectId: number, key: keyof Counts, raw: string) => {
    const clean = raw.replace(/\D/g, "").slice(0, 3);
    setCounts((prev) => {
      const current = prev[subjectId] ?? { d: "", y: "", b: "" };
      return { ...prev, [subjectId]: { ...current, [key]: clean } };
    });
  };

  const numOf = (subjectId: number, key: keyof Counts) => {
    const n = parseInt(counts[subjectId]?.[key] ?? "", 10);
    return Number.isFinite(n) ? n : 0;
  };

  /**
   * Alt dersler puanlanan ebeveyne toplanmış canlı netler. Roll-up her bölüm
   * içinde ayrı yapılır — alt ders hiçbir zaman bölüm sınırını aşmaz ve her
   * bölüm kendi yanlış bölenini kullanır.
   */
  const { rolledNets, sectionNets, totalNet, hasAny, totalQuestions } = useMemo(() => {
    const nets = new Map<number, number>();
    const perSection = new Map<number, number>();
    let total = 0;
    let any = false;
    /** Tempo paydası: D+Y+B. Roll-up SONRASI sayılır — alt ders iki kez sayılmaz. */
    let questions = 0;
    for (const sec of activeSections) {
      const map = new Map<number, SubjectCounts>();
      for (const s of sec.subjects) {
        const d = numOf(s.id, "d");
        const y = numOf(s.id, "y");
        const b = numOf(s.id, "b");
        if (d + y + b > 0) any = true;
        map.set(s.id, { correct: d, wrong: y, blank: b });
      }
      const tree: SubjectNode[] = sec.subjects.map((s) => ({
        id: s.id,
        parentSubjectId: s.parentSubjectId,
        isScored: s.isScored,
      }));
      let sectionTotal = 0;
      for (const [id, c] of rollUpChildren(map, tree)) {
        const net = computeNet(c.correct, c.wrong, sec.wrongPenaltyDivisor);
        nets.set(id, net);
        sectionTotal += net;
        questions += c.correct + c.wrong + (c.blank ?? 0);
      }
      perSection.set(sec.id, Math.round(sectionTotal * 100) / 100);
      total += sectionTotal;
    }
    return {
      rolledNets: nets,
      sectionNets: perSection,
      totalNet: Math.round(total * 100) / 100,
      hasAny: any,
      totalQuestions: questions,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts, activeSections]);

  /** Canlı tempo — süre yazılırken anında görünür (D/Y/B girildiyse). */
  const durationMinutes = parseInt(duration, 10);
  const hasDuration = Number.isFinite(durationMinutes) && durationMinutes > 0;
  const livePace = secondsPerQuestion(durationMinutes, totalQuestions);

  /**
   * Hazır süreler seçilen kapsama + bölüme göre değişir: tam denemede o
   * sınavın resmî süresi (birleşikte bölümlerin toplamı), branşta kısa süreler.
   */
  const presets = durationPresets({
    scope,
    sectionCodes: activeSections.map((s) => s.code),
  });

  const submit = async () => {
    if (!section) return;
    if (!takenOn) {
      toast.error("Deneme tarihini seç.");
      return;
    }
    // Süre zorunlu: tempo (sn/soru) onsuz hesaplanamaz, hız takibi de kopar.
    if (!hasDuration) {
      setDurationError(true);
      toast.error("Süre zorunlu — denemeyi kaç dakikada bitirdin?");
      return;
    }
    const results = activeSections
      .flatMap((s) => s.subjects)
      .filter((s) => numOf(s.id, "d") + numOf(s.id, "y") + numOf(s.id, "b") > 0)
      .map((s) => ({
        subjectId: s.id,
        correctCount: numOf(s.id, "d"),
        wrongCount: numOf(s.id, "y"),
        blankCount: numOf(s.id, "b"),
      }));
    if (results.length === 0) {
      toast.error("En az bir ders için doğru/yanlış gir.");
      return;
    }
    setSaving(true);
    const payload = {
      enrollmentId,
      examSectionId: section.id,
      combined: isCombined,
      scope,
      publisher,
      name,
      takenOn,
      durationMinutes,
      results,
    };
    const res = initial
      ? await updateMock({ ...payload, mockExamId: initial.mockExamId })
      : await createMock(payload);
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(initial ? "Deneme güncellendi" : "Deneme kaydedildi", {
      description: livePace
        ? `Toplam ${formatNet(totalNet)} net · ${formatPace(livePace)}`
        : `Toplam ${formatNet(totalNet)} net`,
    });
    // Düzenlemede alanlar kayıtlı haliyle kalmalı — yalnız yeni girişte temizle.
    if (!initial) {
      setCounts({});
      setPublisher("");
      setName("");
      setDuration("");
    }
    onSuccess?.();
    if (redirectTo) {
      router.push(redirectTo);
      router.refresh();
    } else {
      router.refresh();
    }
  };

  if (!section) {
    return (
      <p className="text-sm text-muted-foreground">
        Bu sınav için tanımlı bölüm bulunamadı.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="deneme-bolum">Bölüm</FieldLabel>
          <Select
            items={options}
            value={selection}
            onValueChange={(v) => {
              if (typeof v === "string") setSelection(v);
            }}
          >
            <SelectTrigger id="deneme-bolum" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {combinedGroup && (
            <p className="text-xs text-muted-foreground">
              {combinedGroup.sections.map((s) => s.name).join(" + ")} tek deneme
              olarak kaydedilir.
            </p>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="deneme-kapsam">Kapsam</FieldLabel>
          <Select
            items={[...SCOPES]}
            value={scope}
            onValueChange={(v) => {
              if (v === "full" || v === "branch") setScope(v);
            }}
          >
            <SelectTrigger id="deneme-kapsam" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCOPES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="deneme-tarih">Tarih</FieldLabel>
          <Input
            id="deneme-tarih"
            type="date"
            value={takenOn}
            max={trDayKey(new Date())}
            onChange={(e) => setTakenOn(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="deneme-sure">
            Süre (dk) <span className="text-destructive">*</span>
          </FieldLabel>
          {/* Tek dokunuşla süre — klavye açmadan. Seçenekler kapsama göre. */}
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => {
              const active = durationMinutes === p.minutes;
              return (
                <button
                  key={p.minutes}
                  type="button"
                  onClick={() => {
                    setDuration(String(p.minutes));
                    setDurationError(false);
                  }}
                  aria-pressed={active}
                  className={cn(
                    "h-8 rounded-full px-3 text-xs font-medium tabular-nums transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <Input
            id="deneme-sure"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={scope === "branch" ? "Örn. 35" : "Örn. 165"}
            value={duration}
            aria-invalid={durationError || undefined}
            onChange={(e) => {
              setDuration(e.target.value.replace(/\D/g, "").slice(0, 3));
              setDurationError(false);
            }}
          />
          {durationError ? (
            <p className="text-xs font-medium text-destructive">
              Süre zorunlu — kaç dakikada bitirdiğini yaz ya da yukarıdan seç.
            </p>
          ) : livePace ? (
            <p className="text-xs font-medium text-primary tabular-nums">
              {totalQuestions} soru · {duration} dk → {formatPace(livePace)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {scope === "branch"
                ? "Kaç dakikada bitirdin? Hızını buradan takip edeceğiz."
                : "Kaç dakikada bitirdin?"}
            </p>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="deneme-yayin">Yayınevi</FieldLabel>
          <Input
            id="deneme-yayin"
            placeholder="Örn. 3D, Limit, Bilgi Sarmal"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
          />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="deneme-ad">Deneme adı</FieldLabel>
          <Input
            id="deneme-ad"
            placeholder="Örn. 3D TYT Deneme 13"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
      </div>

      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">Ders</th>
              <th className="px-1 py-2 text-center font-medium">D</th>
              <th className="px-1 py-2 text-center font-medium">Y</th>
              <th className="px-1 py-2 text-center font-medium">B</th>
              <th className="px-3 py-2 text-right font-medium">Net</th>
            </tr>
          </thead>
          {activeSections.map((sec) => (
            <tbody key={sec.id}>
              {isCombined && (
                <tr className="border-b bg-muted/30">
                  <td
                    colSpan={4}
                    className="px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                  >
                    {sec.name}
                  </td>
                  <td className="px-3 py-1.5 text-right text-xs font-medium tabular-nums text-muted-foreground">
                    {hasAny ? formatNet(sectionNets.get(sec.id) ?? 0) : ""}
                  </td>
                </tr>
              )}
              {sec.subjects.map((subject) => {
                const isChild = subject.parentSubjectId != null;
                const net = rolledNets.get(subject.id);
                return (
                <tr key={subject.id} className="border-b last:border-0">
                  <td
                    className={cn(
                      "px-3 py-1.5 font-medium whitespace-nowrap",
                      isChild && "pl-6 text-muted-foreground font-normal",
                    )}
                  >
                    {subject.name}
                    {subject.officialQuestionCount != null && (
                      <span className="ml-1.5 text-[10px] text-muted-foreground tabular-nums">
                        /{subject.officialQuestionCount}
                      </span>
                    )}
                  </td>
                  {(["d", "y", "b"] as const).map((key) => (
                    <td key={key} className="px-0.5 py-1 text-center">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        aria-label={`${subject.name} ${
                          key === "d" ? "doğru" : key === "y" ? "yanlış" : "boş"
                        }`}
                        value={counts[subject.id]?.[key] ?? ""}
                        placeholder="·"
                        onChange={(e) => setCount(subject.id, key, e.target.value)}
                        className="h-9 w-11 rounded-md border border-transparent bg-transparent text-center tabular-nums transition-colors outline-none placeholder:text-muted-foreground/40 hover:border-input focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-1.5 text-right font-medium tabular-nums">
                    {subject.isScored && net !== undefined
                      ? formatNet(net)
                      : ""}
                  </td>
                </tr>
                );
              })}
            </tbody>
          ))}
          <tfoot>
            <tr className="border-t bg-muted/40 font-medium">
              <td colSpan={4} className="px-3 py-2">
                Toplam net
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums">
                {hasAny ? formatNet(totalNet) : "–"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <Button size="lg" onClick={submit} disabled={saving || !hasAny} className="self-end">
        <TargetIcon data-icon="inline-start" />
        {saving
          ? "Kaydediliyor…"
          : initial
            ? "Değişiklikleri kaydet"
            : "Denemeyi kaydet"}
      </Button>
    </div>
  );
}
