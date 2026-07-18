import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { getPublishedPost } from "@/db/queries/cms";
import { formatTrDate } from "@/lib/dates";
import { CtaBand } from "@/components/marketing/cta-band";
import { Markdown } from "@/components/marketing/markdown";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Yazı D1'den okunur → istek başına render.
export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: "Yazı bulunamadı" };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10 sm:px-6 md:py-16">
      <div className="flex flex-col gap-6">
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          render={<Link href="/blog" />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Tüm yazılar
        </Button>

        <header className="flex flex-col gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            <span aria-hidden className="size-1.5 rounded-full bg-gold" />
            Blog
          </span>
          <h1 className="font-heading text-headline text-balance">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {post.publishedAt && (
              <time dateTime={post.publishedAt.toISOString()}>
                {formatTrDate(post.publishedAt)}
              </time>
            )}
            {post.author?.name && (
              <>
                <span aria-hidden>·</span>
                <span>{post.author.name}</span>
              </>
            )}
          </div>
        </header>
      </div>

      <Separator />

      <article>
        <Markdown body={post.body} />
      </article>

      <CtaBand
        title="Bu yöntemleri birlikte uygulayalım."
        description="Yazılar yol gösterir; koçluk yol yürütür. Ücretsiz ön görüşmede kendi planını konuşalım."
      />
    </div>
  );
}
