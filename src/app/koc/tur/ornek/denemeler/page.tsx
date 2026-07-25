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
