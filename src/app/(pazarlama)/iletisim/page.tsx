import {
  CalendarCheckIcon,
  MapPinIcon,
  MessageCircleIcon,
  PhoneIcon,
  ShieldCheckIcon,
  StarIcon,
} from "lucide-react";

import { coachStats, ratingLabel } from "@/db/seed/cms-content";
import { LeadForm } from "@/components/marketing/lead-form";
import { CalBooking } from "@/components/marketing/cal-booking";
import { JsonLd } from "@/components/seo/json-ld";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/schema";

// Statik sayfa — D1 okumaz; form gönderimi Server Action ile çalışır.

export const metadata = buildMetadata({
  title: "Ücretsiz Ön Görüşme",
  description:
    "Derecenin Ruhu ile ücretsiz ön görüşme planla: hedefini ve seviyeni konuşalım, sana özel yol haritanı çıkaralım. Ödeme yükümlülüğü yok.",
  path: "/iletisim",
});

const STEPS = [
  {
    icon: MessageCircleIcon,
    title: "Formu doldur",
    body: "Adını, numaranı ve sınavını bırak — 1 dakikanı alır.",
  },
  {
    icon: PhoneIcon,
    title: "Aynı gün dönüş",
    body: "Genellikle aynı gün WhatsApp veya telefonla ulaşırız.",
  },
  {
    icon: CalendarCheckIcon,
    title: "Ücretsiz ön görüşme",
    body: "20-30 dakikada hedefini, seviyeni ve yol haritanı konuşuruz.",
  },
] as const;

export default function IletisimPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-10 sm:px-6 md:py-16">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Ana Sayfa", path: "/" },
          { name: "Ücretsiz Ön Görüşme", path: "/iletisim" },
        ])}
      />
      <section className="relative flex flex-col items-center gap-4 text-center">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/3 h-64 w-[min(30rem,90vw)] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute top-4 right-[10%] size-32 rounded-full bg-gold/15 blur-2xl" />
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-gold" />
          İlk adım
        </span>
        <h1 className="font-heading text-headline max-w-2xl text-balance">
          Ücretsiz ön görüşmeni <span className="text-primary">planlayalım</span>
          <span className="text-gold">.</span>
        </h1>
        <p className="max-w-xl text-base text-pretty text-muted-foreground">
          Satış konuşması yok: hedefini dinler, mevcut durumunu anlar, sana
          nasıl bir yol çizeceğimizi somut olarak anlatırız. Karar tamamen
          senin.
        </p>
      </section>

      {/* 1. satır: takvim — tam genişlik (gün solda, saatler sağda) */}
      <Card>
        <CardHeader>
          <CardTitle>Takvimden 30 dk ücretsiz görüşme seç</CardTitle>
        </CardHeader>
        <CardContent>
          <CalBooking />
        </CardContent>
      </Card>

      {/* 2. satır: sol süreç + güven, sağ "biz arayalım" formu */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Sol: süreç + güven */}
        <div className="flex flex-col gap-4">
          <ol className="flex flex-col gap-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="flex items-start gap-3.5 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
              >
                <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.icon className="size-5" />
                  <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-gold-foreground">
                    {i + 1}
                  </span>
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{step.title}</span>
                  <span className="text-sm text-pretty text-muted-foreground">
                    {step.body}
                  </span>
                </div>
              </li>
            ))}
          </ol>

          <div className="flex flex-col gap-3 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <StarIcon className="size-4 fill-gold text-gold" />
              {ratingLabel} yıldız · {coachStats.reviewCount} yorum — Gigbi&apos;de
              doğrulanabilir
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPinIcon className="size-4" />
              Kartal, İstanbul — görüşmeler online yapılır
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheckIcon className="size-4" />
              Bilgilerin yalnızca ön görüşme için kullanılır
            </span>
          </div>
        </div>

        {/* Sağ: "biz arayalım" formu (alternatif) */}
        <Card>
          <CardHeader>
            <CardTitle>Ya da bilgini bırak, biz arayalım</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
