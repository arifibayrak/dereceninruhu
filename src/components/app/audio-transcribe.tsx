"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MicIcon } from "lucide-react";
import { toast } from "sonner";

import { fileToWavChunks } from "@/lib/audio-wav";
import {
  createAudioTranscript,
  saveAudioTranscript,
  transcribeAudioChunk,
} from "@/actions/transcripts";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Props = {
  enrollmentId: number;
  studentId: number;
  coachingSessionId?: number | null;
};

/** Görüşme kaydını yükle -> istemcide 16 kHz WAV'a böl -> R2 + Whisper -> incele. */
export function AudioTranscribe({
  enrollmentId,
  studentId,
  coachingSessionId,
}: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  const run = async () => {
    if (!file) return toast.error("Bir ses dosyası seç.");
    if (!consent) return toast.error("KVKK onayını işaretle.");
    setBusy(true);
    try {
      const chunks = await fileToWavChunks(file, 45, setProgress);
      if (chunks.length === 0) throw new Error("Ses çok kısa ya da boş.");

      const created = await createAudioTranscript({
        enrollmentId,
        coachingSessionId: coachingSessionId ?? undefined,
        consentGranted: true,
      });
      if (!created.ok) throw new Error(created.error);
      const transcriptId = created.data.transcriptId;

      const texts: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        setProgress(`Çevriliyor ${i + 1}/${chunks.length}…`);
        const res = await transcribeAudioChunk({
          transcriptId,
          chunkIndex: i,
          dataBase64: chunks[i],
        });
        if (!res.ok) throw new Error(res.error);
        if (res.data.text.trim()) texts.push(res.data.text.trim());
      }

      setProgress("Kaydediliyor…");
      const saved = await saveAudioTranscript({
        transcriptId,
        fullText: texts.join("\n"),
      });
      if (!saved.ok) throw new Error(saved.error);

      router.push(`/koc/ogrenciler/${studentId}/transkript/${transcriptId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ses işlenemedi.");
      setProgress("");
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Field>
        <FieldLabel htmlFor="audio-file">Ses kaydı</FieldLabel>
        <Input
          id="audio-file"
          type="file"
          accept="audio/*,video/mp4,video/webm"
          disabled={busy}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <FieldDescription>
          Meet/Zoom kaydı (mp3, m4a, wav, webm…). Tarayıcıda 16 kHz&apos;e
          indirgenip parçalara bölünür.
        </FieldDescription>
      </Field>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={consent}
          disabled={busy}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span className="text-muted-foreground">
          Bu kaydın işlenmesi için öğrenci/veli onayı alındı (KVKK).
        </span>
      </label>

      <div className="flex items-center gap-3">
        <Button onClick={run} disabled={busy || !file || !consent}>
          <MicIcon className="size-4" />
          {busy ? "İşleniyor…" : "Yükle ve çevir"}
        </Button>
        {progress ? (
          <span className="text-sm text-muted-foreground">{progress}</span>
        ) : null}
      </div>
    </div>
  );
}
