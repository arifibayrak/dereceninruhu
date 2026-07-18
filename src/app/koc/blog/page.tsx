import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLinkIcon, NewspaperIcon, PlusIcon } from "lucide-react";

import { listAllPosts } from "@/db/queries/cms";
import { formatTrDate } from "@/lib/dates";
import { getViewer } from "@/lib/session";
import { SectionHeading } from "@/components/brand/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Blog Yönetimi" };

const STATUS_LABEL = {
  draft: { label: "Taslak", cls: "bg-warning/10 text-warning" },
  published: { label: "Yayında", cls: "bg-success/10 text-success" },
  archived: { label: "Arşiv", cls: "bg-muted text-muted-foreground" },
} as const;

export default async function KocBlogPage() {
  const [posts, viewer] = await Promise.all([listAllPosts(), getViewer()]);
  const isAdmin = viewer?.role === "admin";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="İçerik"
          title="Blog yazıları"
          description="Kısa, uygulanabilir çalışma yazıları — yayına aldıkların sitede /blog altında görünür."
        />
        <Button render={<Link href="/koc/blog/yeni" />}>
          <PlusIcon data-icon="inline-start" />
          Yeni yazı
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-10 text-center ring-1 ring-foreground/10">
          <NewspaperIcon className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">Henüz yazı yok.</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            İlk yazını oluştur — ya da örnek yazılar için CMS seed&apos;ini
            çalıştır (pnpm db:seed:cms).
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y rounded-2xl bg-card ring-1 ring-foreground/10">
          {posts.map((post) => {
            const status = STATUS_LABEL[post.status];
            // Yönetici her yazıyı; koç yalnız kendi yazısını düzenleyebilir.
            const canManage = isAdmin || post.authorUserId === viewer?.id;
            const authorLabel =
              post.authorUserId === viewer?.id
                ? "sen"
                : (post.author?.name ?? "—");
            return (
              <li key={post.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  {canManage ? (
                    <Link
                      href={`/koc/blog/${post.id}`}
                      className="truncate text-sm font-medium hover:text-primary"
                    >
                      {post.title}
                    </Link>
                  ) : (
                    <span className="truncate text-sm font-medium">
                      {post.title}
                    </span>
                  )}
                  <span className="truncate text-xs text-muted-foreground">
                    /blog/{post.slug} · {authorLabel}
                    {post.publishedAt
                      ? ` · ${formatTrDate(post.publishedAt)}`
                      : ""}
                  </span>
                </div>
                <Badge className={status.cls}>{status.label}</Badge>
                {post.status === "published" && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Sitede aç"
                    render={
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    <ExternalLinkIcon />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
