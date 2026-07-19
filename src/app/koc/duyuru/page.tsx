import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MegaphoneIcon } from "lucide-react";

import { getRoster } from "@/db/queries/roster";
import { getViewer } from "@/lib/session";
import {
  AnnouncementComposer,
  type AnnouncementStudent,
} from "@/components/app/announcement-composer";

export const metadata: Metadata = { title: "Duyuru" };

export default async function KocDuyuruPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");

  const roster = await getRoster(viewer);
  const students: AnnouncementStudent[] = roster.map((r) => ({
    studentId: r.studentId,
    fullName: r.fullName,
    phone: r.phone,
    examCode: r.examCode,
    trackName: r.trackName,
  }));

  return (
    <>
      <div className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-gold" />
          Toplu mesaj
        </span>
        <h1 className="font-heading text-title">Duyuru</h1>
        <p className="text-sm text-muted-foreground">
          {viewer.role === "admin"
            ? "Tüm kadroya"
            : "Öğrencilerine"}{" "}
          WhatsApp&apos;tan kişiselleştirilmiş mesaj gönder — her mesajı sen
          onaylayıp yollarsın (otomatik gönderim yok).
        </p>
      </div>

      {students.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
          <MegaphoneIcon className="size-4 shrink-0" />
          Aktif öğrenci yok.
        </div>
      ) : (
        <AnnouncementComposer students={students} />
      )}
    </>
  );
}
