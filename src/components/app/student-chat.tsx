"use client";

import { useRef, useState, useTransition } from "react";
import { SendIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { sendStudentChatMessage } from "@/actions/student-chat";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Matematik netim nasıl gidiyor?",
  "Bu hafta neye ağırlık vermeliyim?",
  "En zayıf konularım neler?",
];

export function StudentChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [threadId, setThreadId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [busy, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setInput("");
    startTransition(async () => {
      const res = await sendStudentChatMessage({ threadId, text: trimmed });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setThreadId(res.data.threadId);
      setMessages((m) => [...m, { role: "assistant", content: res.data.text }]);
      queueMicrotask(() =>
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }),
      );
    });
  };

  return (
    <div className="flex h-[calc(100vh-11rem)] flex-col gap-3">
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto rounded-xl bg-muted/30 p-3"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center text-sm text-muted-foreground">
            <SparklesIcon className="size-6" />
            <p>
              Gelişimin hakkında bana soru sorabilirsin. Cevaplar yalnız senin
              verine dayanır.
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full bg-card px-3 py-1.5 text-xs ring-1 ring-foreground/10"
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
          placeholder="Sorunu yaz…"
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
