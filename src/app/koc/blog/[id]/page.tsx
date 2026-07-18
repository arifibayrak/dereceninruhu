import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { getPostById } from "@/db/queries/cms";
import { getViewer } from "@/lib/session";
import { BlogPostForm } from "@/components/app/blog-post-form";
import { SectionHeading } from "@/components/brand/section-heading";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Yazıyı Düzenle" };

export default async function YaziDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId) || postId <= 0) notFound();

  const post = await getPostById(postId);
  if (!post) notFound();
  // Koç yalnız kendi yazısını düzenleyebilir; yönetici hepsini.
  const viewer = await getViewer();
  if (viewer?.role === "coach" && post.authorUserId !== viewer.id) {
    notFound();
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          render={<Link href="/koc/blog" />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Blog yazıları
        </Button>
        <SectionHeading eyebrow="İçerik" title="Yazıyı düzenle" />
      </div>
      <div className="max-w-3xl">
        <BlogPostForm
          post={{
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            body: post.body,
            coverImageUrl: post.coverImageUrl,
            status: post.status,
          }}
        />
      </div>
    </>
  );
}
