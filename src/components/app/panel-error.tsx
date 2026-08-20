"use client";

import { useEffect } from "react";
import { RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Panel hata sınırı — bir sunucu sorgusu patladığında kullanıcı bomboş ekran
 * yerine ne olduğunu ve ne yapacağını görür. `reset()` sayfayı yeniden
 * denemeye zorlar; çoğu vaka geçici D1/ağ hatası olduğu için genelde yeter.
 */
export function PanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Ham hata konsolda kalsın: kullanıcıya Türkçe mesaj, bize teşhis.
    console.error("[panel]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="font-heading text-lg font-semibold">
        Bu ekran yüklenemedi
      </h2>
      <p className="text-sm text-pretty text-muted-foreground">
        Geçici bir sorun olabilir. Tekrar dene; sürerse koçuna haber ver.
      </p>
      <Button variant="outline" onClick={reset}>
        <RotateCcwIcon data-icon="inline-start" />
        Tekrar dene
      </Button>
    </div>
  );
}
