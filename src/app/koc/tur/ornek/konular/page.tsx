import type { Metadata } from "next";

import { ornekKaynaklar, ornekKonuIlerleme } from "@/lib/rehber/ornek-ogrenci";
import { formatInt } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Örnek öğrenci · Konular" };

export default function OrnekKonularPage() {
  const biten = ornekKonuIlerleme.reduce((a, r) => a + r.biten, 0);
  const toplam = ornekKonuIlerleme.reduce((a, r) => a + r.toplam, 0);
  const pct = Math.round((biten / toplam) * 100);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            Konu ilerleme · {biten}/{toplam} konu · %{pct}
          </CardTitle>
          <CardDescription>
            Ders bazlı ilerleme; en geride kalan ders bir sonraki programın
            odağı olur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3">
            {ornekKonuIlerleme.map((r) => {
              const p = Math.round((r.biten / r.toplam) * 100);
              return (
                <li key={r.ders} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-sm font-medium">
                    {r.ders}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary/70"
                      style={{ width: `${p}%` }}
                    />
                  </span>
                  <span className="w-20 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                    {r.biten}/{r.toplam}
                  </span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kaynak başına soru & konu</CardTitle>
          <CardDescription>
            Hangi kaynaktan ne kadar çözülmüş, kaç konu bitmiş.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b text-left">
                {["Kaynak", "Ders", "Toplam soru", "Bu hafta", "Biten konu"].map(
                  (h) => (
                    <th
                      key={h}
                      className="py-2 pr-3 text-xs font-semibold text-muted-foreground uppercase"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {ornekKaynaklar.map((k) => (
                <tr key={k.ad}>
                  <td className="py-2.5 pr-3 font-medium">{k.ad}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{k.ders}</td>
                  <td className="py-2.5 pr-3 tabular-nums">
                    {formatInt(k.soru)}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">
                    {formatInt(k.buHafta)}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">
                    {k.bitenKonu}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
