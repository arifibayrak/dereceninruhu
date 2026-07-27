"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { setSecondaryExam } from "@/actions/students";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE = "yok";

/** Alan seçimi yalnız YKS için anlamlıdır (KPSS/LGS alansızdır). */
const TRACKS = [
  { value: "SAY", label: "Sayısal" },
  { value: "EA", label: "Eşit Ağırlık" },
  { value: "SOZ", label: "Sözel" },
] as const;

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
  const router = useRouter();
  const [exam, setExam] = useState(secondaryExamCode ?? NONE);
  const [track, setTrack] = useState(secondaryTrackCode ?? "");
  const [pending, startTransition] = useTransition();

  const examItems = [
    { value: NONE, label: "Yok" },
    ...["KPSS", "YKS", "LGS"]
      .filter((code) => code !== primaryExamCode)
      .map((code) => ({ value: code, label: code })),
  ];

  const save = (nextExam: string, nextTrack: string) => {
    // YKS ikinci sınavsa alan seçilene kadar kaydetme — sunucu da reddeder.
    if (nextExam === "YKS" && !nextTrack) return;
    startTransition(async () => {
      const res = await setSecondaryExam({
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
      router.refresh();
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
          if (next !== "YKS") setTrack("");
          save(next, next === "YKS" ? track : "");
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

      {exam === "YKS" && (
        <Select
          items={[...TRACKS]}
          value={track}
          onValueChange={(v) => {
            const next = v as string;
            setTrack(next);
            save("YKS", next);
          }}
          disabled={pending}
        >
          <SelectTrigger size="sm" aria-label="İkinci sınavın alanı">
            <SelectValue placeholder="Alan seç" />
          </SelectTrigger>
          <SelectContent>
            {TRACKS.map((t) => (
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
