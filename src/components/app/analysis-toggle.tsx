"use client";

import { useTransition } from "react";
import { CircleCheckIcon, ClockIcon } from "lucide-react";
import { toast } from "sonner";

import { useRefresh } from "@/lib/use-refresh";
import { callAction } from "@/lib/action-client";
import { setAnalysisDone } from "@/actions/tracking";
import { Button } from "@/components/ui/button";

/** "Deneme analizi yapıldı" bayrağı — koç tek dokunuşla işaretler. */
export function AnalysisToggle({
  mockExamId,
  done,
}: {
  mockExamId: number;
  done: boolean;
}) {
  const { refresh } = useRefresh();
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      const res = await callAction(setAnalysisDone, mockExamId, !done);
      if (res.ok) {
        toast.success(
          !done ? "Analiz yapıldı olarak işaretlendi" : "Analiz bekliyor",
        );
        refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Button
      variant={done ? "ghost" : "outline"}
      size="xs"
      disabled={pending}
      onClick={toggle}
      className={done ? "text-success hover:text-success" : undefined}
    >
      {done ? (
        <CircleCheckIcon data-icon="inline-start" />
      ) : (
        <ClockIcon data-icon="inline-start" />
      )}
      {done ? "Analiz yapıldı" : "Analiz bekliyor"}
    </Button>
  );
}
