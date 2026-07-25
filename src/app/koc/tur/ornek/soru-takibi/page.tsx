import type { Metadata } from "next";

import { GUNLER, ornekSoruIzgarasi } from "@/lib/rehber/ornek-ogrenci";
import { formatInt } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Örnek öğrenci · Soru Takibi" };

export default function OrnekSoruTakibiPage() {
  const gunToplam = GUNLER.map((_, i) =>
    ornekSoruIzgarasi.reduce((a, r) => a + r.gunler[i], 0),
  );
  const haftaToplam = gunToplam.reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bu hafta · 20 Tem – 26 Tem</CardTitle>
        <CardDescription>
          Hücreye dokun → doğru / yanlış / boş gir. Koç olarak sen de
          düzenleyebilirsin.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-3 text-xs font-semibold text-muted-foreground uppercase">
                Ders
              </th>
              {GUNLER.map((g) => (
                <th
                  key={g}
                  className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground uppercase"
                >
                  {g}
                </th>
              ))}
              <th className="px-2 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">
                Toplam
              </th>
              <th className="px-2 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">
                Doğruluk
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {ornekSoruIzgarasi.map((r) => {
              const toplam = r.gunler.reduce((a, b) => a + b, 0);
              const dogruluk = Math.round(
                (r.dogru / Math.max(1, r.dogru + r.yanlis)) * 100,
              );
              return (
                <tr key={r.ders}>
                  <td className="py-2 pr-3 font-medium">{r.ders}</td>
                  {r.gunler.map((n, i) => (
                    <td
                      key={i}
                      className="px-2 py-2 text-center tabular-nums text-muted-foreground"
                    >
                      {n === 0 ? "·" : n}
                    </td>
                  ))}
                  <td className="px-2 py-2 text-right font-medium tabular-nums">
                    {formatInt(toplam)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">
                    %{dogruluk}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t">
              <td className="py-2 pr-3 text-xs font-semibold text-muted-foreground uppercase">
                Günlük toplam
              </td>
              {gunToplam.map((n, i) => (
                <td
                  key={i}
                  className="px-2 py-2 text-center font-medium tabular-nums"
                >
                  {n === 0 ? "·" : n}
                </td>
              ))}
              <td className="px-2 py-2 text-right font-semibold tabular-nums">
                {formatInt(haftaToplam)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </CardContent>
    </Card>
  );
}
