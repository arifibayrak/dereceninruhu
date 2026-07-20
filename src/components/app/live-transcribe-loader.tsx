"use client";

import dynamic from "next/dynamic";

/**
 * `LiveTranscribe`'i YALNIZ istemcide (`ssr: false`) yükleyen ince sarmalayıcı.
 * Böylece transformers.js / onnxruntime SUNUCU (Cloudflare Worker) grafiğine hiç
 * girmez — aksi halde OpenNext, onnxruntime-node'un native `.node` ikilisini
 * paketlemeye çalışıp derlemeyi kırar. Sunucu bileşeni `ssr: false` veremediği
 * için bu istemci sarmalayıcı gerekli.
 */
const LiveTranscribe = dynamic(
  () => import("./live-transcribe").then((m) => m.LiveTranscribe),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-muted-foreground">Canlı transkript yükleniyor…</p>
    ),
  },
);

type Props = {
  enrollmentId: number;
  studentId: number;
  coachingSessionId?: number | null;
  /** Verilirse: bu kaydedilmiş transkripte EKLE (yeni satır oluşturma). */
  transcriptId?: number;
  /** `transcriptId` ile birlikte: mevcut metin (salt-okunur önizleme). */
  initialText?: string;
};

export function LiveTranscribeLoader(props: Props) {
  return <LiveTranscribe {...props} />;
}
