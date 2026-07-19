import type { Metadata } from "next";
import { CoachAgentChat } from "@/components/app/coach-agent-chat";

export const metadata: Metadata = { title: "Koç Asistanı" };

export default function AsistanPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 py-6">
      <div>
        <h1 className="text-xl font-semibold">Koç Asistanı</h1>
        <p className="text-sm text-muted-foreground">
          Öğrencilerin hakkında sor; plan ve soru önerilerini onayınla uygula.
          Yazma işlemleri sen onaylamadan çalışmaz.
        </p>
      </div>
      <CoachAgentChat />
    </div>
  );
}
