import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { ExternalLinkIcon, StarIcon } from "lucide-react";

import { Logo, LogoMark } from "@/components/brand/logo";
import { SectionHeading } from "@/components/brand/section-heading";
import { StatTile } from "@/components/brand/stat-tile";
import { TestimonialCard } from "@/components/brand/testimonial-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import {
  DialogDemo,
  DropdownDemo,
  SelectDemo,
  SheetDemo,
  TabsDemo,
  ToastDemo,
  TooltipDemo,
} from "./component-demos";
import { coachProfile, featuredTestimonials, wallOfLoveTeasers } from "./gigbi-content";
import { NetChart, SubjectBars } from "./net-chart";

export const metadata: Metadata = {
  title: "Marka Rehberi",
  description:
    "Derecenin Ruhu marka kimliği: logo, renk paleti, tipografi ve bileşenler.",
  // Dahili referans sayfası — arama sonuçlarında görünmesin.
  robots: { index: false, follow: false },
};

/* ----------------------------- Renk verileri ----------------------------- */

type SwatchDef = {
  token: string;
  cls: string;
  light: string;
  dark: string;
  note?: string;
};

const SWATCH_GROUPS: { title: string; swatches: SwatchDef[] }[] = [
  {
    title: "Zemin & Metin",
    swatches: [
      { token: "--background", cls: "bg-background", light: "#f9f9fc", dark: "#110f1f" },
      { token: "--foreground", cls: "bg-foreground", light: "#1a172e", dark: "#ececf5" },
      { token: "--card", cls: "bg-card", light: "#ffffff", dark: "#1b192d" },
      { token: "--muted", cls: "bg-muted", light: "#efeff9", dark: "#252438" },
      { token: "--muted-foreground", cls: "bg-muted-foreground", light: "#59586e", dark: "#a3a2ba" },
      { token: "--border", cls: "bg-border", light: "#dedeed", dark: "%12 beyaz" },
    ],
  },
  {
    title: "Marka",
    swatches: [
      { token: "--primary", cls: "bg-primary", light: "#5b33c5", dark: "#a58df9", note: "Çivit — ana renk" },
      { token: "--gold", cls: "bg-gold", light: "#eab53b", dark: "#f0c04e", note: "Derece altını" },
      { token: "--secondary", cls: "bg-secondary", light: "#e9e8fb", dark: "#2a2743" },
      { token: "--accent", cls: "bg-accent", light: "#f9eecd", dark: "#3f2d0a", note: "Altın yıkama (hover)" },
      { token: "--ring", cls: "bg-ring", light: "#7962dd", dark: "#a58df9", note: "Odak halkası" },
    ],
  },
  {
    title: "Semantik",
    swatches: [
      { token: "--success", cls: "bg-success", light: "#008247", dark: "#43c07a", note: "Net artışı" },
      { token: "--warning", cls: "bg-warning", light: "#ce7c22", dark: "#eba941" },
      { token: "--info", cls: "bg-info", light: "#1d73be", dark: "#58a5e4" },
      { token: "--destructive", cls: "bg-destructive", light: "#d01c29", dark: "#f3625d" },
    ],
  },
  {
    title: "Grafik — Ders Paleti (CVD güvenli)",
    swatches: [
      { token: "--chart-1", cls: "bg-chart-1", light: "#6f54d6", dark: "#876fe4", note: "Matematik" },
      { token: "--chart-2", cls: "bg-chart-2", light: "#b77b0f", dark: "#c28914", note: "Türkçe" },
      { token: "--chart-3", cls: "bg-chart-3", light: "#007f5b", dark: "#00916c", note: "Fen" },
      { token: "--chart-4", cls: "bg-chart-4", light: "#4284c5", dark: "#5b97d3", note: "Sosyal" },
      { token: "--chart-5", cls: "bg-chart-5", light: "#bf395b", dark: "#cc4f6a", note: "Diğer" },
    ],
  },
];

