"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  EyeIcon,
  UploadIcon,
} from "lucide-react";
import { toast } from "sonner";

import { callAction } from "@/lib/action-client";
import { importRoster, type ImportSummary } from "@/actions/roster-import";
import { formatInt } from "@/lib/format";
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

/** Yönetici — CSV yapıştır/yükle → önizle → içe aktar ve eşitle. */
export function RosterImportForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<ImportSummary | null>(null);
  const [loading, setLoading] = useState<"preview" | "commit" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onCsvChange = (value: string) => {
    setCsv(value);
    // CSV değişince önizlemeyi geçersiz kıl — commit öncesi tekrar önizle.
    if (preview) setPreview(null);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    onCsvChange(text);
  };

  const runPreview = async () => {
    setLoading("preview");
    const res = await callAction(importRoster, { csv, commit: false });
    setLoading(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setPreview(res.data);
  };

  const runCommit = async () => {
    setConfirmOpen(false);
    setLoading("commit");
    const res = await callAction(importRoster, { csv, commit: true });
    setLoading(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setPreview(res.data);
    toast.success(
      `${formatInt(res.data.createCount)} yeni · ${formatInt(
        res.data.updateCount,
      )} güncel · ${formatInt(res.data.deactivateCount)} pasif`,
    );
    router.refresh();
  };

  const hasBlocking = (preview?.errorCount ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Textarea
          value={csv}
          onChange={(e) => onCsvChange(e.target.value)}
          rows={10}
          spellCheck={false}
          placeholder={
            "fullName,phone,examCode,trackCode,targetText,grade,status\nAyşe Yılmaz,05321234567,KPSS,,İstanbul Adliyesi,,aktif"
          }
          className="font-mono text-xs"
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <UploadIcon data-icon="inline-start" />
            CSV dosyası seç
          </Button>
          <Button
            size="sm"
            onClick={runPreview}
            disabled={!csv.trim() || loading !== null}
          >
            <EyeIcon data-icon="inline-start" />
            {loading === "preview" ? "Önizleniyor…" : "Önizle"}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={
              !preview ||
              preview.committed ||
              hasBlocking ||
              loading !== null
            }
            className="bg-success text-white hover:bg-success/90"
          >
            <CheckCircle2Icon data-icon="inline-start" />
            {loading === "commit" ? "Aktarılıyor…" : "İçe aktar ve eşitle"}
          </Button>
        </div>
      </div>

      {preview && (
        <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="flex items-center gap-2">
            {preview.committed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                <CheckCircle2Icon className="size-3.5" />
                Aktarıldı
              </span>
            ) : (
              <span className="text-sm font-semibold">Önizleme</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="Yeni öğrenci" value={preview.createCount} tone="primary" />
            <Stat label="Güncellenen" value={preview.updateCount} />
            <Stat
              label="Pasife alınan"
              value={preview.deactivateCount}
              tone={preview.deactivateCount > 0 ? "warning" : undefined}
            />
            <Stat
              label="Telefonsuz (dokunulmadı)"
              value={preview.phonelessCount}
            />
            <Stat label="Tekrar (son geçerli)" value={preview.duplicateCount} />
            <Stat
              label="Hatalı satır"
              value={preview.errorCount}
              tone={preview.errorCount > 0 ? "destructive" : undefined}
            />
          </div>

          {preview.unknownHeaders.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Tanınmayan sütun(lar): {preview.unknownHeaders.join(", ")}
            </p>
          )}

          {preview.deactivateSamples.length > 0 && !preview.committed && (
            <Detail
              title="Pasife alınacaklar"
              items={preview.deactivateSamples}
              total={preview.deactivateCount}
            />
          )}
          {preview.phonelessSamples.length > 0 && (
            <Detail
              title="Telefonsuz (listede yok ama aktif kalır)"
              items={preview.phonelessSamples}
              total={preview.phonelessCount}
            />
          )}

          {preview.errors.length > 0 && (
            <div className="flex flex-col gap-1 rounded-lg bg-destructive/5 p-3">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive">
                <AlertTriangleIcon className="size-3.5" />
                Hataları düzeltmeden aktarılamaz
              </p>
              <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                {preview.errors.map((e) => (
                  <li key={e.lineNo}>
                    <span className="font-medium text-foreground">
                      Satır {e.lineNo}:
                    </span>{" "}
                    {e.message}
                  </li>
                ))}
                {preview.errorCount > preview.errors.length && (
                  <li>… ve {preview.errorCount - preview.errors.length} tane daha</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İçe aktarımı onayla</DialogTitle>
            <DialogDescription>
              {preview
                ? `${formatInt(preview.createCount)} yeni öğrenci eklenecek, ${formatInt(
                    preview.updateCount,
                  )} kayıt güncellenecek ve listede olmayan ${formatInt(
                    preview.deactivateCount,
                  )} öğrenci pasife alınacak. Bu işlem geri alınabilir (pasif kayıtlar korunur).`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" size="sm" />}>
              Vazgeç
            </DialogClose>
            <Button size="sm" onClick={runCommit}>
              <CheckCircle2Icon data-icon="inline-start" />
              Onayla ve aktar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "primary" | "warning" | "destructive";
}) {
  const toneClass =
    tone === "primary"
      ? "text-primary"
      : tone === "warning"
        ? "text-warning"
        : tone === "destructive"
          ? "text-destructive"
          : "text-foreground";
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <div className={`text-lg font-semibold tabular-nums ${toneClass}`}>
        {formatInt(value)}
      </div>
      <div className="text-[11px] leading-tight text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function Detail({
  title,
  items,
  total,
}: {
  title: string;
  items: string[];
  total: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">
        {items.join(", ")}
        {total > items.length ? ` … (+${total - items.length})` : ""}
      </p>
    </div>
  );
}
