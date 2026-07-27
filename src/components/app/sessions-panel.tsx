"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDaysIcon,
  CalendarPlusIcon,
  CheckIcon,
  PencilIcon,
  PlusIcon,
  UserXIcon,
  VideoIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  createPlanFromSession,
  createSession,
  updateSession,
} from "@/actions/sessions";
import { addDays, mondayOf, trDayKey } from "@/lib/dates";
import { formatInt } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type SessionItem = {
  id: number;
  scheduledAtMs: number | null;
  heldAtMs: number | null;
  status: "scheduled" | "held" | "cancelled" | "missed";
  summary: string | null;
  studentVisibleNote: string | null;
  nextPlanId: number | null;
  nextPlanWeekKey: string | null;
  meetingUrl: string | null;
  meetingProvider: string | null;
};

type Props = {
  enrollmentId: number;
  studentId: number;
  upcoming: SessionItem[];
  past: SessionItem[];
};

const dtFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
});

const STATUS_META = {
  scheduled: { label: "Planlandı", className: "bg-info/10 text-info" },
  held: { label: "Yapıldı", className: "bg-success/10 text-success" },
  missed: { label: "Gelmedi", className: "bg-warning/10 text-warning" },
  cancelled: { label: "İptal", className: "bg-muted text-muted-foreground" },
} as const;

