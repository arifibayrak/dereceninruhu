"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangleIcon,
  BanknoteIcon,
  EyeIcon,
  UploadIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  commitReconciliation,
  previewStatement,
  type ReconcilePreview,
} from "@/actions/reconcile";
import { formatInt, formatKurus } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type Mode = "csv" | "text";

type Row = {
  index: number;
  senderName: string;
  amountKurus: number;
  ambiguous: boolean;
  enrollmentId: number | null;
  paidOn: string;
  included: boolean;
};

function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
  }).format(new Date());
}

/** Yönetici — banka ekstresini yapıştır/yükle → eşleştir → ödeme olarak kaydet. */
export function ReconcileForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("csv");
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ReconcilePreview | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState<"preview" | "commit" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onTextChange = (v: string) => {
    setText(v);
    if (preview) {
      setPreview(null);
      setRows([]);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    onTextChange(await file.text());
  };

  const runPreview = async () => {
    setLoading("preview");
    const res = await previewStatement({ text, mode });
    setLoading(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setPreview(res.data);
    const today = todayIso();
    setRows(
      res.data.transfers.map((t) => ({
        index: t.index,
        senderName: t.senderName,
        amountKurus: t.amountKurus,
        ambiguous: t.ambiguous,
        enrollmentId: t.matchedEnrollmentId,
        paidOn: t.date ?? today,
        included: t.matchedEnrollmentId != null,
      })),
    );
  };

  const patchRow = (index: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.index === index ? { ...r, ...patch } : r)));

  const selected = rows.filter((r) => r.included && r.enrollmentId != null);
  const selectedTotal = selected.reduce((acc, r) => acc + r.amountKurus, 0);
  const matchedCount = rows.filter((r) => r.enrollmentId != null).length;

  const runCommit = async () => {
    setConfirmOpen(false);
    setLoading("commit");
    const res = await commitReconciliation({
      rows: selected.map((r) => ({
        enrollmentId: r.enrollmentId,
        amountKurus: r.amountKurus,
        paidOn: r.paidOn,
        senderName: r.senderName,
      })),
    });
    setLoading(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(
      `${formatInt(res.data.recorded)} ödeme kaydedildi` +
        (res.data.linked > 0
          ? ` · ${formatInt(res.data.linked)} faturaya bağlandı`
          : "") +
        (res.data.skipped > 0
          ? ` · ${formatInt(res.data.skipped)} atlandı (zaten var)`
          : ""),
    );
    setPreview(null);
    setRows([]);
    setText("");
    router.refresh();
  };

  const busy = loading !== null;

  return (
    <div className="flex flex-col gap-4">
      {/* Kaynak seçimi */}
      <div className="inline-flex w-fit rounded-lg bg-muted p-[3px] text-sm">
        <ModeTab active={mode === "csv"} onClick={() => setMode("csv")}>
          CSV / tablo
        </ModeTab>
        <ModeTab active={mode === "text"} onClick={() => setMode("text")}>
          Serbest metin (AI)
        </ModeTab>
      </div>

      <div className="flex flex-col gap-2">
        <Textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          rows={9}
          spellCheck={false}
          placeholder={
            mode === "csv"
              ? "Tarih,Açıklama,Tutar\n01.03.2026,AHMET YILMAZ HAVALE,2.500,00"
              : "Banka uygulamasından hesap hareketlerini buraya yapıştır. Gelen havaleler AI ile ayrıştırılır."
          }
          className="font-mono text-xs"
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <UploadIcon data-icon="inline-start" />
            Dosya seç
          </Button>
          <Button
            size="sm"
            onClick={runPreview}
            disabled={!text.trim() || busy}
          >
            <EyeIcon data-icon="inline-start" />
            {loading === "preview" ? "Okunuyor…" : "Eşleştir"}
          </Button>
        </div>
      </div>

      {preview && (
        <div className="flex flex-col gap-3">
          {preview.warnings.length > 0 && (
            <div className="flex flex-col gap-1 rounded-lg bg-warning/5 p-3 text-xs text-muted-foreground">
              {preview.warnings.map((w, i) => (
                <p key={i} className="inline-flex items-center gap-1.5">
                  <AlertTriangleIcon className="size-3.5 shrink-0 text-warning" />
                  {w}
                </p>
              ))}
            </div>
          )}

          {rows.length === 0 ? (
            <p className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              Gelen havale bulunamadı.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  {formatInt(rows.length)} havale · {formatInt(matchedCount)} eşleşti
                </p>
                <p className="text-sm font-medium">
                  Seçili: {formatInt(selected.length)} · {formatKurus(selectedTotal)}
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="w-10 p-2"></th>
                      <th className="p-2 text-left font-medium">Tarih</th>
                      <th className="p-2 text-left font-medium">Gönderen</th>
                      <th className="p-2 text-right font-medium">Tutar</th>
                      <th className="p-2 text-left font-medium">Öğrenci</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr
                        key={r.index}
                        className={cn(
                          "border-t border-foreground/5",
                          r.included ? "" : "opacity-60",
                        )}
                      >
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={r.included}
                            onChange={(e) =>
                              patchRow(r.index, { included: e.target.checked })
                            }
                            className="size-4 accent-primary"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="date"
                            value={r.paidOn}
                            onChange={(e) =>
                              patchRow(r.index, { paidOn: e.target.value })
                            }
                            className="rounded-md bg-transparent px-1 py-0.5 text-xs ring-1 ring-foreground/10"
                          />
                        </td>
                        <td className="max-w-[220px] truncate p-2">
                          {r.senderName || "—"}
                          {r.ambiguous && (
                            <span className="ml-1.5 rounded bg-warning/10 px-1 py-0.5 text-[10px] font-medium text-warning">
                              belirsiz
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-right font-medium tabular-nums">
                          {formatKurus(r.amountKurus)}
                        </td>
                        <td className="p-2">
                          <select
                            value={r.enrollmentId ?? ""}
                            onChange={(e) => {
                              const val = e.target.value
                                ? Number(e.target.value)
                                : null;
                              patchRow(r.index, {
                                enrollmentId: val,
                                included: val != null,
                              });
                            }}
                            className={cn(
                              "w-full rounded-md bg-background px-2 py-1 text-xs ring-1 ring-foreground/10",
                              r.enrollmentId == null && "text-muted-foreground",
                            )}
                          >
                            <option value="">— öğrenci seç —</option>
                            {preview.roster.map((o) => (
                              <option key={o.enrollmentId} value={o.enrollmentId}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setConfirmOpen(true)}
                  disabled={selected.length === 0 || busy}
                  className="bg-success text-white hover:bg-success/90"
                >
                  <BanknoteIcon data-icon="inline-start" />
                  {loading === "commit"
                    ? "Kaydediliyor…"
                    : `Ödemeleri kaydet (${formatInt(selected.length)})`}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ödemeleri kaydet</DialogTitle>
            <DialogDescription>
              {formatInt(selected.length)} havale, seçili öğrencilere{" "}
              <b>havale</b> ödemesi olarak kaydedilecek (toplam{" "}
              {formatKurus(selectedTotal)}). Aynı gün + tutar + öğrenci zaten
              varsa atlanır.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="sm" />}>
              Vazgeç
            </DialogClose>
            <Button size="sm" onClick={runCommit}>
              <BanknoteIcon data-icon="inline-start" />
              Onayla ve kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1 font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
