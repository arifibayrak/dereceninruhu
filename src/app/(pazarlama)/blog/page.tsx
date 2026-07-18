import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, BookOpenIcon } from "lucide-react";

import { getPublishedPosts } from "@/db/queries/cms";
import { formatTrDate } from "@/lib/dates";
import { CtaBand } from "@/components/marketing/cta-band";

// Yazılar D1'den okunur → istek başına render.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Derecenin Ruhu blog: deneme analizi, haftalık program, net artırma ve sınav stratejisi üzerine uygulanabilir yazılar.",
};

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-4 py-10 sm:px-6 md:gap-16 md:py-16">
      <section className="relative flex flex-col items-start gap-4">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/3 h-64 w-[min(28rem,90vw)] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-gold" />
          Blog
        </span>
        <h1 className="font-heading text-headline text-balance">
          Net artıran yazılar
        </h1>
        <p className="max-w-xl text-base text-pretty text-muted-foreground">
          Koçluk görüşmelerinde işe yaradığını gördüğümüz yöntemler — kısa,
          somut ve hemen uygulanabilir.
        </p>
      </section>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-10 text-center ring-1 ring-foreground/10">
          <BookOpenIcon className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">Henüz yazı yayınlanmadı.</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            İlk yazılar yolda — bu arada SSS ve Nasıl Çalışır sayfalarına göz
            atabilirsin.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y">
          {posts.map((post) => (
            <article key={post.id} className="group py-6 first:pt-0 last:pb-0">
              <Link href={`/blog/${post.slug}`} className="flex flex-col gap-2">
                {post.publishedAt && (
                  <time
                    dateTime={post.publishedAt.toISOString()}
                    className="text-xs font-medium text-muted-foreground"
                  >
                    {formatTrDate(post.publishedAt)}
                  </time>
                )}
                <h2 className="font-heading text-xl font-semibold text-balance transition-colors group-hover:text-primary">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="max-w-2xl text-sm leading-relaxed text-pretty text-muted-foreground">
                    {post.excerpt}
                  </p>
                )}
                <span className="inline-flex items-center gap-1 pt-1 text-sm font-medium text-primary">
                  Yazıyı oku
                  <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </article>
          ))}
        </div>
      )}

      <CtaBand />
    </div>
  );
}
