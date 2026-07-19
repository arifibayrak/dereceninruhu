"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileTextIcon } from "lucide-react";
import { toast } from "sonner";

import { createPastedTranscript } from "@/actions/transcripts";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  enrollmentId: number;
  studentId: number;
  /** Opsiyonel: bir görüşmeye bağla (session_note_update için gerekir). */
  coachingSessionId?: number | null;
};

/** Meet/Zoom dökümünü yapıştır -> transkript oluştur -> inceleme sayfasına git. */
export function TranscriptPasteForm({
  enrollmentId,
  studentId,
  coachingSessionId,
}: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (text.trim().length < 20) {
      toast.error("Transkript çok kısa.");
      return;
    }
    startTransition(async () => {
      const res = await createPastedTranscript({
        enrollmentId,
        coachingSessionId: coachingSessionId ?? undefined,
        rawText: text,
      });
      if (res.ok) {
        router.push(
          `/koc/ogrenciler/${studentId}/transkript/${res.data.transcriptId}`,
        );
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Field>
      <FieldLabel htmlFor="transcript-text">Görüşme dökümü</FieldLabel>
      <Textarea
        id="transcript-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder="Google Meet / Zoom dökümünü buraya yapıştırın..."
      />
      <FieldDescription>
        Metni yapıştırıp kaydedin; sonraki adımda AI önerileri çıkarılır.
      </FieldDescription>
      <div>
        <Button onClick={submit} disabled={pending}>
          <FileTextIcon className="size-4" />
          Kaydet ve incele
        </Button>
      </div>
    </Field>
  );
}
