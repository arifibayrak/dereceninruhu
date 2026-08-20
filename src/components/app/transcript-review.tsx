"use client";

import { useState, useTransition } from "react";
import { CheckIcon, SparklesIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { useRefresh } from "@/lib/use-refresh";
import { callAction } from "@/lib/action-client";
import {
  applyProposal,
  rejectProposal,
  runTranscriptExtraction,
} from "@/actions/transcripts";
import { DAY_NAMES_TR } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type ProposalItem = {
  id: number;
  kind:
    | "question_log_upsert"
    | "mock_exam_create"
    | "plan_task_create"
    | "topic_progress_update"
    | "session_note_update";
  payloadJson: string;
  sourceQuote: string | null;
  confidence: number | null;
  status: "proposed" | "approved" | "rejected" | "applied" | "failed";
};

export type ReviewLabels = {
  subjects: Record<number, string>;
  topics: Record<number, string>;
  resources: Record<number, string>;
  sections: Record<number, string>;
};

type Props = {
  transcript: {
    id: number;
    status: string;
    digest: string | null;
    wordCount: number | null;
    rawText: string | null;
  };
  proposals: ProposalItem[];
  labels: ReviewLabels;
};

const KIND_LABEL: Record<ProposalItem["kind"], string> = {
  question_log_upsert: "Soru takibi",
  mock_exam_create: "Deneme sonucu",
  plan_task_create: "Program görevi",
  topic_progress_update: "Konu ilerlemesi",
  session_note_update: "Görüşme notu",
};

const STATUS_META: Record<
  ProposalItem["status"],
  { label: string; className: string }
> = {
  proposed: { label: "Öneri", className: "bg-info/10 text-info" },
  approved: { label: "Onaylandı", className: "bg-info/10 text-info" },
  applied: { label: "Uygulandı", className: "bg-success/10 text-success" },
  rejected: { label: "Reddedildi", className: "bg-muted text-muted-foreground" },
  failed: { label: "Hata", className: "bg-warning/10 text-warning" },
};

/** ID'li payload -> koçun okuyabileceği Türkçe özet. */
function describe(
  kind: ProposalItem["kind"],
  payload: Record<string, unknown>,
  labels: ReviewLabels,
): string {
  const subj = (id: unknown) =>
    labels.subjects[Number(id)] ?? `ders #${String(id)}`;
  try {
    switch (kind) {
      case "question_log_upsert": {
        const entries = (payload.entries as { subjectId: number; questionCount: number }[]) ?? [];
        return `${String(payload.logDate ?? "")}: ${entries
          .map((e) => `${subj(e.subjectId)} ${e.questionCount} soru`)
          .join(", ")}`;
      }
      case "mock_exam_create": {
        const results = (payload.results as { subjectId: number; correctCount: number; wrongCount: number; blankCount: number }[]) ?? [];
        const sec = labels.sections[Number(payload.examSectionId)] ?? "deneme";
        return `${sec} (${String(payload.takenOn ?? "")}): ${results
          .map((r) => `${subj(r.subjectId)} D${r.correctCount}/Y${r.wrongCount}/B${r.blankCount}`)
          .join(", ")}`;
      }
      case "plan_task_create": {
        const day = Number(payload.day);
        const dayName = DAY_NAMES_TR[day - 1] ?? `gün ${day}`;
        const s = payload.subjectId ? ` [${subj(payload.subjectId)}]` : "";
        const q = payload.targetQuestions ? ` (${String(payload.targetQuestions)} soru)` : "";
        return `${dayName}${s}: ${String(payload.description ?? "")}${q}`;
      }
      case "topic_progress_update": {
        const topic = labels.topics[Number(payload.topicId)] ?? `konu #${String(payload.topicId)}`;
        const res = labels.resources[Number(payload.resourceId)] ?? `kaynak #${String(payload.resourceId)}`;
        return `${topic} × ${res}: ${payload.isDone ? "bitti" : "yapılmadı"}`;
      }
      case "session_note_update": {
        const parts = [payload.summary, payload.studentVisibleNote]
          .filter(Boolean)
          .join(" · ");
        return `${payload.status ? `[${String(payload.status)}] ` : ""}${parts || "(not)"}`;
      }
    }
  } catch {
    return "(özet oluşturulamadı)";
  }
}

export function TranscriptReview({ transcript, proposals, labels }: Props) {
  const { refresh } = useRefresh();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<number | null>(null);

  const runExtraction = () => {
    startTransition(async () => {
      const res = await callAction(runTranscriptExtraction, transcript.id);
      if (res.ok) {
        toast.success(`${res.data.proposalCount} öneri çıkarıldı.`);
        refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const approve = (id: number) => {
    setBusyId(id);
    startTransition(async () => {
      const res = await callAction(applyProposal, id);
      if (res.ok) toast.success("Uygulandı.");
      else toast.error(res.error);
      setBusyId(null);
      refresh();
    });
  };

  const reject = (id: number) => {
    setBusyId(id);
    startTransition(async () => {
      const res = await callAction(rejectProposal, id);
      if (res.ok) toast.success("Reddedildi.");
      else toast.error(res.error);
      setBusyId(null);
      refresh();
    });
  };

  const pendingCount = proposals.filter((p) => p.status === "proposed").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {transcript.wordCount ? `${transcript.wordCount} kelime · ` : ""}
          durum: {transcript.status}
        </div>
        <Button onClick={runExtraction} disabled={pending} size="sm">
          <SparklesIcon className="size-4" />
          {proposals.length > 0 ? "Yeniden çıkar" : "Çıkarımı çalıştır"}
        </Button>
      </div>

      {transcript.digest ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm">Özet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {transcript.digest}
          </CardContent>
        </Card>
      ) : null}

      {proposals.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Henüz öneri yok. Çıkarımı çalıştırın.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {pendingCount} bekleyen öneri. Her biri onaylanınca mevcut kayıt
            işlemi çalışır (net sunucuda hesaplanır).
          </p>
          {proposals.map((p) => {
            let payload: Record<string, unknown> = {};
            try {
              payload = JSON.parse(p.payloadJson) as Record<string, unknown>;
            } catch {
              /* boş bırak */
            }
            const status = STATUS_META[p.status];
            return (
              <Card key={p.id} size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <span>{KIND_LABEL[p.kind]}</span>
                    <Badge className={status.className}>{status.label}</Badge>
                    {p.confidence != null ? (
                      <Badge className="bg-muted text-muted-foreground">
                        %{Math.round(p.confidence * 100)}
                      </Badge>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm">
                  <div className="font-medium">
                    {describe(p.kind, payload, labels)}
                  </div>
                  {p.sourceQuote ? (
                    <blockquote className="border-l-2 border-foreground/20 pl-3 text-muted-foreground italic">
                      “{p.sourceQuote}”
                    </blockquote>
                  ) : null}
                </CardContent>
                {p.status === "proposed" ? (
                  <CardFooter className="flex gap-2 border-t pt-3">
                    <Button
                      size="sm"
                      onClick={() => approve(p.id)}
                      disabled={pending && busyId === p.id}
                    >
                      <CheckIcon className="size-4" />
                      Onayla
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => reject(p.id)}
                      disabled={pending && busyId === p.id}
                    >
                      <XIcon className="size-4" />
                      Reddet
                    </Button>
                  </CardFooter>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      {transcript.rawText ? (
        <details className="rounded-lg ring-1 ring-foreground/10 p-3 text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            Transkript metni
          </summary>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-foreground/90">
            {transcript.rawText}
          </pre>
        </details>
      ) : null}
    </div>
  );
}
