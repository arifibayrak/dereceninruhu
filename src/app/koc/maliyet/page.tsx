import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  BrainCircuitIcon,
  CalendarClockIcon,
  CoinsIcon,
  ServerIcon,
  TrendingUpIcon,
} from "lucide-react";

import {
  featureAdi,
  getAiKullanim,
  getIlkKullanimTarihi,
  getOlcek,
} from "@/db/queries/maliyet";
import { formatInt, formatKurus } from "@/lib/format";
import { trtMonthRange } from "@/lib/muhasebe";
import { getViewer } from "@/lib/session";
import {
  GELISTIRME,
  MODEL_FIYAT,
  PROJEKSIYON_BASAMAKLARI,
  projeksiyon,
  SABIT_GIDERLER,
  SES_FIYAT_DAKIKA,
  usdToKurus,
  USD_TRY,
  USD_TRY_TARIHI,
} from "@/lib/maliyet";
import { SectionHeading } from "@/components/brand/section-heading";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Maliyet" };

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** USD tutarını TL olarak yazar (proje kuralı: para = kuruş üzerinden formatlanır). */
const tl = (usd: number) => formatKurus(usdToKurus(usd));

function Kart({
  icon: Icon,
  etiket,
  deger,
  alt,
  vurgu,
}: {
  icon: typeof CoinsIcon;
  etiket: string;
  deger: string;
  alt: string;
  vurgu?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" />
        {etiket}
      </span>
      <span
        className={`font-heading text-2xl font-semibold tabular-nums ${vurgu ? "text-primary" : ""}`}
      >
        {deger}
      </span>
      <span className="text-xs leading-snug text-muted-foreground">{alt}</span>
    </div>
  );
}

