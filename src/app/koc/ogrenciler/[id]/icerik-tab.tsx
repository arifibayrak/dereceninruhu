import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";

import {
  getContentFormOptions,
  listContentForEnrollment,
} from "@/db/queries/icerik";
import { CONTENT_TYPE_LABELS, contentHref } from "@/lib/content";
import { ContentCreateDialog } from "@/components/app/content-create-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Kokpit "İçerik" sekmesi — bu öğrencinin gördüğü içerikler + izlenme durumu.
 * Yeni içerik doğrudan bu öğrenciye atanmış olarak eklenir.
 */
export async function IcerikTab({
  enrollmentId,
  examTemplateId,
  studentName,
}: {
  enrollmentId: number;
  examTemplateId: number;
  studentName: string;
}) {
  const [items, options] = await Promise.all([
    listContentForEnrollment(enrollmentId, examTemplateId),
    getContentFormOptions(),
  ]);
  const viewedCount = items.filter((i) => i.viewedAt).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h3 className="font-heading text-base font-semibold">
            Görünen içerik · {items.length}
          </h3>
          <span className="text-xs text-muted-foreground">
            {viewedCount} izlendi/okundu
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/koc/icerik" />}
          >
            Kütüphaneye git
          </Button>
          <ContentCreateDialog
            options={options}
            students={[{ enrollmentId, label: studentName, examCodes: [] }]}
            fixedEnrollmentId={enrollmentId}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
          Bu öğrencinin görebildiği içerik yok. Kütüphaneye ekle ya da buradan
          kişiye özel ata.
        </div>
      ) : (
        <ul className="flex flex-col divide-y rounded-xl bg-card ring-1 ring-foreground/10">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">
                  {item.title}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {[
                    CONTENT_TYPE_LABELS[item.type],
                    item.subjectName,
                    item.topicName,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              {item.isAssigned && (
                <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                  Özel
                </Badge>
              )}
              {item.viewedAt ? (
                <Badge className="h-5 bg-success/10 px-1.5 text-[10px] text-success">
                  İzlendi
                </Badge>
              ) : (
                <Badge className="h-5 bg-warning/10 px-1.5 text-[10px] text-warning">
                  Bekliyor
                </Badge>
              )}
              {contentHref(item) && (
                <a
                  href={contentHref(item) ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="İçeriği aç"
                  className="text-muted-foreground hover:text-primary"
                >
                  <ExternalLinkIcon className="size-4" />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
