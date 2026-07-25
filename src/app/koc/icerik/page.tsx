import type { Metadata } from "next";
import Image from "next/image";
import { ExternalLinkIcon, LibraryIcon } from "lucide-react";

import {
  getContentFormOptions,
  listContentForCoach,
} from "@/db/queries/icerik";
import { getEnrollmentOptions } from "@/db/queries/muhasebe";
import {
  CONTENT_TYPE_LABELS,
  youtubeThumbnailUrl,
  youtubeVideoId,
} from "@/lib/content";
import { formatInt } from "@/lib/format";
import { getViewer } from "@/lib/session";
import {
  ContentAssignDialog,
  ContentDeleteButton,
} from "@/components/app/content-actions";
import { ContentCreateDialog } from "@/components/app/content-create-dialog";
import { SectionHeading } from "@/components/brand/section-heading";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "İçerik Kütüphanesi" };

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
});

export default async function KocIcerikPage() {
  const viewer = await getViewer();
  const isAdmin = viewer?.role === "admin";
  // Herkes tüm içeriği görür; koç yalnız kendi eklediğini yönetir (atama/sil).
  const coachUserId = viewer?.role === "coach" ? viewer.id : null;
  const [items, options, students] = await Promise.all([
    listContentForCoach(),
    getContentFormOptions(),
    getEnrollmentOptions(coachUserId),
  ]);
  const studentOptions = students.map((s) => ({
    enrollmentId: s.enrollmentId,
    label: s.label,
  }));

  return (
    <>
      <div data-tour="icerik-baslik" className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="İçerik"
          title="İçerik kütüphanesi"
          description="Video, PDF, not ve bağlantıları ekle; kütüphanede paylaş ya da öğrenciye ata."
        />
        <ContentCreateDialog options={options} students={studentOptions} />
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-14 text-center ring-1 ring-foreground/10">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/10">
            <LibraryIcon className="size-5 text-primary" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-heading text-lg font-semibold">
              İlk içeriği ekle
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              YouTube videoları küçük resimle görünür; notlar doğrudan uygulama
              içinde okunur.
            </p>
          </div>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const ytId = item.type === "video" ? youtubeVideoId(item.url) : null;
            // Yönetici her içeriği; koç yalnız kendi eklediğini yönetebilir.
            const canManage =
              isAdmin || item.createdByUserId === viewer?.id;
            return (
              <li
                key={item.id}
                className="flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
              >
                {ytId && (
                  <a
                    href={item.url ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block aspect-video bg-muted"
                  >
                    <Image
                      src={youtubeThumbnailUrl(ytId)}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </a>
                )}
                <div className="flex flex-1 flex-col gap-2 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2 text-sm font-medium">
                      {item.title}
                    </span>
                    {canManage && (
                      <ContentDeleteButton contentItemId={item.id} />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                      {CONTENT_TYPE_LABELS[item.type]}
                    </Badge>
                    {item.examCode && (
                      <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                        {item.examCode}
                      </Badge>
                    )}
                    {item.isLibrary ? (
                      <Badge className="h-4 bg-primary/10 px-1.5 text-[10px] text-primary">
                        Kütüphane
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                        Özel
                      </Badge>
                    )}
                    <span>{dateFmt.format(item.createdAt)}</span>
                  </div>
                  {(item.subjectName || item.topicName) && (
                    <span className="truncate text-xs text-muted-foreground">
                      {[item.subjectName, item.topicName]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                  {item.type === "note" && item.body && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {item.body}
                    </p>
                  )}
                  {item.createdByName && (
                    <span className="truncate text-xs text-muted-foreground">
                      Ekleyen: {item.createdByName}
                      {item.createdByUserId === viewer?.id ? " (sen)" : ""}
                    </span>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    {canManage ? (
                      <ContentAssignDialog
                        contentItemId={item.id}
                        title={item.title}
                        students={studentOptions}
                        assignedEnrollmentIds={item.assignedEnrollmentIds}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {item.assignedEnrollmentIds.length > 0
                          ? `${item.assignedEnrollmentIds.length} öğrenciye atalı`
                          : "—"}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {item.url && !ytId && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:text-primary"
                        >
                          <ExternalLinkIcon className="size-3.5" />
                          Aç
                        </a>
                      )}
                      <span>· {formatInt(item.viewCount)} izlendi</span>
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
