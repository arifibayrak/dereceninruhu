import type { Metadata } from "next";

import {
  ornekIcgoruler,
  ornekNetSerisi,
  ornekOzet,
} from "@/lib/rehber/ornek-ogrenci";
import { formatInt, formatNet } from "@/lib/format";
import { formatMinutes } from "@/lib/study";
import { StatTile } from "@/components/brand/stat-tile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Örnek öğrenci" };

export default function OrnekGenelBakisPage() {
  const max = Math.max(...ornekNetSerisi.map((p) => p.net));
  const min = Math.min(...ornekNetSerisi.map((p) => p.net));
  const span = Math.max(1, max - min);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatTile
          label="Toplam soru"
          value={formatInt(ornekOzet.totalQuestions)}
        />
        <StatTile
          label="Bu hafta"
          value={formatInt(ornekOzet.weekQuestions)}
          hint="soru"
        />
        <StatTile
          label="Çalışma"
          value={formatMinutes(ornekOzet.studyMinutes)}
          hint="bu hafta"
        />
        <StatTile
          label="Son net"
          value={formatNet(ornekOzet.lastNet)}
          hint={`+${formatNet(ornekOzet.netDelta)}`}
        />
        <StatTile
          label="Seri"
          value={formatInt(ornekOzet.streak)}
          hint="gün"
        />
        <StatTile label="Ödeme" value="Ödendi" hint="Sonraki: 1 Tem" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Net gelişimi</CardTitle>
            <CardDescription>Son 7 tam deneme.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Basit sütun grafik — örnek veriyi göstermek için yeterli. */}
            <div className="flex h-40 items-end gap-2">
              {ornekNetSerisi.map((p) => (
                <div key={p.label} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {formatNet(p.net)}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-primary/70"
                    style={{ height: `${20 + ((p.net - min) / span) * 80}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {p.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Otomatik içgörüler</CardTitle>
            <CardDescription>
              Öğrencinin verisinden çıkarılan sinyaller.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2.5">
              {ornekIcgoruler.map((t) => (
                <li key={t} className="flex gap-2.5 text-sm">
                  <span
                    aria-hidden
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold"
                  />
                  <span className="text-pretty text-muted-foreground">{t}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
