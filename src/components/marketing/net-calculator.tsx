"use client";

import { useMemo, useState } from "react";
import { RotateCcwIcon } from "lucide-react";

import type { CalculatorExam } from "@/db/queries/cms";
import { formatNet } from "@/lib/format";
import { computeNet } from "@/lib/net";
import { accuracyPct } from "@/lib/question-log";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Counts = { correct: string; wrong: string };

const num = (raw: string) => {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/**
 * Ücretsiz net hesaplama aracı.
 *
 * Yapı (dersler, soru sayıları, yanlış böleni) SINAV ŞABLONUNDAN gelir —
 * burada hiçbir katsayı elle kodlanmaz. Net formülü uygulamanın kendi
 * `computeNet`'i ile aynıdır: net = doğru − yanlış / bölen (LGS 3, YKS/KPSS 4).
 *
 * Bilinçli sınır: PUAN ve SIRALAMA tahmini YAPMAZ. Yerleştirme puanı ÖSYM'nin
 * o yılki tüm adaylar üzerinden yaptığı standart puan hesabına dayanır; bunu
 * istemcide üretmek uydurma sayı yayınlamak olurdu. Puan/sıralama için
 * ÖSYM ve YÖK Atlas'a yönlendiriyoruz.
 */
export function NetCalculator({ exams }: { exams: CalculatorExam[] }) {
  const [examCode, setExamCode] = useState(exams[0]?.code ?? "");
  const [values, setValues] = useState<Record<number, Counts>>({});

  const exam = exams.find((e) => e.code === examCode) ?? exams[0];

  const at = (subjectId: number): Counts =>
    values[subjectId] ?? { correct: "", wrong: "" };

  const setCell = (subjectId: number, field: keyof Counts, raw: string) =>
    setValues((prev) => ({
      ...prev,
      [subjectId]: {
        ...at(subjectId),
        [field]: raw.replace(/\D/g, "").slice(0, 3),
      },
    }));

  /** Bölüm bazında net + toplam; sınav değişince yeniden hesaplanır. */
  const sectionTotals = useMemo(() => {
    if (!exam) return [];
    return exam.sections.map((section) => {
      let net = 0;
      let correct = 0;
      let wrong = 0;
      const perSubject = section.subjects.map((subject) => {
        const c = num(at(subject.id).correct);
        const w = num(at(subject.id).wrong);
        // Soru sayısını aşan giriş uyarılır ama hesap yine de yapılır.
        const over =
          subject.questionCount != null && c + w > subject.questionCount;
        const subjectNet = computeNet(c, w, section.wrongPenaltyDivisor);
        net += subjectNet;
        correct += c;
        wrong += w;
        return { subject, correct: c, wrong: w, net: subjectNet, over };
      });
      return {
        section,
        perSubject,
        net: Math.round(net * 100) / 100,
        correct,
        wrong,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, values]);

  const grandNet =
    Math.round(sectionTotals.reduce((a, s) => a + s.net, 0) * 100) / 100;
  const grandCorrect = sectionTotals.reduce((a, s) => a + s.correct, 0);
  const grandWrong = sectionTotals.reduce((a, s) => a + s.wrong, 0);
  const grandAccuracy = accuracyPct(grandCorrect, grandWrong);
  const touched = grandCorrect + grandWrong > 0;

  if (!exam) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Sınav seçimi */}
      <div
        role="tablist"
        aria-label="Sınav seç"
        className="flex flex-wrap gap-1.5"
      >
        {exams.map((e) => (
          <button
            key={e.code}
            type="button"
            role="tab"
            aria-selected={e.code === exam.code}
            onClick={() => {
              setExamCode(e.code);
              setValues({});
            }}
            className={cn(
              "inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium transition-colors",
              e.code === exam.code
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground",
            )}
          >
            {e.code}
          </button>
        ))}
      </div>

      {sectionTotals.map(({ section, perSubject, net }) => (
        <section key={section.id} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-heading text-base font-semibold">
              {section.name}
            </h2>
            <span className="text-sm text-muted-foreground">
              Yanlış {section.wrongPenaltyDivisor} doğruyu götürür ·{" "}
              <strong className="text-primary tabular-nums">
                {formatNet(net)} net
              </strong>
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium">Ders</th>
                  <th className="px-2 py-2 text-center font-medium text-success">
                    Doğru
                  </th>
                  <th className="px-2 py-2 text-center font-medium text-destructive">
                    Yanlış
                  </th>
                  <th className="px-3 py-2 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {perSubject.map(({ subject, net: subjectNet, over }) => (
                  <tr key={subject.id} className="border-b last:border-0">
                    <td className="px-3 py-1.5">
                      <span className="font-medium">{subject.name}</span>
                      {subject.questionCount != null && (
                        <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                          / {subject.questionCount}
                        </span>
                      )}
                    </td>
                    {(["correct", "wrong"] as const).map((field) => (
                      <td key={field} className="px-2 py-1 text-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          aria-label={`${subject.name} ${
                            field === "correct" ? "doğru" : "yanlış"
                          }`}
                          aria-invalid={over || undefined}
                          value={at(subject.id)[field]}
                          placeholder="0"
                          onChange={(e) =>
                            setCell(subject.id, field, e.target.value)
                          }
                          className={cn(
                            "h-10 w-16 rounded-md border border-input bg-transparent text-center text-base tabular-nums outline-none placeholder:text-muted-foreground/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
                            over && "border-destructive",
                          )}
                        />
                      </td>
                    ))}
                    <td
                      className={cn(
                        "px-3 py-1.5 text-right font-medium tabular-nums",
                        over && "text-destructive",
                      )}
                    >
                      {formatNet(subjectNet)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {perSubject.some((p) => p.over) && (
            <p className="text-xs text-destructive">
              Bazı derslerde doğru + yanlış toplamı sınavdaki soru sayısını
              aşıyor — kontrol et.
            </p>
          )}
        </section>
      ))}

      {/* Sonuç */}
      <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg">
        <div className="flex flex-col">
          <span className="text-xs font-semibold tracking-[0.14em] uppercase opacity-85">
            Toplam net
          </span>
          <span className="font-heading text-4xl font-bold tabular-nums">
            {formatNet(grandNet)}
          </span>
        </div>
        <div className="flex flex-col text-sm opacity-90">
          <span className="tabular-nums">
            {grandCorrect} doğru · {grandWrong} yanlış
          </span>
          {grandAccuracy !== null && (
            <span className="tabular-nums">Doğruluk %{grandAccuracy}</span>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={!touched}
          onClick={() => setValues({})}
        >
          <RotateCcwIcon data-icon="inline-start" />
          Temizle
        </Button>
      </div>
    </div>
  );
}
