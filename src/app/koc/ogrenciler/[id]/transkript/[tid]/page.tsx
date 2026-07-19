import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

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

  const [proposals, sections, topicGroups, resources] = await Promise.all([
    listProposalsForTranscript(transcriptId),
    getSectionsForEnrollment(
      detail.enrollment.examTemplateId,
      detail.enrollment.trackCode,
    ),
    getTopicGroupsForExam(
      detail.enrollment.examTemplateId,
      detail.enrollment.trackCode,
    ),
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
    </div>
  );
}
