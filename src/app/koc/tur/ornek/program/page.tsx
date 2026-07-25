import type { Metadata } from "next";
import { CircleCheckIcon, CircleIcon } from "lucide-react";

import { ornekProgram } from "@/lib/rehber/ornek-ogrenci";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Örnek öğrenci · Program" };

export default function OrnekProgramPage() {
  const pct = Math.round(
    (ornekProgram.tamamlanan / ornekProgram.toplam) * 100,
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Bu hafta · 20 Tem – 26 Tem</CardTitle>
            <Badge>{ornekProgram.durum}</Badge>
            <span className="text-sm text-muted-foreground tabular-nums">
              {ornekProgram.tamamlanan}/{ornekProgram.toplam} konu · %{pct}
            </span>
          </div>
          <CardDescription>
            Program yayınlandığı için öğrencinin ekranında görünüyor.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
          </div>

          <div className="rounded-xl bg-primary/10 px-4 py-3 ring-1 ring-primary/20">
            <span className="text-xs font-semibold tracking-wide text-primary uppercase">
              Haftanın mottosu
            </span>
            <p className="font-heading text-base">{ornekProgram.motto}</p>
          </div>

          <div className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Koç notu
            </span>
            <p className="text-sm text-pretty text-muted-foreground">
              {ornekProgram.kocNotu}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Görevler</CardTitle>
          <CardDescription>Ders × konu — gün atamalı.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y">
            {ornekProgram.gorevler.map((g) => (
              <li key={`${g.ders}-${g.konu}`} className="flex items-center gap-3 py-2.5">
                {g.bitti ? (
                  <CircleCheckIcon className="size-4 shrink-0 text-success" />
                ) : (
                  <CircleIcon className="size-4 shrink-0 text-muted-foreground/50" />
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={cn(
                      "truncate text-sm",
                      g.bitti && "text-muted-foreground line-through",
                    )}
                  >
                    {g.konu}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {g.ders} · {g.gun} · {g.hedef} soru
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
