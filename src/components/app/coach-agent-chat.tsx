"use client";

import { useRef, useState, useTransition } from "react";
import { CheckIcon, SendIcon, SparklesIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { callAction } from "@/lib/action-client";
import {
  confirmCoachAgentWrite,
  rejectCoachAgentWrite,
  sendCoachAgentMessage,
  type PendingWrite,
} from "@/actions/koc-agent";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Matematikte gerileyen öğrenciler kim?",
  "Yusuf'a bu hafta salı 50 paragraf sorusu ekle",
  "En son görüşülmeyen öğrencileri özetle",
];

export function CoachAgentChat({
  heightClassName = "h-[calc(100vh-12rem)]",
}: {
  heightClassName?: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [pending, setPending] = useState<PendingWrite[]>([]);
  const [threadId, setThreadId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [busy, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = () =>
    queueMicrotask(() =>
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }),
    );

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setInput("");
    setThinking(true);
    scrollToEnd();
    startTransition(async () => {
      try {
        const res = await callAction(sendCoachAgentMessage, { threadId, text: trimmed });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        setThreadId(res.data.threadId);
        if (res.data.text) {
          setMessages((m) => [
            ...m,
            { role: "assistant", content: res.data.text },
          ]);
        }
        setPending(res.data.pendingWrites);
        scrollToEnd();
      } finally {
        setThinking(false);
      }
    });
  };

  const confirm = (w: PendingWrite) => {
    startTransition(async () => {
      const res = await callAction(confirmCoachAgentWrite, {
        threadId: threadId!,
        toolName: w.toolName,
        argsJson: w.argsJson,
      });
      if (res.ok) {
        toast.success("Uygulandı.");
        setPending((p) => p.filter((x) => x.toolCallId !== w.toolCallId));
        setMessages((m) => [
          ...m,
          { role: "assistant", content: `✓ Uygulandı: ${w.summary}` },
        ]);
      } else {
        toast.error(res.error);
      }
    });
  };

  const reject = (w: PendingWrite) => {
    startTransition(async () => {
      await callAction(rejectCoachAgentWrite, {
        threadId: threadId!,
        toolName: w.toolName,
        argsJson: w.argsJson,
      });
      setPending((p) => p.filter((x) => x.toolCallId !== w.toolCallId));
    });
  };

  return (
    <div className={cn("flex flex-col gap-3", heightClassName)}>
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto rounded-xl bg-muted/30 p-4"
      >
        {messages.length === 0 && pending.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-muted-foreground">
            <SparklesIcon className="size-6" />
            <p>
              Öğrencilerini sor, plan/soru önerisi iste. Yazma işlemleri
              onayınla uygulanır.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={busy}
                  className="rounded-full bg-card px-3 py-1.5 text-xs ring-1 ring-foreground/10 hover:ring-foreground/20 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card ring-1 ring-foreground/10",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {thinking ? (
          <div className="flex justify-start">
            <div
              className="flex items-center gap-1 rounded-2xl bg-card px-3.5 py-3 ring-1 ring-foreground/10"
              aria-label="Asistan yazıyor"
            >
              <span className="size-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.3s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.15s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-foreground/40" />
            </div>
          </div>
        ) : null}

        {pending.map((w) => (
          <Card key={w.toolCallId} size="sm" className="border border-warning/30">
            <CardContent className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-medium text-warning">
                Onay bekliyor
              </span>
              <span className="font-medium">{w.summary}</span>
            </CardContent>
            <CardFooter className="flex gap-2 border-t pt-3">
              <Button size="sm" disabled={busy} onClick={() => confirm(w)}>
                <CheckIcon className="size-4" />
                Onayla
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => reject(w)}
              >
                <XIcon className="size-4" />
                Reddet
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder="Bir şey sor ya da işlem iste…"
          className="min-h-11 flex-1 resize-none"
        />
        <Button
          size="icon"
          disabled={busy || !input.trim()}
          onClick={() => send(input)}
          aria-label="Gönder"
        >
          <SendIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