export default async function MaliyetPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  // Maliyet ve abonelik rakamları koçları ilgilendirmiyor — yalnız yönetici.
  if (viewer.role !== "admin") redirect("/koc");

  const now = new Date();
  const { start, end } = trtMonthRange(now);
  const [kullanim, olcek, ilkKayit] = await Promise.all([
    getAiKullanim(start, end),
    getOlcek(),
    getIlkKullanimTarihi(),
  ]);

  const aiUsd = kullanim.reduce((t, k) => t + k.usd, 0);
  const sabitUsd = SABIT_GIDERLER.reduce((t, g) => t + g.aylikUsd, 0);
  // Claude Max geliştirme aboneliği; uygulamanın ÇALIŞMASI için gerekmiyor.
  const isletmeUsd =
    SABIT_GIDERLER.filter((g) => !g.ad.includes("Claude Max")).reduce(
      (t, g) => t + g.aylikUsd,
      0,
    ) + aiUsd;
  const aiOgrenciBasina = olcek.ogrenci > 0 ? aiUsd / olcek.ogrenci : 0;
  const ogrenciBasina = olcek.ogrenci > 0 ? isletmeUsd / olcek.ogrenci : 0;

  const veriVar = kullanim.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <SectionHeading
        eyebrow="Yönetici"
        title="Maliyet ve kaynak kullanımı"
        description={`Bu ayın gerçek gideri, AI jeton tüketimi ve büyüme projeksiyonu. Kur: 1 USD = ${USD_TRY.toLocaleString("tr-TR")} TL (${dateFmt.format(new Date(USD_TRY_TARIHI))}).`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kart
          icon={CoinsIcon}
          etiket="Bu ayın işletme gideri"
          deger={tl(isletmeUsd)}
          alt="Sunucu, alan adı ve AI. Geliştirme aboneliği hariç."
          vurgu
        />
        <Kart
          icon={ServerIcon}
          etiket="Öğrenci başına / ay"
          deger={tl(ogrenciBasina)}
          alt={`${formatInt(olcek.ogrenci)} aktif öğrenciye bölündüğünde.`}
        />
        <Kart
          icon={BrainCircuitIcon}
          etiket="Bu ayın AI gideri"
          deger={tl(aiUsd)}
          alt={
            veriVar
              ? `${formatInt(kullanim.reduce((t, k) => t + k.cagri, 0))} model çağrısı — ölçüldü.`
              : "Henüz kayıt yok."
          }
        />
        <Kart
          icon={CalendarClockIcon}
          etiket="Yıllık yinelenen"
          deger={tl(isletmeUsd * 12)}
          alt="Bu ayki gider 12 ay sürerse."
        />
      </div>

      {/* ---------------- Sabit giderler ---------------- */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-lg font-semibold">Yinelenen giderler</h2>
          <p className="text-sm text-muted-foreground">
            Sabit kalemler elle tanımlı ({" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              src/lib/maliyet.ts
            </code>{" "}
            ), AI kalemi gerçek kullanımdan hesaplanır.
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">Kalem</th>
                <th className="px-4 py-2.5 text-right font-medium">Aylık</th>
                <th className="px-4 py-2.5 text-right font-medium">Yıllık</th>
                <th className="px-4 py-2.5 text-left font-medium">Tür</th>
              </tr>
            </thead>
            <tbody>
              {SABIT_GIDERLER.map((g) => (
                <tr key={g.ad} className="border-b last:border-0">
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{g.ad}</div>
                    <div className="text-xs text-muted-foreground">{g.aciklama}</div>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {tl(g.aylikUsd)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {tl(g.aylikUsd * 12)}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="secondary">
                      {g.ad.includes("Claude Max") ? "Geliştirme" : "İşletme"}
                    </Badge>
                  </td>
                </tr>
              ))}
              <tr className="border-b last:border-0">
                <td className="px-4 py-2.5">
                  <div className="font-medium">Yapay zekâ (uygulama içi)</div>
                  <div className="text-xs text-muted-foreground">
                    Bu ayki gerçek jeton tüketimi — aşağıda kırılımı var.
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{tl(aiUsd)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                  {tl(aiUsd * 12)}
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant="secondary">İşletme · değişken</Badge>
                </td>
              </tr>
              <tr className="bg-muted/40 font-semibold">
                <td className="px-4 py-2.5">Toplam (geliştirme dahil)</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {tl(sabitUsd + aiUsd)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {tl((sabitUsd + aiUsd) * 12)}
                </td>
                <td className="px-4 py-2.5" />
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------- AI kırılımı ---------------- */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-lg font-semibold">
            Yapay zekâ kullanımı — bu ay
          </h2>
          <p className="text-sm text-muted-foreground">
            {ilkKayit
              ? `Jeton sayacı ${dateFmt.format(ilkKayit)} tarihinden beri kayıt tutuyor.`
              : "Jeton sayacı yeni açıldı; ilk model çağrısından sonra burası dolacak."}
          </p>
        </div>
        {veriVar ? (
          <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="px-4 py-2.5 text-left font-medium">Özellik</th>
                  <th className="px-4 py-2.5 text-right font-medium">Çağrı</th>
                  <th className="px-4 py-2.5 text-right font-medium">Girdi</th>
                  <th className="px-4 py-2.5 text-right font-medium">Çıktı</th>
                  <th className="px-4 py-2.5 text-right font-medium">Maliyet</th>
                </tr>
              </thead>
              <tbody>
                {kullanim.map((k) => (
                  <tr key={`${k.feature}-${k.model}`} className="border-b last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{featureAdi(k.feature)}</div>
                      <div className="text-xs text-muted-foreground">{k.model}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatInt(k.cagri)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                      {k.audioSeconds > 0
                        ? `${formatInt(Math.round(k.audioSeconds / 60))} dk ses`
                        : formatInt(k.inputTokens + k.cachedInputTokens)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                      {k.audioSeconds > 0 ? "—" : formatInt(k.outputTokens)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                      {tl(k.usd)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/40 font-semibold">
                  <td className="px-4 py-2.5">Toplam</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {formatInt(kullanim.reduce((t, k) => t + k.cagri, 0))}
                  </td>
                  <td className="px-4 py-2.5" />
                  <td className="px-4 py-2.5" />
                  <td className="px-4 py-2.5 text-right tabular-nums">{tl(aiUsd)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-xl bg-card p-4 text-sm text-muted-foreground ring-1 ring-foreground/10">
            Bu ay henüz AI kullanımı kaydedilmedi. Program taslağı, koç asistanı,
            öğrenci sohbeti ya da görüşme çıkarımı çalıştığında satırlar burada belirir.
          </p>
        )}
      </section>

      {/* ---------------- Model fiyatları ---------------- */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-lg font-semibold">Model fiyat listesi</h2>
          <p className="text-sm text-muted-foreground">
            Milyon jeton başına USD. Fiyat değişince tek yerden güncellenir; geçmiş
            kayıtlar yeniden fiyatlanır (jeton saklanıyor, tutar değil).
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
          <table className="w-full min-w-[30rem] text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">Model</th>
                <th className="px-4 py-2.5 text-right font-medium">Girdi / 1M</th>
                <th className="px-4 py-2.5 text-right font-medium">Çıktı / 1M</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(MODEL_FIYAT).map(([slug, f]) => (
                <tr key={slug} className="border-b last:border-0">
                  <td className="px-4 py-2.5 font-medium">{slug}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">${f.girdi}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">${f.cikti}</td>
                </tr>
              ))}
              <tr className="border-b last:border-0">
                <td className="px-4 py-2.5 font-medium">
                  openai/whisper-large-v3-turbo
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums" colSpan={2}>
                  ${SES_FIYAT_DAKIKA} / dakika ses
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Önbellekten okunan girdi, normal girdinin yüzde onu kadar fiyatlanır — uzun
          sohbetlerde fark buradan çıkar.
        </p>
      </section>

      {/* ---------------- Büyüme ---------------- */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <TrendingUpIcon className="size-4 text-primary" />
            Büyüme projeksiyonu
          </h2>
          <p className="text-sm text-muted-foreground">
            {veriVar
              ? `Öğrenci başına ölçülen AI gideri (${tl(aiOgrenciBasina)}/ay) sabit giderlerin üzerine eklenerek hesaplandı.`
              : "AI kullanımı kaydedildikçe bu tablo gerçek veriyle dolacak; şu an yalnız sabit giderleri gösteriyor."}
          </p>
        </div>
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
          <table className="w-full min-w-[30rem] text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">Öğrenci</th>
                <th className="px-4 py-2.5 text-right font-medium">Aylık</th>
                <th className="px-4 py-2.5 text-right font-medium">Yıllık</th>
                <th className="px-4 py-2.5 text-right font-medium">Öğrenci başına</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b bg-primary/5 last:border-0">
                <td className="px-4 py-2.5 font-medium">
                  {formatInt(olcek.ogrenci)}{" "}
                  <Badge variant="secondary" className="ml-1">
                    bugün
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {tl(isletmeUsd)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                  {tl(isletmeUsd * 12)}
                </td>
                <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                  {tl(ogrenciBasina)}
                </td>
              </tr>
              {PROJEKSIYON_BASAMAKLARI.map((n) => {
                const p = projeksiyon(
                  n,
                  aiOgrenciBasina,
                  0,
                  SABIT_GIDERLER.filter((g) => !g.ad.includes("Claude Max")),
                );
                return (
                  <tr key={n} className="border-b last:border-0">
                    <td className="px-4 py-2.5">{formatInt(n)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {tl(p.aylikUsd)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                      {tl(p.aylikUsd * 12)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                      {tl(p.ogrenciBasinaUsd)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------- Geliştirme ---------------- */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-lg font-semibold">
            Geliştirme maliyeti — tek seferlik
          </h2>
          <p className="text-sm text-muted-foreground">
            {dateFmt.format(new Date(GELISTIRME.baslangic))} –{" "}
            {dateFmt.format(new Date(GELISTIRME.bitis))} arası ({GELISTIRME.gun} gün),
            Claude Code oturum kayıtlarından sayıldı. Bu bir anlık ölçüm; canlı
            güncellenmez.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kart
            icon={BrainCircuitIcon}
            etiket="Model çağrısı"
            deger={formatInt(GELISTIRME.cagri)}
            alt={`${formatInt(GELISTIRME.ciktiJeton)} çıktı jetonu üretildi.`}
          />
          <Kart
            icon={CoinsIcon}
            etiket="Toplam jeton"
            deger={`${(GELISTIRME.toplamJeton / 1_000_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} mlr`}
            alt="%98'i önbellekten okundu."
          />
          <Kart
            icon={ServerIcon}
            etiket="Nakit çıkışı"
            deger={tl(GELISTIRME.nakitUsd)}
            alt="Abonelik + altyapı + OpenRouter."
          />
          <Kart
            icon={TrendingUpIcon}
            etiket="Jetonun API değeri"
            deger={tl(GELISTIRME.apiDegeriUsd)}
            alt="Aynı jetonlar API'den alınsaydı."
            vurgu
          />
        </div>
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
          <table className="w-full min-w-[30rem] text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">Model</th>
                <th className="px-4 py-2.5 text-right font-medium">Çağrı</th>
                <th className="px-4 py-2.5 text-right font-medium">Jeton</th>
                <th className="px-4 py-2.5 text-right font-medium">API değeri</th>
              </tr>
            </thead>
            <tbody>
              {GELISTIRME.modeller.map((m) => (
                <tr key={m.ad} className="border-b last:border-0">
                  <td className="px-4 py-2.5 font-medium">{m.ad}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {formatInt(m.cagri)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {formatInt(m.jeton)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{tl(m.usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
