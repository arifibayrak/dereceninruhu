import {
  AwardIcon,
  ClockIcon,
  HeartHandshakeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";

import { CoachApplicationForm } from "@/components/marketing/coach-application-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildMetadata } from "@/lib/seo";

// Statik sayfa — D1 okumaz; form gönderimi Server Action ile çalışır.

export const metadata = buildMetadata({
  title: "Koç Başvurusu",
  description:
    "Derecenin Ruhu koç kadrosuna katıl. Derece yapmış, öğrencisini gerçekten önemseyen seçkin koçlarla birebir çalışıyoruz. Başvurunu bırak, tanışalım.",
  path: "/koc-basvuru",
});

const BENEFITS = [
  {
    icon: UsersIcon,
    title: "Hazır öğrenci akışı",
    body: "Öğrenci bulma derdi sende değil — pazarlamayı biz yapıyoruz, sana uygun öğrenciler eşleştirilir.",
  },
  {
    icon: SparklesIcon,
    title: "AI destekli koçluk paneli",
    body: "Haftalık program, soru takibi, deneme analizi ve görüşme transkriptinden öneri — hepsi tek panelde.",
  },
  {
    icon: ClockIcon,
    title: "Esnek ve uzaktan",
    body: "Saatlerini kendin belirle; görüşmeler online. Nerede olursan ol koçluk yapabilirsin.",
  },
  {
    icon: WalletIcon,
    title: "Adil kazanç, otomatik muhasebe",
    body: "Şeffaf gelir paylaşımı; faturalama ve tahsilat takibi sistemde otomatik ilerler.",
  },
] as const;

const CRITERIA = [
  {
    icon: AwardIcon,
    title: "Alanında güçlü",
    body: "Kendi sınavında derece/başarı yapmış ya da alanında kanıtlanmış bir birikimin var.",
  },
  {
    icon: HeartHandshakeIcon,
    title: "Öğrencisini önemseyen",
    body: "İşi sayıya indirgemeyen; birebir ilgiyi ve sürekliliği önceleyen bir yaklaşım.",
  },
  {
    icon: TrendingUpIcon,
    title: "Ölçerek ilerleyen",
    body: "Veriyle çalışmayı seven: net trendi, eksik konu, soru hedefi — sistemli takip.",
  },
] as const;

export default function KocBasvuruPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-10 sm:px-6 md:py-16">
      <section className="relative flex flex-col items-start gap-4">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/3 h-64 w-[min(30rem,90vw)] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute top-4 right-[10%] size-32 rounded-full bg-gold/15 blur-2xl" />
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-gold" />
          Ekip · Seçkin koç kadrosu
        </span>
        <h1 className="font-heading text-headline max-w-2xl text-balance">
          Kadromuza <span className="text-primary">katıl</span>
          <span className="text-gold">.</span>
        </h1>
        <p className="max-w-xl text-base text-pretty text-muted-foreground">
          Derecenin Ruhu&apos;nda koç kadrosunu özenle ve seçici kuruyoruz —
          çünkü kalite, kimi kadroya aldığımızla başlıyor. Kendini bu yolun
          parçası olarak görüyorsan, tanışalım.
        </p>
      </section>

      {/* Koça sunduklarımız (kazanımlar) */}
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-2xl font-semibold text-balance">
          Koçlarımıza ne sunuyoruz?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="flex flex-col gap-2 rounded-2xl bg-card p-5 ring-1 ring-foreground/10"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <b.icon className="size-5" />
              </span>
              <span className="text-sm font-semibold">{b.title}</span>
              <span className="text-sm text-pretty text-muted-foreground">
                {b.body}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        {/* Sol: aradığımız nitelikler + güven */}
        <div className="flex flex-col gap-4">
          <ol className="flex flex-col gap-3">
            {CRITERIA.map((c) => (
              <li
                key={c.title}
                className="flex items-start gap-3.5 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <c.icon className="size-5" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{c.title}</span>
                  <span className="text-sm text-pretty text-muted-foreground">
                    {c.body}
                  </span>
                </div>
              </li>
            ))}
          </ol>

          <div className="flex flex-col gap-3 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <ShieldCheckIcon className="size-4" />
              Her başvuru tek tek, yönetici ekip tarafından değerlendirilir
            </span>
          </div>
        </div>

        {/* Sağ: başvuru formu */}
        <Card>
          <CardHeader>
            <CardTitle>Başvuru formu</CardTitle>
          </CardHeader>
          <CardContent>
            <CoachApplicationForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
