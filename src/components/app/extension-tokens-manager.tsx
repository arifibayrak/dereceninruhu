"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CopyIcon,
  KeyRoundIcon,
  PlusIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  deleteExtensionToken,
  mintExtensionToken,
  revokeExtensionToken,
} from "@/actions/extension-tokens";
import type { ExtensionTokenRow } from "@/db/queries/extension-tokens";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function fmt(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Koç eklenti token'larını yönetir: oluştur (bir kez göster) / listele / iptal. */
export function ExtensionTokensManager({
  tokens,
}: {
  tokens: ExtensionTokenRow[];
}) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const create = () => {
    startTransition(async () => {
      const res = await mintExtensionToken(label.trim() || undefined);
      if (res.ok) {
        setFreshToken(res.data.token);
        setLabel("");
        toast.success("Token oluşturuldu. Aşağıdan kopyalayın.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const revoke = (id: number) => {
    startTransition(async () => {
      const res = await revokeExtensionToken(id);
      if (res.ok) {
        toast.success("Token iptal edildi.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const remove = (id: number) => {
    startTransition(async () => {
      const res = await deleteExtensionToken(id);
      if (res.ok) {
        toast.success("Token silindi.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Token kopyalandı");
    } catch {
      toast.error("Kopyalanamadı");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRoundIcon className="size-4" />
          Eklenti token&apos;ların
        </CardTitle>
        <CardDescription>
          Canlı-transkript tarayıcı eklentisini hesabına bağlamak için bir token
          oluştur ve eklentiye yapıştır. Token yalnız oluşturulurken bir kez
          gösterilir; kaybolursa yenisini üret.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="token-label">
            Cihaz etiketi (opsiyonel)
          </FieldLabel>
          <div className="flex gap-2">
            <Input
              id="token-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Chrome — iş dizüstü"
              maxLength={80}
            />
            <Button onClick={create} disabled={pending} className="shrink-0">
              <PlusIcon className="size-4" />
              Oluştur
            </Button>
          </div>
          <FieldDescription>
            Hangi cihaz/tarayıcı için olduğunu hatırlamana yarar.
          </FieldDescription>
        </Field>

        {freshToken ? (
          <div className="rounded-lg border border-amber-500/40 bg-amber-50 p-3 dark:bg-amber-950/30">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
              <TriangleAlertIcon className="size-4 shrink-0" />
              Bu token&apos;ı şimdi kopyala — tekrar gösterilmeyecek.
            </div>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1.5 font-mono text-sm">
                {freshToken}
              </code>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => copy(freshToken)}
              >
                <CopyIcon className="size-4" />
                Kopyala
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          {tokens.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henüz token yok. Yukarıdan oluştur.
            </p>
          ) : (
            tokens.map((t) => {
              const revoked = t.revokedAt != null;
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {t.label ?? "Etiketsiz token"}
                      </span>
                      <Badge variant={revoked ? "outline" : "secondary"}>
                        {revoked ? "İptal edildi" : "Aktif"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Oluşturuldu: {fmt(t.createdAt)} · Son kullanım:{" "}
                      {fmt(t.lastUsedAt)}
                    </p>
                  </div>
                  {!revoked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      disabled={pending}
                      onClick={() => revoke(t.id)}
                    >
                      İptal et
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-destructive hover:text-destructive"
                      disabled={pending}
                      onClick={() => remove(t.id)}
                    >
                      <Trash2Icon className="size-4" />
                      Sil
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
