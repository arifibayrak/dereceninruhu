import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import type { Section } from "@/lib/rehber/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GuideBlock } from "@/components/rehber/guide-blocks";
import { SectionReadToggle } from "@/components/rehber/section-read-toggle";

/** Tek bir rehber bölümü — server component, gövde metni istemciye JS olarak gitmez. */
export function GuideSection({
  section,
  scrollMtClass,
}: {
  section: Section;
  scrollMtClass: string;
}) {
  return (
    <section
      id={`bolum-${section.id}`}
      data-rehber-section
      className={cn("flex scroll-mt-32 flex-col gap-4", scrollMtClass)}
    >
      <header className="flex flex-col gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-gold" />
          {section.no > 0 && (
            <span className="tabular-nums">
              {String(section.no).padStart(2, "0")}
            </span>
          )}
          <span className="text-muted-foreground/70">{section.chapter}</span>
        </span>
        <h2 className="font-heading text-title text-balance">{section.title}</h2>
        <p className="max-w-prose text-sm leading-relaxed text-pretty text-muted-foreground md:text-base">
          {section.lead}
        </p>
        {section.where && (
          <Button
            variant="ghost"
            size="sm"
            className="w-fit text-primary"
            render={<Link href={section.where} />}
          >
            Ekrana git
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        )}
      </header>

      {section.blocks.map((block, i) => (
        <GuideBlock key={i} block={block} />
      ))}

      <SectionReadToggle sectionId={section.id} />
    </section>
  );
}
