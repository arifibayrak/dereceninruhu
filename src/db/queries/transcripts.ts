import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { aiProposals, transcripts } from "@/db/schema";

/** Tek transkript (metin + durum + özet). */
export async function getTranscriptById(id: number) {
  return getDb().query.transcripts.findFirst({
    where: eq(transcripts.id, id),
  });
}

/** Bir enrollment'ın transkriptleri (yeni -> eski). */
export async function listTranscriptsForEnrollment(enrollmentId: number) {
  return getDb().query.transcripts.findMany({
    where: eq(transcripts.enrollmentId, enrollmentId),
    orderBy: [desc(transcripts.createdAt)],
  });
}

/** Bir transkriptin AI önerileri (inceleme ekranı için). */
export async function listProposalsForTranscript(transcriptId: number) {
  return getDb().query.aiProposals.findMany({
    where: eq(aiProposals.transcriptId, transcriptId),
    orderBy: [desc(aiProposals.createdAt)],
  });
}
