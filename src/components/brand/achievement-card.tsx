"use client";

import { useState } from "react";
import Image from "next/image";
import { PlayIcon, TrophyIcon, XIcon } from "lucide-react";

import type { PublicAchievement } from "@/db/queries/cms";
import { youtubeThumbnailUrl, youtubeVideoId } from "@/lib/content";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Sınav rozeti rengi — testimonial-card ile aynı dil. */
const EXAM_DOT: Record<string, string> = {
  YKS: "bg-chart-1",
  KPSS: "bg-chart-3",
  LGS: "bg-chart-2",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toLocaleUpperCase("tr-TR"))
    .join("");
}

/**
 * Derece kartı — sıralama + ÖSYM sonuç belgesi + kısa yorum (+ varsa video).
 *
 * Belge görseline tıklanınca tam boy açılır (lightbox). Kartın public'e
 * çıkması `consentAt` şartına bağlıdır; bu bileşen filtrelemez, sorgu
 * (`getFeaturedAchievements`) filtreler.
 */
export function AchievementCard({ item }: { item: PublicAchievement }) {
  const [lightbox, setLightbox] = useState(false);
  const videoId = youtubeVideoId(item.videoUrl);

  return (
    <>
      <figure className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            {item.photoUrl && (
              <AvatarImage src={item.photoUrl} alt="" />
            )}
            <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
              {initials(item.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">
              {item.displayName}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                aria-hidden
                className={cn(
                  "size-1.5 rounded-full",
                  EXAM_DOT[item.exam] ?? "bg-muted-foreground",
                )}
              />
              {item.exam}
            </span>
          </div>
        </div>

        <Badge className="w-fit gap-1.5 bg-gold text-gold-foreground">
          <TrophyIcon className="size-3.5" aria-hidden />
          {item.result}
        </Badge>

        <blockquote className="text-sm leading-relaxed text-pretty">
          &ldquo;{item.quote}&rdquo;
        </blockquote>

        {(item.proofImageUrl || videoId) && (
          <div className="mt-auto flex gap-2 pt-1">
            {item.proofImageUrl && (
              <button
                type="button"
                onClick={() => setLightbox(true)}
                className="group relative h-20 w-28 shrink-0 overflow-hidden rounded-lg ring-1 ring-foreground/10 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                aria-label={`${item.displayName} — sonuç belgesini büyüt`}
              >
                <Image
                  src={item.proofImageUrl}
                  alt={`${item.displayName} sınav sonuç belgesi`}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-[10px] font-medium text-white">
                  Sonuç belgesi
                </span>
              </button>
            )}
            {videoId && (
              <a
                href={item.videoUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative h-20 w-28 shrink-0 overflow-hidden rounded-lg ring-1 ring-foreground/10 transition-opacity hover:opacity-90"
                aria-label={`${item.displayName} — tavsiye videosunu izle (yeni sekmede)`}
              >
                <Image
                  src={youtubeThumbnailUrl(videoId)}
                  alt=""
                  fill
                  sizes="112px"
                  className="object-cover"
                  unoptimized
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                  <PlayIcon className="size-6 fill-white text-white" />
                </span>
              </a>
            )}
          </div>
        )}
      </figure>

      {lightbox && item.proofImageUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${item.displayName} sınav sonuç belgesi`}
          onClick={() => setLightbox(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            aria-label="Kapat"
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <XIcon />
          </button>
          <Image
            src={item.proofImageUrl}
            alt={`${item.displayName} sınav sonuç belgesi`}
            width={1200}
            height={1600}
            className="max-h-[90vh] w-auto rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}
