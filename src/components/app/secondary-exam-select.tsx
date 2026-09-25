"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { useRefresh } from "@/lib/use-refresh";
import { callAction } from "@/lib/action-client";
import { setSecondaryExam } from "@/actions/students";
import { EXAM_CODES, trackFieldLabel, tracksFor } from "@/lib/tracks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE = "yok";

/**
 * Öğrencinin İKİNCİ sınavı — aynı dönemde iki sınava hazırlananlar için
 * (ör. Ekim'de ortaöğretim KPSS, ardından 2027 YKS). Eklenince program, soru
 * takibi ve deneme girişi iki sınavın derslerini birden gösterir.
 *
 * Birinci sınav buradan değiştirilemez: geçmiş kayıtlar o şablonun ders
 * id'lerine bağlıdır. Kaldırmak veri silmez, yalnız listelerden çıkarır.
 */
export function SecondaryExamSelect({
  studentId,
  primaryExamCode,
  secondaryExamCode,
  secondaryTrackCode,
}: {
  studentId: number;
  primaryExamCode: string;
  secondaryExamCode: string | null;
  secondaryTrackCode: string | null;
}) {
  const { refresh } = useRefresh();
  const [exam, setExam] = useState(secondaryExamCode ?? NONE);
  const [track, setTrack] = useState(secondaryTrackCode ?? "");
  const [pending, startTransition] = useTransition();

  const examItems = [
    { value: NONE, label: "Yok" },
    ...EXAM_CODES
      .filter((code) => code !== primaryExamCode)
      .map((code) => ({ value: code, label: code })),
  ];

  /** İkinci sınavın bölümleri — YKS alanı / KPSS düzeyi (LGS'de yok). */
  const trackItems = tracksFor(exam);

  const save = (nextExam: string, nextTrack: string) => {
    // Bölümlü sınavda (YKS alan, KPSS düzey) seçim yapılana dek kaydetme —
    // sunucu da reddeder.
    if (tracksFor(nextExam).length > 0 && !nextTrack) return;
    startTransition(async () => {
      const res = await callAction(setSecondaryExam, {
        studentId,
        secondaryExamCode: nextExam === NONE ? "" : nextExam,
        secondaryTrackCode: nextExam === "YKS" ? nextTrack : "",
      });
      if (!res.ok) {
        setExam(secondaryExamCode ?? NONE);
        setTrack(secondaryTrackCode ?? "");
        toast.error(res.error);
        return;
      }
      toast.success(
        nextExam === NONE
          ? "İkinci sınav kaldırıldı"
          : `İkinci sınav: ${nextExam}`,
        {
          description:
            nextExam === NONE
              ? "Dersler yalnız birinci sınavdan gelecek."
              : "Program ve soru takibi artık iki sınavın derslerini de gösteriyor.",
        },
      );
      refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        items={examItems}
        value={exam}
        onValueChange={(v) => {
          const next = v as string;
          setExam(next);
          const keeps = tracksFor(next).some((t) => t.value === track);
          if (!keeps) setTrack("");
          save(next, keeps ? track : "");
        }}
        disabled={pending}
      >
        <SelectTrigger
          size="sm"
          aria-label="İkinci sınav"
          className={exam === NONE ? "text-muted-foreground" : undefined}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {examItems.map((i) => (
            <SelectItem key={i.value} value={i.value}>
              {i.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {trackItems.length > 0 && (
        <Select
          items={[...trackItems]}
          value={track}
          onValueChange={(v) => {
            const next = v as string;
            setTrack(next);
            save(exam, next);
          }}
          disabled={pending}
        >
          <SelectTrigger
            size="sm"
            aria-label={`İkinci sınavın ${trackFieldLabel(exam).toLocaleLowerCase("tr")} seçimi`}
          >
            <SelectValue placeholder={`${trackFieldLabel(exam)} seç`} />
          </SelectTrigger>
          <SelectContent>
            {trackItems.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
