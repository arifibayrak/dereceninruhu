import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { getR2 } from "@/db";
import {
  getEnrollmentDetailByStudentId,
  getSectionsForEnrollment,
} from "@/db/queries/enrollment";
import { getTopicGroupsForExam } from "@/db/queries/analiz";
import { getResourcesForEnrollment } from "@/db/queries/plans";
import {
  getTranscriptById,
  listProposalsForTranscript,
} from "@/db/queries/transcripts";
import {
  TranscriptReview,
  type ProposalItem,
  type ReviewLabels,
} from "@/components/app/transcript-review";
import { LiveTranscribeLoader } from "@/components/app/live-transcribe-loader";

export default async function TranskriptReviewPage({
  params,
}: {
  params: Promise<{ id: string; tid: string }>;
}) {
  const { id, tid } = await params;
  const studentId = Number(id);
  const transcriptId = Number(tid);
  if (!Number.isInteger(studentId) || !Number.isInteger(transcriptId)) {
    notFound();
  }

  const detail = await getEnrollmentDetailByStudentId(studentId);
  if (!detail) notFound();
  const enrollmentId = detail.enrollment.id;

  const transcript = await getTranscriptById(transcriptId);
  // Erişim: transkript bu öğrencinin enrollment'ına ait olmalı.
  if (!transcript || transcript.enrollmentId !== enrollmentId) notFound();

  // Canlı mikrofon ses parçaları (varsa) — playback için R2'den listele.
  let audioKeys: string[] = [];
  if (transcript.audioR2Key) {
    const listed = await getR2().list({ prefix: transcript.audioR2Key });
    audioKeys = listed.objects
      .map((o) => o.key)
      .filter((k) => k.endsWith(".webm") || k.endsWith(".mp4"))
      .sort();
  }

  const [proposals, sections, topicGroups, resources] = await Promise.all([
    listProposalsForTranscript(transcriptId),
    getSectionsForEnrollment(detail.enrollment),
    getTopicGroupsForExam(detail.enrollment),
    getResourcesForEnrollment(enrollmentId),
  ]);

  const labels: ReviewLabels = {
    subjects: {},
    topics: {},
    resources: {},
    sections: {},
  };
  for (const s of sections) {
    labels.sections[s.id] = s.name;
    for (const subj of s.loggable) labels.subjects[subj.id] = subj.name;
  }
  for (const g of topicGroups) {
    for (const t of g.topics) labels.topics[t.id] = t.name;
  }
  for (const r of resources) labels.resources[r.id] = r.name;

  const proposalItems: ProposalItem[] = proposals.map((p) => ({
    id: p.id,
    kind: p.kind,
    payloadJson: p.payloadJson,
    sourceQuote: p.sourceQuote,
    confidence: p.confidence,
    status: p.status,
  }));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 py-6">
      <Link
        href={`/koc/ogrenciler/${studentId}/transkript`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> Transkriptler
      </Link>
      <h1 className="text-xl font-semibold">
        {detail.student.fullName} · Transkript incelemesi
      </h1>
      {audioKeys.length > 0 ? (
        <section className="flex flex-col gap-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <h2 className="text-sm font-medium">Ses kaydı</h2>
          {audioKeys.map((k) => (
            <audio
              key={k}
              controls
              preload="none"
              className="w-full"
              src={`/api/uploads/${k}`}
            >
              <track kind="captions" />
            </audio>
          ))}
        </section>
      ) : null}

      <TranscriptReview
        transcript={{
          id: transcript.id,
          status: transcript.status,
          digest: transcript.digest,
          wordCount: transcript.wordCount,
          rawText: transcript.rawText,
        }}
        proposals={proposalItems}
        labels={labels}
      />

      <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="mb-3 text-sm font-medium">Kayda devam et (mikrofon)</h2>
        <LiveTranscribeLoader
          enrollmentId={enrollmentId}
          studentId={studentId}
          coachingSessionId={transcript.coachingSessionId ?? undefined}
          transcriptId={transcript.id}
          initialText={transcript.rawText ?? undefined}
        />
      </section>
    </div>
  );
}
