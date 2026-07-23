"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRoundCheckIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { bulkAssignStudentCoach } from "@/actions/admin";
import type { RosterPayment } from "@/db/queries/muhasebe";
import { formatInt } from "@/lib/format";
import { formatMinutes } from "@/lib/study";
import {
  CoachAssignSelect,
  type CoachOption,
} from "@/components/app/coach-assign-select";
import {
  CopyInviteButton,
  WaInviteButton,
} from "@/components/app/invite-actions";
import { PaymentStatusBadge } from "@/components/app/payment-status-badge";
import { PinResetButton } from "@/components/app/pin-reset-button";
import { StalenessBadge } from "@/components/app/staleness-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type RosterTableRow = {
  studentId: number;
  enrollmentId: number;
  fullName: string;
  phone: string | null;
  examCode: string;
  trackCode: string | null;
  weekQuestionTotal: number;
  studyToday: number;
  studyWeek: number;
  studyMonth: number;
  payment: RosterPayment | null;
  staleDays: number | null;
  inviteAccepted: boolean;
  inviteCode: string | null;
  coachUserId: string | null;
};

const UNASSIGNED = "yok";

/**
 * Kadro tablosu. Yönetici satır seçimi + koç sütunu + toplu atama görür;
 * koç yalnız kendi öğrencilerinin salt listesini görür.
 */
export function RosterTable({
  rows,
  coaches,
  isAdmin,
}: {
  rows: RosterTableRow[];
  coaches: CoachOption[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [bulkTarget, setBulkTarget] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const bulkItems = [
    { value: UNASSIGNED, label: "Atamayı kaldır" },
    ...coaches.map((c) => ({ value: c.id, label: c.name })),
  ];

  const visibleIds = rows.map((r) => r.enrollmentId);
  const selectedVisible = visibleIds.filter((id) => selected.has(id));
  const allSelected =
    visibleIds.length > 0 && selectedVisible.length === visibleIds.length;
  const someSelected =
    selectedVisible.length > 0 && selectedVisible.length < visibleIds.length;

  const toggleRow = (enrollmentId: number, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(enrollmentId);
      else next.delete(enrollmentId);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(visibleIds) : new Set());
  };

  const applyBulk = () => {
    if (!bulkTarget || selectedVisible.length === 0) return;
    startTransition(async () => {
      const res = await bulkAssignStudentCoach({
        enrollmentIds: selectedVisible,
        coachUserId: bulkTarget === UNASSIGNED ? null : bulkTarget,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const label = bulkItems.find((i) => i.value === bulkTarget)?.label;
      toast.success(
        bulkTarget === UNASSIGNED
          ? `${formatInt(res.data.updated)} öğrencinin koç ataması kaldırıldı`
          : `${formatInt(res.data.updated)} öğrenci atandı: ${label}`,
      );
      setSelected(new Set());
      setBulkTarget(null);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {isAdmin && selectedVisible.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2 ring-1 ring-foreground/10">
          <span className="text-sm font-medium">
            {formatInt(selectedVisible.length)} öğrenci seçildi
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Select
              items={bulkItems}
              value={bulkTarget}
              onValueChange={(v) => setBulkTarget(v as string)}
              disabled={pending}
            >
              <SelectTrigger size="sm" aria-label="Atanacak koç">
                <SelectValue placeholder="Koç seç" />
              </SelectTrigger>
              <SelectContent>
                {bulkItems.map((i) => (
                  <SelectItem key={i.value} value={i.value}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={applyBulk}
              disabled={pending || !bulkTarget}
            >
              <UserRoundCheckIcon data-icon="inline-start" />
              Seçilenleri koça ata
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleAll(false)}
              disabled={pending}
              aria-label="Seçimi temizle"
            >
              <XIcon data-icon="inline-start" />
              Vazgeç
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-card ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              {isAdmin && (
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    aria-label="Tümünü seç"
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={(checked) => toggleAll(checked)}
                  />
                </TableHead>
              )}
              <TableHead className={isAdmin ? undefined : "pl-4"}>Ad</TableHead>
              <TableHead>Sınav</TableHead>
              {isAdmin && <TableHead>Koç</TableHead>}
              <TableHead className="text-right">Bu hafta soru</TableHead>
              <TableHead className="text-right">Süre</TableHead>
              <TableHead>Ödeme</TableHead>
              <TableHead>Son giriş</TableHead>
              <TableHead className="pr-4">Davet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow
                key={r.enrollmentId}
                data-state={selected.has(r.enrollmentId) ? "selected" : undefined}
              >
                {isAdmin && (
                  <TableCell className="w-10 pl-4">
                    <Checkbox
                      aria-label={`${r.fullName} seç`}
                      checked={selected.has(r.enrollmentId)}
                      onCheckedChange={(checked) =>
                        toggleRow(r.enrollmentId, checked)
                      }
                    />
                  </TableCell>
                )}
                <TableCell className={isAdmin ? "font-medium" : "pl-4 font-medium"}>
                  <Link
                    href={`/koc/ogrenciler/${r.studentId}`}
                    className="hover:text-primary"
                  >
                    {r.fullName}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {r.examCode}
                    {r.trackCode ? ` · ${r.trackCode}` : ""}
                  </Badge>
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <CoachAssignSelect
                      key={`${r.enrollmentId}:${r.coachUserId ?? UNASSIGNED}`}
                      enrollmentId={r.enrollmentId}
                      coachUserId={r.coachUserId}
                      coaches={coaches}
                    />
                  </TableCell>
                )}
                <TableCell className="text-right font-medium tabular-nums">
                  {formatInt(r.weekQuestionTotal)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-medium tabular-nums">
                      {formatMinutes(r.studyWeek)}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      bugün {formatMinutes(r.studyToday)} · ay{" "}
                      {formatMinutes(r.studyMonth)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge payment={r.payment} />
                </TableCell>
                <TableCell>
                  <StalenessBadge staleDays={r.staleDays} />
                </TableCell>
                <TableCell className="pr-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {r.inviteAccepted ? (
                      <Badge className="bg-success/10 text-success">
                        Kabul edildi
                      </Badge>
                    ) : r.inviteCode ? (
                      <>
                        <CopyInviteButton invitePath={`/davet/${r.inviteCode}`} />
                        {r.phone && (
                          <WaInviteButton
                            phone={r.phone}
                            studentName={r.fullName.split(" ")[0]}
                            invitePath={`/davet/${r.inviteCode}`}
                          />
                        )}
                      </>
                    ) : (
                      <Badge variant="outline">Davet yok</Badge>
                    )}
                    <PinResetButton
                      studentId={r.studentId}
                      phone={r.phone}
                      fullName={r.fullName}
                      inviteAccepted={r.inviteAccepted}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