function Swatch({ token, cls, light, dark, note }: SwatchDef) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={cn("h-14 rounded-lg ring-1 ring-foreground/10", cls)} />
      <div className="flex flex-col">
        <span className="font-mono text-xs font-medium">{token}</span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          Açık {light} · Koyu {dark}
        </span>
        {note && (
          <span className="text-[11px] font-medium text-primary">{note}</span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Tablo verisi ----------------------------- */

const DENEME_ROWS = [
  { name: "3D TYT Deneme 12", date: "12 Tem", net: "48,75", delta: "+3,75", up: true },
  { name: "Limit TYT 7", date: "5 Tem", net: "45,00", delta: "+4,75", up: true },
  { name: "3D TYT Deneme 11", date: "28 Haz", net: "40,25", delta: "−1,25", up: false },
];

export default function MarkaPage() {
  return (
    <div className={`${GeistMono.variable} flex min-h-full flex-1 flex-col`}>
      {/* Üst çubuk */}
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo size={28} />
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Marka Rehberi v1
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 py-10 sm:px-6 md:gap-20 md:py-14">
        {/* ------------------------------ Kapak ------------------------------ */}
        <section className="relative">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-28 left-1/2 h-72 w-[min(36rem,90vw)] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute top-4 right-[8%] size-40 rounded-full bg-gold/15 blur-2xl" />
          </div>
          <div className="flex flex-col items-start gap-6 py-6 md:py-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
              <span aria-hidden className="size-1.5 rounded-full bg-gold" />
              Derecenin Ruhu · Marka Rehberi
            </span>
            <h1 className="font-heading text-display max-w-3xl text-balance">
              Netlerini artır,{" "}
              <span className="text-primary">hedefine ulaş</span>
              <span className="text-gold">.</span>
            </h1>
            <p className="max-w-xl text-base text-pretty text-muted-foreground md:text-lg">
              LGS, YKS ve KPSS için birebir koçluk. Disiplinli takip, sıcak bir
              yol arkadaşlığı ve her denemede görünür ilerleme — işte derecenin
              ruhu.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg">Koçluğa başla</Button>
              <Button size="lg" variant="outline">
                Denemelerimi gör
              </Button>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <StarIcon className="size-4 fill-gold text-gold" />
                5,0 · {coachProfile.stats.reviewCount} yorum
              </span>
            </div>
          </div>
        </section>

        {/* ------------------------------- Logo ------------------------------ */}
        <section className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Kimlik"
            title="Logo ve işaret"
            description="Yükselen üç net çubuğu ve en tepede derecenin altın kıvılcımı: ruh. Rozet her iki modda da aynı; yazı tema tokenlarını izler."
          />
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Açık zemin</CardTitle>
                <CardDescription>Varsayılan kullanım</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-start gap-5 py-4">
                <Logo size={40} />
                <Logo size={28} />
                <div className="flex items-center gap-3">
                  <LogoMark size={48} />
                  <LogoMark size={32} />
                  <LogoMark size={20} />
                </div>
              </CardContent>
            </Card>
            <div className="flex flex-col justify-between gap-5 rounded-xl bg-[#38207b] p-5 ring-1 ring-foreground/10 dark:bg-[#241452]">
              <div className="flex flex-col gap-1">
                <span className="font-heading text-base font-medium text-white">
                  Koyu çivit zemin
                </span>
                <span className="text-sm text-white/70">
                  tone=&quot;inverse&quot; — yazı beyaz, Ruhu altın
                </span>
              </div>
              <div className="flex flex-col items-start gap-4">
                <Logo size={40} tone="inverse" />
                <Logo size={28} tone="inverse" variant="wordmark" />
              </div>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Kullanım kuralları</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex list-disc flex-col gap-1.5 pl-4 text-sm text-muted-foreground">
                  <li>İşaret tek başına favicon ve uygulama simgesidir.</li>
                  <li>En küçük boyut: işaret 20 px, tam logo 24 px.</li>
                  <li>Kıvılcım her zaman altın kalır; yeniden renklendirilmez.</li>
                  <li>Çevresinde en az işaret genişliğinin ¼&apos;ü kadar boşluk bırakın.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ------------------------------ Slogan ----------------------------- */}
        <section className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Ses"
            title="Slogan"
            description="İki aday; önerilen ilki — somut, sınav odaklı ve ürünle (net takibi) birebir örtüşüyor."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-2 ring-primary/40">
              <Badge>Önerilen</Badge>
              <p className="font-heading text-title">
                “Netlerini artır, hedefine ulaş.”
              </p>
              <p className="text-sm text-muted-foreground">
                Ana slogan — kapaklarda, karşılama ekranında, reklamda.
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <Badge variant="secondary">Alternatif / destek</Badge>
              <p className="font-heading text-title text-muted-foreground">
                “Hedefine giden yolda ruhun yanında.”
              </p>
              <p className="text-sm text-muted-foreground">
                Duygusal ton — motivasyon bildirimleri ve koç mesajları için.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------ Renkler ---------------------------- */}
        <section className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Renk"
            title="Palet ve tokenlar"
            description="Gece çalışan öğrencinin çividi + derecenin altını. Tüm metin çiftleri iki modda da WCAG AA; ders paleti renk körlüğü kontrolünden geçti."
          />
          <div className="flex flex-col gap-8">
            {SWATCH_GROUPS.map((group) => (
              <div key={group.title} className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {group.title}
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {group.swatches.map((swatch) => (
                    <Swatch key={swatch.token} {...swatch} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ----------------------------- Tipografi --------------------------- */}
        <section className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Tipografi"
            title="Yazı yüzleri ve skala"
            description="Başlıklar: Bricolage Grotesque (karakterli, sıcak). Gövde: Geist. Sayılar: Geist Mono / tabular. Üçü de self-hosted, Türkçe glifler tam."
          />
          <Card>
            <CardContent className="flex flex-col gap-6 py-5">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[11px] text-muted-foreground">
                  text-display · Bricolage Grotesque 700
                </span>
                <p className="font-heading text-display">Netlerini artır.</p>
              </div>
              <Separator />
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[11px] text-muted-foreground">
                  text-headline · Bricolage Grotesque 700
                </span>
                <p className="font-heading text-headline">
                  Hedefine giden yolda
                </p>
              </div>
              <Separator />
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[11px] text-muted-foreground">
                  text-title · Bricolage Grotesque 600
                </span>
                <p className="font-heading text-title">Deneme analizi</p>
              </div>
              <Separator />
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[11px] text-muted-foreground">
                  Gövde · Geist 400/500
                </span>
                <p className="max-w-prose text-base">
                  Pijamalı hasta yağız şoföre çabucak güvendi. Türkçe gliflerin
                  tamamı — ğ, ş, ı, İ, ö, ü, ç — her ağırlıkta sorunsuz.
                </p>
                <p className="max-w-prose text-sm text-muted-foreground">
                  İkincil metin muted-foreground ile yazılır; açıklamalar ve
                  tarih gibi yardımcı bilgiler için.
                </p>
              </div>
              <Separator />
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[11px] text-muted-foreground">
                  Sayılar · Geist Mono / tabular-nums
                </span>
                <p className="font-mono text-lg tabular-nums">
                  48,75 net · 876. sıra · 93 puan
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ---------------------------- Bileşenler --------------------------- */}
        <section className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Sistem"
            title="Bileşenler"
            description="Uygulama genelinde kullanılacak shadcn/ui seti — marka tokenlarıyla, iki modda da."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Düğmeler</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button>Koçluğa başla</Button>
                  <Button variant="secondary">Programım</Button>
                  <Button variant="outline">Denemeler</Button>
                  <Button variant="ghost">Geç</Button>
                  <Button variant="destructive">Sil</Button>
                  <Button variant="link">Detay</Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="lg">Büyük</Button>
                  <Button size="sm">Küçük</Button>
                  <Button size="xs">Mini</Button>
                  <Button disabled>Devre dışı</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Rozetler</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2">
                <Badge>Yeni</Badge>
                <Badge variant="secondary">TYT</Badge>
                <Badge variant="outline">Haftalık</Badge>
                <Badge variant="destructive">Eksik konu</Badge>
                <Badge className="bg-gold text-gold-foreground">
                  <StarIcon className="fill-current" /> Derece
                </Badge>
                <Badge className="bg-success/10 text-success">+4,75 net</Badge>
                <Badge className="bg-info/10 text-info">Bilgi</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Form alanları</CardTitle>
                <CardDescription>Durumlar: normal, hatalı, kapalı</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Field>
                  <FieldLabel htmlFor="ornek-ad">Ad Soyad</FieldLabel>
                  <Input id="ornek-ad" placeholder="Örn. Ayşe Yılmaz" />
                  <FieldDescription>
                    Velinle paylaşılacak raporda görünür.
                  </FieldDescription>
                </Field>
                <Field data-invalid>
                  <FieldLabel htmlFor="ornek-tel">Telefon</FieldLabel>
                  <Input
                    id="ornek-tel"
                    aria-invalid
                    defaultValue="0532 123"
                    inputMode="tel"
                  />
                  <FieldError>Telefon numarası eksik görünüyor.</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="ornek-sinav">Sınav</FieldLabel>
                  <SelectDemo />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ornek-kapali">Koç kodu</FieldLabel>
                  <Input id="ornek-kapali" disabled placeholder="Kayıt kapalı" />
                </Field>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Sekmeler ve katmanlar</CardTitle>
                <CardDescription>
                  Diyalog, panel, menü, ipucu ve bildirim
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <TabsDemo />
                <div className="flex flex-wrap items-center gap-2">
                  <DialogDemo />
                  <SheetDemo />
                  <DropdownDemo />
                  <ToastDemo />
                  <TooltipDemo />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Tablo</CardTitle>
                <CardDescription>Son denemeler</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deneme</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                      <TableHead className="text-right">Değişim</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DENEME_ROWS.map((row) => (
                      <TableRow key={row.name}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.date}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {row.net}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium tabular-nums",
                            row.up ? "text-success" : "text-destructive"
                          )}
                        >
                          {row.delta}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Avatar ve iskelet</CardTitle>
                <CardDescription>Yükleme durumları</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {["AH", "RÇ", "YV"].map((initial) => (
                      <Avatar key={initial} className="ring-2 ring-card">
                        <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                          {initial}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Koç + öğrenciler
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ------------------------- KPI + Grafik ---------------------------- */}
        <section className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Veri"
            title="KPI kutuları ve net grafiği"
            description="Öğrenci panosunun dili: sayı Geist/Bricolage, artış yeşil, düşüş kırmızı, son deneme altın."
          />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Toplam Net"
              value="48,75"
              delta={3.75}
              hint="Son deneme · TYT"
            />
            <StatTile
              label="Deneme Sayısı"
              value="12"
              delta={2}
              hint="Bu ay"
            />
            <StatTile
              label="Çalışma"
              value="26,5 sa"
              delta={-1.5}
              deltaSuffix=" sa"
              hint="Geçen haftaya göre"
            />
            <StatTile label="Seri" value="18 gün" delta={0} hint="Günlük giriş" />
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Toplam net — son 8 deneme</CardTitle>
                <CardDescription>
                  Statik önizleme; uygulamada Recharts ile çizilecek
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NetChart />
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Ders bazında net</CardTitle>
                <CardDescription>Ders paleti iş başında</CardDescription>
              </CardHeader>
              <CardContent>
                <SubjectBars />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ----------------------------- Yorumlar ---------------------------- */}
        <section className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Sosyal kanıt"
            title="Öğrenciler ne diyor?"
            description="Gerçek yorumlar — Gigbi profilinden, izinle. Sitede ad + soyadın ilk harfi kullanılır."
          />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <span className="font-heading text-3xl font-bold tabular-nums">
              5,0
            </span>
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
                {coachProfile.stats.reviewCount} yorum · KPSS / YKS / LGS
              </span>
            </div>
            <Separator className="hidden h-8 sm:block" orientation="vertical" />
            <div className="flex flex-wrap gap-1.5">
              {coachProfile.credentials.slice(0, 3).map((credential) => (
                <Badge key={credential} variant="secondary">
                  {credential}
                </Badge>
              ))}
            </div>
            <Button
              variant="link"
              size="sm"
              className="ml-auto"
              render={
                <a
                  href={coachProfile.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              Gigbi&apos;de doğrula
              <ExternalLinkIcon data-icon="inline-end" />
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featuredTestimonials.slice(0, 3).map((testimonial) => (
              <TestimonialCard
                key={testimonial.displayName}
                testimonial={testimonial}
              />
            ))}
          </div>
          {/* Sevgi duvarı teaser */}
          <div className="relative -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex w-max gap-3 pb-1">
              {wallOfLoveTeasers.map((teaser) => (
                <div
                  key={teaser.displayName}
                  className="flex w-56 shrink-0 flex-col gap-1 rounded-lg bg-muted/60 p-3"
                >
                  <span className="text-xs font-medium">{teaser.displayName}</span>
                  <span className="text-xs text-muted-foreground">
                    “{teaser.preview}”
                  </span>
                </div>
              ))}
              <div className="flex w-40 shrink-0 items-center justify-center rounded-lg bg-primary/8 p-3 text-center text-xs font-medium text-primary">
                +{coachProfile.stats.reviewCount - featuredTestimonials.length}{" "}
                yorum daha →
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------- Karar noktaları ------------------------ */}
        <section className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Onay"
            title="Kurucunun karar vereceği noktalar"
          />
          <div className="grid gap-3 md:grid-cols-2">
            {[
              {
                title: "Logo yönü",
                body: "Mevcut işaret: yükselen netler + altın kıvılcım. İstenirse alternatif eskizler: alev formu, DR monogramı veya baykuş benzeri bir maskot.",
              },
              {
                title: "Slogan",
                body: "Öneri: “Netlerini artır, hedefine ulaş.” ana slogan; “Hedefine giden yolda ruhun yanında.” duygusal destek metni olarak kalsın.",
              },
              {
                title: "Maskot",
                body: "Baykuş Mentorluk tarzı bir maskot ister miyiz? Kıvılcım karakterleştirilebilir (küçük altın ruh). Faz 2 illüstrasyon işi.",
              },
              {
                title: "Varsayılan tema",
                body: "Şu an sistem temasını izliyor. Öğrenciler çoğunlukla gece çalıştığı için uygulama tarafında koyu başlangıç da düşünülebilir.",
              },
            ].map((decision, index) => (
              <div
                key={decision.title}
                className="flex gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">{decision.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {decision.body}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
          <Logo size={22} />
          <span className="text-xs text-muted-foreground">
            © 2026 Derecenin Ruhu
          </span>
        </div>
      </footer>
    </div>
  );
}
