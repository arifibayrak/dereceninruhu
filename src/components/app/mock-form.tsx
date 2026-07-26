"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TargetIcon } from "lucide-react";
import { toast } from "sonner";

import { createMock, updateMock } from "@/actions/tracking";
import type { MockEditData } from "@/db/queries/tracking";
import { trDayKey } from "@/lib/dates";
import { formatNet } from "@/lib/format";
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
  name: string;
  wrongPenaltyDivisor: number;
  subjects: MockSubject[];
};

type Counts = { d: string; y: string; b: string };

type Props = {
  enrollmentId: number;
  sections: MockSection[];
  /**
   * Şablonun bölümleri tek oturumda çözülüyorsa birleşik seçeneğin adı
   * ("KPSS Denemesi"); null/undefined ise yalnız tek tek bölüm girilir.
   */
  combinedLabel?: string | null;
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

const COMBINED = "combined";

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
  combinedLabel,
  redirectTo,
  onSuccess,
  initial,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  /** Birleşik giriş mümkünse varsayılan odur — asıl kullanım tek oturumdur. */
  const canCombine = Boolean(combinedLabel) && sections.length > 1;
  const [selection, setSelection] = useState<string>(() => {
    if (initial) {
      return initial.combined && canCombine
        ? COMBINED
        : String(initial.examSectionId);
    }
    return canCombine ? COMBINED : String(sections[0]?.id ?? 0);
  });
  const [scope, setScope] = useState<"full" | "branch">(initial?.scope ?? "full");
  const [takenOn, setTakenOn] = useState(
    () => initial?.takenOn ?? trDayKey(new Date()),
  );
  const [publisher, setPublisher] = useState(initial?.publisher ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [counts, setCounts] = useState<Record<number, Counts>>(() =>
    countsOf(initial),
  );

  const isCombined = canCombine && selection === COMBINED;
  /** Girişe dahil bölümler — birleşikte hepsi, değilse yalnız seçilen. */
  const activeSections = isCombined
    ? sections
    : sections.filter((s) => String(s.id) === selection);
  const section = activeSections[0] ?? sections[0];

  const options = [
    ...(canCombine ? [{ value: COMBINED, label: combinedLabel as string }] : []),
    ...sections.map((s) => ({ value: String(s.id), label: s.name })),
  ];

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
  const { rolledNets, sectionNets, totalNet, hasAny } = useMemo(() => {
    const nets = new Map<number, number>();
    const perSection = new Map<number, number>();
    let total = 0;
    let any = false;
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
      }
      perSection.set(sec.id, Math.round(sectionTotal * 100) / 100);
      total += sectionTotal;
    }
    return {
      rolledNets: nets,
      sectionNets: perSection,
      totalNet: Math.round(total * 100) / 100,
      hasAny: any,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts, activeSections]);

  const submit = async () => {
    if (!section) return;
    if (!takenOn) {
      toast.error("Deneme tarihini seç.");
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
      description: `Toplam ${formatNet(totalNet)} net`,
    });
    // Düzenlemede alanlar kayıtlı haliyle kalmalı — yalnız yeni girişte temizle.
    if (!initial) {
      setCounts({});
      setPublisher("");
      setName("");
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
          {isCombined && (
            <p className="text-xs text-muted-foreground">
              {sections.map((s) => s.name).join(" + ")} tek deneme olarak
              kaydedilir.
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