/** Kokpit "Görüşmeler" — planla, yapıldı/gelmedi işaretle, programa bağla. */
export function SessionsPanel({
  enrollmentId,
  studentId,
  upcoming,
  past,
}: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editSession, setEditSession] = useState<SessionItem | null>(null);
  const [pending, startTransition] = useTransition();

  const setStatus = (s: SessionItem, status: "held" | "missed") => {
    startTransition(async () => {
      const res = await updateSession({ sessionId: s.id, status });
      if (res.ok) {
        toast.success(
          status === "held"
            ? "Görüşme yapıldı olarak işaretlendi"
            : "Görüşme gelmedi olarak işaretlendi",
        );
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const planFromSession = (s: SessionItem) => {
    startTransition(async () => {
      const base = s.scheduledAtMs ? new Date(s.scheduledAtMs) : new Date();
      const weekStart = trDayKey(addDays(mondayOf(base), 7));
      const res = await createPlanFromSession({ sessionId: s.id, weekStart });
      if (res.ok) {
        toast.success("Haftalık program oluşturuldu", {
          description: "Görev ekler eklemez program öğrenciye açılır.",
        });
        router.push(
          `/koc/ogrenciler/${studentId}/program?hafta=${res.data.weekKey}`,
        );
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-base font-semibold">
          Görüşmeler · {formatInt(upcoming.length + past.length)}
        </h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <PlusIcon data-icon="inline-start" />
            Görüşme planla
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Görüşme planla</DialogTitle>
              <DialogDescription>
                Tarih ve saati seç; not öğrencinin Bugün ekranında görünür.
              </DialogDescription>
            </DialogHeader>
            <SessionForm
              mode="create"
              enrollmentId={enrollmentId}
              onDone={() => setCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Yaklaşan */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Yaklaşan
        </h3>
        {upcoming.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
            Planlanmış görüşme yok. &quot;Görüşme planla&quot; ile ilk görüşmeyi
            oluştur.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                studentId={studentId}
                pending={pending}
                onHeld={() => setStatus(s, "held")}
                onMissed={() => setStatus(s, "missed")}
                onEdit={() => setEditSession(s)}
                onCreatePlan={() => planFromSession(s)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Geçmiş */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Geçmiş
        </h3>
        {past.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
            Henüz görüşme geçmişi yok.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {past.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                studentId={studentId}
                pending={pending}
                onHeld={s.status === "scheduled" ? () => setStatus(s, "held") : undefined}
                onMissed={
                  s.status === "scheduled" ? () => setStatus(s, "missed") : undefined
                }
                onEdit={() => setEditSession(s)}
                onCreatePlan={() => planFromSession(s)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Düzenle diyaloğu */}
      <Dialog
        open={editSession !== null}
        onOpenChange={(open) => {
          if (!open) setEditSession(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Görüşmeyi düzenle</DialogTitle>
            <DialogDescription>
              Görüşme özeti yalnız koçlara görünür; öğrenci notu öğrenciye
              gösterilir.
            </DialogDescription>
          </DialogHeader>
          {editSession && (
            <SessionForm
              key={editSession.id}
              mode="edit"
              enrollmentId={enrollmentId}
              session={editSession}
              onDone={() => setEditSession(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Kart                                                                      */
/* -------------------------------------------------------------------------- */

function SessionCard({
  session: s,
  studentId,
  pending,
  onHeld,
  onMissed,
  onEdit,
  onCreatePlan,
}: {
  session: SessionItem;
  studentId: number;
  pending: boolean;
  onHeld?: () => void;
  onMissed?: () => void;
  onEdit: () => void;
  onCreatePlan: () => void;
}) {
  const meta = STATUS_META[s.status];
  const at = s.heldAtMs ?? s.scheduledAtMs;
  return (
    <li className="flex flex-col gap-2 rounded-xl bg-card p-3.5 ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">
          {at ? dtFmt.format(new Date(at)) : "Tarih belirsiz"}
        </span>
        <Badge className={meta.className}>{meta.label}</Badge>
      </div>
      {s.studentVisibleNote && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Öğrenci notu:</span>{" "}
          {s.studentVisibleNote}
        </p>
      )}
      {s.summary && (
        <p className="rounded-lg bg-muted/60 p-2.5 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Koç özeti:</span>{" "}
          {s.summary}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        {s.meetingUrl && (
          <Button
            size="xs"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            render={
              <a href={s.meetingUrl} target="_blank" rel="noopener noreferrer" />
            }
          >
            <VideoIcon data-icon="inline-start" />
            Görüşmeye katıl
          </Button>
        )}
        {onHeld && (
          <Button size="xs" variant="outline" disabled={pending} onClick={onHeld}>
            <CheckIcon data-icon="inline-start" />
            Yapıldı
          </Button>
        )}
        {onMissed && (
          <Button
            size="xs"
            variant="outline"
            disabled={pending}
            onClick={onMissed}
          >
            <UserXIcon data-icon="inline-start" />
            Gelmedi
          </Button>
        )}
        <Button size="xs" variant="ghost" onClick={onEdit} aria-label="Düzenle">
          <PencilIcon data-icon="inline-start" />
          Düzenle
        </Button>
        <span className="flex-1" />
        {s.nextPlanWeekKey ? (
          <Button
            size="xs"
            variant="ghost"
            className="text-primary hover:text-primary"
            render={
              <Link
                href={`/koc/ogrenciler/${studentId}/program?hafta=${s.nextPlanWeekKey}`}
              />
            }
          >
            <CalendarDaysIcon data-icon="inline-start" />
            Programı aç
          </Button>
        ) : (
          <Button
            size="xs"
            variant="outline"
            disabled={pending}
            onClick={onCreatePlan}
          >
            <CalendarPlusIcon data-icon="inline-start" />
            Program oluştur
          </Button>
        )}
      </div>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/*  Form (planla / düzenle)                                                   */
/* -------------------------------------------------------------------------- */

function SessionForm({
  mode,
  enrollmentId,
  session,
  onDone,
}: {
  mode: "create" | "edit";
  enrollmentId: number;
  session?: SessionItem;
  onDone: () => void;
}) {
  const router = useRouter();
  const scheduled = session?.scheduledAtMs
    ? new Date(session.scheduledAtMs)
    : null;
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(() =>
    scheduled ? trDayKey(scheduled) : trDayKey(new Date()),
  );
  const [time, setTime] = useState(() =>
    scheduled ? timeFmt.format(scheduled) : "18:00",
  );
  const [note, setNote] = useState(session?.studentVisibleNote ?? "");
  const [summary, setSummary] = useState(session?.summary ?? "");
  const [meetingUrl, setMeetingUrl] = useState(session?.meetingUrl ?? "");

  const submit = async () => {
    if (!date || !time) {
      toast.error("Tarih ve saat seç.");
      return;
    }
    // TRT sabit +03:00 — sunucu saat dilimi ne olursa olsun doğru an.
    const scheduledAt = `${date}T${time}:00+03:00`;
    setSaving(true);
    const res =
      mode === "create"
        ? await createSession({
            enrollmentId,
            scheduledAt,
            studentVisibleNote: note,
            meetingUrl,
          })
        : await updateSession({
            sessionId: session!.id,
            scheduledAt,
            studentVisibleNote: note,
            summary,
            meetingUrl,
          });
    setSaving(false);
    if (res.ok) {
      toast.success(
        mode === "create" ? "Görüşme planlandı" : "Görüşme güncellendi",
      );
      onDone();
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="gorusme-tarih">Tarih</FieldLabel>
          <Input
            id="gorusme-tarih"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="gorusme-saat">Saat</FieldLabel>
          <Input
            id="gorusme-saat"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="gorusme-link">Toplantı linki</FieldLabel>
        <Input
          id="gorusme-link"
          type="url"
          inputMode="url"
          placeholder="https://meet.google.com/… veya Zoom linki"
          value={meetingUrl}
          onChange={(e) => setMeetingUrl(e.target.value)}
        />
        <FieldDescription>
          Google Meet / Zoom linki — öğrenci &quot;Görüşmeye katıl&quot; ile açar.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="gorusme-not">Öğrenciye not</FieldLabel>
        <Textarea
          id="gorusme-not"
          placeholder="Örn. Deneme analizini birlikte yapacağız, TYT kitapçığını getir."
          value={note}
          maxLength={500}
          rows={2}
          onChange={(e) => setNote(e.target.value)}
        />
        <FieldDescription>
          Öğrencinin Bugün ekranında görünür.
        </FieldDescription>
      </Field>
      {mode === "edit" && (
        <Field>
          <FieldLabel htmlFor="gorusme-ozet">Görüşme özeti (koç)</FieldLabel>
          <Textarea
            id="gorusme-ozet"
            placeholder="Görüşmede konuşulanlar — yalnız koçlar görür."
            value={summary}
            maxLength={2000}
            rows={3}
            onChange={(e) => setSummary(e.target.value)}
          />
        </Field>
      )}
      <Button onClick={submit} disabled={saving} className="self-end">
        {saving
          ? "Kaydediliyor…"
          : mode === "create"
            ? "Görüşmeyi planla"
            : "Kaydet"}
      </Button>
    </div>
  );
}
