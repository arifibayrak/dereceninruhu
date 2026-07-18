import { Fragment, type ReactNode } from "react";
import Link from "next/link";

/**
 * Güvenli, minimal markdown-benzeri gösterici (blog gövdeleri için).
 * Desteklenen alt küme: ## / ### başlık, - liste, > alıntı, **kalın**,
 * [metin](url) — yalnız http(s) ve site içi (/) linkler. HTML asla ham
 * basılmaz (dangerouslySetInnerHTML yok) — XSS yüzeyi sıfır.
 */

type Block =
  | { type: "h2" | "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "quote"; text: string }
  | { type: "ul"; items: string[] };

function parseBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "p", text: paragraph.join(" ") });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ type: "ul", items: list });
      list = [];
    }
  };

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h2", text: line.slice(3).trim() });
    } else if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "h3", text: line.slice(4).trim() });
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      flushParagraph();
      list.push(line.slice(2).trim());
    } else if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "quote", text: line.slice(2).trim() });
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

const INLINE_RE = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g;

function renderInline(text: string): ReactNode {
  const parts = text.split(INLINE_RE);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const linkMatch = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      if (href.startsWith("/")) {
        return (
          <Link
            key={i}
            href={href}
            className="font-medium text-primary underline underline-offset-4 hover:no-underline"
          >
            {label}
          </Link>
        );
      }
      if (href.startsWith("https://") || href.startsWith("http://")) {
        return (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-4 hover:no-underline"
          >
            {label}
          </a>
        );
      }
      // Güvensiz şema — düz metin olarak bas.
      return <Fragment key={i}>{label}</Fragment>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function Markdown({ body }: { body: string }) {
  const blocks = parseBlocks(body);
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2 key={i} className="font-heading mt-4 text-xl font-semibold tracking-tight first:mt-0">
                {renderInline(block.text)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="font-heading mt-2 text-lg font-semibold tracking-tight">
                {renderInline(block.text)}
              </h3>
            );
          case "ul":
            return (
              <ul key={i} className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed text-foreground/90 marker:text-primary/60">
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ul>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="rounded-r-xl border-l-2 border-gold bg-accent/40 px-4 py-3 text-[15px] leading-relaxed font-medium text-pretty"
              >
                {renderInline(block.text)}
              </blockquote>
            );
          default:
            return (
              <p key={i} className="text-[15px] leading-relaxed text-pretty text-foreground/90">
                {renderInline(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
}
