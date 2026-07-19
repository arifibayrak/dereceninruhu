import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ChevronRightIcon } from "lucide-react";

import { getEnrollmentDetailByStudentId } from "@/db/queries/enrollment";
import { listTranscriptsForEnrollment } from "@/db/queries/transcripts";
import { formatTrDate } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { TranscriptPasteForm } from "@/components/app/transcript-paste-form";
import { AudioTranscribe } from "@/components/app/audio-transcribe";
import { LiveTranscribe } from "@/components/app/live-transcribe";

const STATUS_LABEL: Record<string, string> = {
  uploaded: "Yüklendi",
  transcribing: "Çevriliyor",
  transcribed: "Hazır",
  extracted: "Çıkarıldı",
  failed: "Hata",
};

export default async function TranskriptListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studentId = Number(id);
  if (!Number.isInteger(studentId)) notFound();

  const detail = await getEnrollmentDetailByStudentId(studentId);
  if (!detail) notFound();
  const enrollmentId = detail.enrollment.id;
  const transcripts = await listTranscriptsForEnrollment(enrollmentId);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-6">
      <div>
        <Link
          href={`/koc/ogrenciler/${studentId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" /> {detail.student.fullName}
        </Link>
        <h1 className="mt-1 text-xl font-semibold">Görüşme transkriptleri</h1>
      </div>

      <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="mb-3 text-sm font-medium">Canlı (mikrofon)</h2>
        <LiveTranscribe enrollmentId={enrollmentId} studentId={studentId} />
      </section>

      <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="mb-3 text-sm font-medium">Ses kaydından</h2>
        <AudioTranscribe enrollmentId={enrollmentId} studentId={studentId} />
      </section>

      <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="mb-3 text-sm font-medium">Metin yapıştır</h2>
        <TranscriptPasteForm
          enrollmentId={enrollmentId}
          studentId={studentId}
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Geçmiş</h2>
        {transcripts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz transkript yok.</p>
        ) : (
          transcripts.map((t) => (
            <Link
              key={t.id}
              href={`/koc/ogrenciler/${studentId}/transkript/${t.id}`}
              className="flex items-center justify-between gap-3 rounded-lg bg-card p-3 text-sm ring-1 ring-foreground/10 hover:ring-foreground/20"
            >
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {formatTrDate(t.createdAt)}
                </span>
                <Badge className="bg-muted text-muted-foreground">
                  {t.source === "audio"
                    ? "Ses"
                    : t.source === "live"
                      ? "Canlı"
                      : "Metin"}
                </Badge>
                <Badge className="bg-info/10 text-info">
                  {STATUS_LABEL[t.status] ?? t.status}
                </Badge>
              </span>
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
