import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, UsersIcon } from "lucide-react";

import { getRoster } from "@/db/queries/roster";
import { formatInt } from "@/lib/format";
import {
  CopyInviteButton,
  WaInviteButton,
} from "@/components/app/invite-actions";
import { StalenessBadge } from "@/components/app/staleness-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Öğrenciler" };

const FILTERS = ["KPSS", "YKS", "LGS"] as const;

export default async function OgrencilerPage({
  searchParams,
}: {
  searchParams: Promise<{ sinav?: string }>;
}) {
  const { sinav } = await searchParams;
  const activeFilter = FILTERS.find((f) => f === sinav) ?? null;
  const roster = await getRoster();
  const rows = activeFilter
    ? roster.filter((r) => r.examCode === activeFilter)
    : roster;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            <span aria-hidden className="size-1.5 rounded-full bg-gold" />
            Kadro · {formatInt(roster.length)} öğrenci
          </span>
          <h1 className="font-heading text-title">Öğrenciler</h1>
        </div>
        <Button render={<Link href="/koc/ogrenciler/yeni" />}>
          <PlusIcon data-icon="inline-start" />
          Yeni öğrenci
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip href="/koc/ogrenciler" active={activeFilter === null}>
          Tümü
        </FilterChip>
        {FILTERS.map((f) => (
          <FilterChip
            key={f}
            href={`/koc/ogrenciler?sinav=${f}`}
            active={activeFilter === f}
          >
            {f}
          </FilterChip>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-14 text-center ring-1 ring-foreground/10">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/10">
            <UsersIcon className="size-5 text-primary" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-heading text-lg font-semibold">
              {activeFilter
                ? `${activeFilter} öğrencisi yok`
                : "Henüz öğrenci yok"}
            </p>
            <p className="text-sm text-muted-foreground">
              İlk öğrencini ekle, davet linkini WhatsApp&apos;tan gönder.
            </p>
          </div>
          <Button render={<Link href="/koc/ogrenciler/yeni" />}>
            <PlusIcon data-icon="inline-start" />
            Yeni öğrenci
          </Button>
        </div>
      ) : (
        <div className="rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Ad</TableHead>
                <TableHead>Sınav</TableHead>
                <TableHead>Hedef</TableHead>
                <TableHead className="text-right">Bu hafta soru</TableHead>
                <TableHead>Son giriş</TableHead>
                <TableHead className="pr-4">Davet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.enrollmentId}>
                  <TableCell className="pl-4 font-medium">
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
                  <TableCell className="max-w-52 truncate text-muted-foreground">
                    {r.targetText ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatInt(r.weekQuestionTotal)}
                  </TableCell>
                  <TableCell>
                    <StalenessBadge staleDays={r.staleDays} />
                  </TableCell>
                  <TableCell className="pr-4">
                    {r.inviteAccepted ? (
                      <Badge className="bg-success/10 text-success">
                        Kabul edildi
                      </Badge>
                    ) : r.inviteCode ? (
                      <div className="flex items-center gap-1.5">
                        <CopyInviteButton
                          invitePath={`/davet/${r.inviteCode}`}
                        />
                        {r.phone && (
                          <WaInviteButton
                            phone={r.phone}
                            studentName={r.fullName.split(" ")[0]}
                            invitePath={`/davet/${r.inviteCode}`}
                          />
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline">Davet yok</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
      )}
    >
      {children}
    </Link>
  );
}
