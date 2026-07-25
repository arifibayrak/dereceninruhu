import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ExternalLinkIcon, LibraryIcon } from "lucide-react";

import { getEnrollmentDetailByUserId } from "@/db/queries/enrollment";
import { listContentForEnrollment } from "@/db/queries/icerik";
import { getCurrentUser, type Role } from "@/lib/session";
import {
  CONTENT_TYPE_LABELS,
  youtubeThumbnailUrl,
  youtubeVideoId,
} from "@/lib/content";
import { formatInt } from "@/lib/format";
import { ContentViewedButton } from "@/components/app/content-actions";
import { NoEnrollmentCard } from "@/components/app/no-enrollment";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "İçerik" };

export default async function OgrenciIcerikPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const role = (user as { role?: Role }).role ?? "student";

  const detail = await getEnrollmentDetailByUserId(user.id);
  if (!detail) {
    return <NoEnrollmentCard isCoach={role === "coach" || role === "admin"} />;
  }

  const items = await listContentForEnrollment(
    detail.enrollment.id,
    detail.enrollment.examTemplateId,
  );
  const viewedCount = items.filter((i) => i.viewedAt).length;

  return (
    <>
      <div data-tour="icerik-liste" className="flex flex-col gap-1">
        <h1 className="font-heading text-title">İçerik</h1>
        <p className="text-sm text-muted-foreground">
          {formatInt(items.length)} içerik · {formatInt(viewedCount)} izlendi
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-14 text-center ring-1 ring-foreground/10">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/10">
            <LibraryIcon className="size-5 text-primary" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-heading text-lg font-semibold">
              Henüz içerik yok
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Koçun video, PDF ya da not paylaştığında burada görünecek.
            </p>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const ytId =
              item.type === "video" ? youtubeVideoId(item.url) : null;
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
                      sizes="(max-width: 512px) 100vw, 512px"
                      className="object-cover"
                    />
                  </a>
                )}
                <div className="flex flex-col gap-2 p-3.5">
                  <span className="text-sm font-medium">{item.title}</span>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <Badge
                      variant="secondary"
                      className="h-4 px-1.5 text-[10px]"
                    >
                      {CONTENT_TYPE_LABELS[item.type]}
                    </Badge>
                    {item.isAssigned && (
                      <Badge className="h-4 bg-gold/15 px-1.5 text-[10px] text-gold-foreground">
                        Sana özel
                      </Badge>
                    )}
                    {(item.subjectName || item.topicName) && (
                      <span className="truncate">
                        {[item.subjectName, item.topicName]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </div>
                  {item.type === "note" && item.body && (
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {item.body}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {item.url && !ytId ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <ExternalLinkIcon className="size-3.5" />
                        İçeriği aç
                      </a>
                    ) : (
                      <span />
                    )}
                    <ContentViewedButton
                      contentItemId={item.id}
                      enrollmentId={detail.enrollment.id}
                      viewed={!!item.viewedAt}
                    />
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
