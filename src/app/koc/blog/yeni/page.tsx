import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { BlogPostForm } from "@/components/app/blog-post-form";
import { SectionHeading } from "@/components/brand/section-heading";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Yeni Yazı" };

export default function YeniYaziPage() {
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
        <SectionHeading
          eyebrow="İçerik"
          title="Yeni yazı"
          description="Taslak olarak kaydet, hazır olunca 'Yayında' yap."
        />
      </div>
      <div className="max-w-3xl">
        <BlogPostForm />
      </div>
    </>
  );
}
