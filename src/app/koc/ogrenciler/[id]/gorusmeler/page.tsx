import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon, MessageCircleIcon } from "lucide-react";

import {
  listSessionsForEnrollment,
  type EnrollmentSessionRow,
} from "@/db/queries/sessions";
import {
  SessionsPanel,
  type SessionItem,
} from "@/components/app/sessions-panel";
import { CockpitShell, resolveCockpit } from "../_cockpit";

export const metadata: Metadata = { title: "Görüşmeler" };

function toSessionItems(rows: EnrollmentSessionRow[]): SessionItem[] {
  return rows.map((r) => ({
    id: r.id,
    scheduledAtMs: r.scheduledAt?.getTime() ?? null,
    heldAtMs: r.heldAt?.getTime() ?? null,
    status: r.status,
    summary: r.summary,
    studentVisibleNote: r.studentVisibleNote,
    nextPlanId: r.nextPlanId,
    nextPlanWeekKey: r.nextPlanWeekKey,
    meetingUrl: r.meetingUrl,
    meetingProvider: r.meetingProvider,
  }));
}

export default async function GorusmelerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studentId = Number(id);
  const { enrollment } = await resolveCockpit(studentId);
  const sessions = await listSessionsForEnrollment(enrollment.id, new Date());

  return (
    <>
      <CockpitShell studentId={studentId} active="gorusmeler" />
      <div className="flex flex-col gap-3">
        <Link
          href={`/koc/ogrenciler/${studentId}/transkript`}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-foreground/10 hover:ring-foreground/20"
        >
          <MessageCircleIcon className="size-4 text-muted-foreground" />
          Görüşme transkriptleri (AI önerileri)
          <ChevronRightIcon className="size-4 text-muted-foreground" />
        </Link>
        <SessionsPanel
          enrollmentId={enrollment.id}
          studentId={studentId}
          upcoming={toSessionItems(sessions.upcoming)}
          past={toSessionItems(sessions.past)}
        />
      </div>
    </>
  );
}
