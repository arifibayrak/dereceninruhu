"use client";

import { useState } from "react";

import { LiveTranscribeLoader } from "./live-transcribe-loader";

type Student = {
  studentId: number;
  enrollmentId: number;
  fullName: string;
  examCode: string;
};

/**
 * Bağımsız canlı-transkript: önce öğrenci seç, sonra motoru o öğrenci için yükle.
 * `key` ile öğrenci değişince motor temiz remount olur (durum sıfırlanır).
 */
export function LiveTranscribePicker({ students }: { students: Student[] }) {
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const selected = students.find((s) => s.enrollmentId === enrollmentId) ?? null;

  if (students.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aktif öğrencin yok. Öğrenci ekleyince burada seçip transkripte
        başlayabilirsin.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="live-student" className="text-sm font-medium">
          Öğrenci
        </label>
        <select
          id="live-student"
          value={enrollmentId ?? ""}
          onChange={(e) =>
            setEnrollmentId(e.target.value ? Number(e.target.value) : null)
          }
          className="h-9 w-full max-w-sm rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Seç…</option>
          {students.map((s) => (
            <option key={s.enrollmentId} value={s.enrollmentId}>
              {s.fullName} · {s.examCode}
            </option>
          ))}
        </select>
      </div>

      {selected ? (
        <LiveTranscribeLoader
          key={selected.enrollmentId}
          enrollmentId={selected.enrollmentId}
          studentId={selected.studentId}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Transkripte başlamak için bir öğrenci seç.
        </p>
      )}
    </div>
  );
}
