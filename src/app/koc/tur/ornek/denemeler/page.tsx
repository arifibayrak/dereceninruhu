import type { Metadata } from "next";

import { ornekDenemeler, ornekEksikler } from "@/lib/rehber/ornek-ogrenci";
import { formatNet } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Örnek öğrenci · Denemeler" };

export default function OrnekDenemelerPage() {
  const maxEksik = Math.max(...ornekEksikler.map((e) => e.eksik));
  // Gerçek ekrandaki "Ders ders eksikler" panosunun statik karşılığı.
  const dersler = [...new Set(ornekEksikler.map((e) => e.ders))]
    .map((ders) => ({
      ders,
      konular: ornekEksikler.filter((e) => e.ders === ders),
      toplam: ornekEksikler
        .filter((e) => e.ders === ders)
        .reduce((acc, e) => acc + e.eksik, 0),
    }))
    .sort((a, b) => b.toplam - a.toplam);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Denemeler · {ornekDenemeler.length}</CardTitle>
          <CardDescription>
            Net, kaydedildiği anki formülle hesaplanır ve dondurulur.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="border-b text-left">
                {["Tarih", "Deneme", "Bölüm", "Kapsam", "Net", "Analiz"].map(
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
              {ornekDenemeler.map((d) => (
                <tr key={d.ad}>
                  <td className="py-2.5 pr-3 text-muted-foreground">{d.tarih}</td>
                  <td className="py-2.5 pr-3 font-medium">{d.ad}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{d.bolum}</td>
                  <td className="py-2.5 pr-3">
                    <Badge variant={d.kapsam === "Tam" ? "secondary" : "outline"}>
                      {d.kapsam}
                    </Badge>
                  </td>
                  <td className="py-2.5 pr-3 font-medium tabular-nums">
                    {formatNet(d.net)}
                  </td>
                  <td className="py-2.5 pr-3">
                    <Badge variant={d.analiz ? "secondary" : "outline"}>
                      {d.analiz ? "Edildi" : "Bekliyor"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ders ders eksikler</CardTitle>
          <CardDescription>
            Her dersten en çok eksik verilen konular · tüm dersler aynı ölçekte.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {dersler.map((d) => (
            <section
              key={d.ders}
              className="flex flex-col gap-2 border-t pt-3 first:border-t-0 first:pt-0"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">{d.ders}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {d.toplam} eksik
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {d.konular.map((e) => (
                  <li key={e.konu} className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {e.konu}
                    </span>
                    <span className="h-1.5 w-32 overflow-hidden rounded-full bg-muted sm:w-48">
                      <span
                        className="block h-full rounded-full bg-destructive/60"
                        style={{ width: `${(e.eksik / maxEksik) * 100}%` }}
                      />
                    </span>
                    <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums">
                      {e.eksik}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Toplam eksik</CardTitle>
          <CardDescription>
            Tüm deneme analizlerinden konu sıralaması — yanlış + boş.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2.5">
            {ornekEksikler.map((e) => (
              <li key={e.konu} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-sm">{e.konu}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-destructive/60"
                    style={{ width: `${(e.eksik / maxEksik) * 100}%` }}
                  />
                </span>
                <span className="w-16 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                  {e.eksik} eksik
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
