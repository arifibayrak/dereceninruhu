import { ExternalLinkIcon, StarIcon } from "lucide-react";

import { coachStats } from "@/db/seed/cms-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/**
 * 5,0★ / 77 yorum sosyal kanıt şeridi — Gigbi'ye doğrulama linkiyle.
 * Rozetler (credentials) opsiyonel; ana sayfada koç rozetleri geçilir.
 */
export function ProofStrip({
  credentials = [],
  className,
}: {
  credentials?: string[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10",
        className,
      )}
    >
      <span className="font-heading text-3xl font-bold tabular-nums">5,0</span>
      <div className="flex flex-col">
        <span
          className="flex items-center gap-0.5"
          role="img"
          aria-label="5 yıldız"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon key={i} className="size-4 fill-gold text-gold" />
          ))}
        </span>
        <span className="text-sm text-muted-foreground">
          {coachStats.reviewCount} yorum · KPSS / YKS / LGS
        </span>
      </div>
      {credentials.length > 0 && (
        <>
          <Separator className="hidden h-8 sm:block" orientation="vertical" />
          <div className="flex flex-wrap gap-1.5">
            {credentials.map((credential) => (
              <Badge key={credential} variant="secondary">
                {credential}
              </Badge>
            ))}
          </div>
        </>
      )}
      <Button
        variant="link"
        size="sm"
        className="ml-auto"
        render={
          <a
            href={coachStats.proofUrl}
            target="_blank"
            rel="noopener noreferrer"
          />
        }
      >
        Gigbi&apos;de doğrula
        <ExternalLinkIcon data-icon="inline-end" />
      </Button>
    </div>
  );
}
