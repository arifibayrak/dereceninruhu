import {
  AudioLinesIcon,
  CalendarRangeIcon,
  LockKeyholeIcon,
  MessageCircleIcon,
  RadarIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";

import { SectionHeading } from "@/components/brand/section-heading";
import { cn } from "@/lib/utils";

/**
 * "AI destekli sistem" pazarlama bölümü.
 *
 * KART GÖVDELERİ BİLEREK PROP DEĞİL. Çağıran sayfa yalnız kartları seçer/sıralar
 * ve çevresindeki başlığı değiştirir; iddiaların metni tek yerde durur. AI
 * iddiaları sitenin en riskli metni — üç sayfa kendi cümlesini kurarsa biri
 * eninde sonunda abartır (aynı disiplin: `src/lib/coaching-includes.ts`).
 *
 * DOĞRULUK SINIRLARI (metin bunları ihlal edemez):
 * - Model veritabanına yazmaz; önerir, insan onaylar (`src/lib/ai/agent-tools.ts`,
 *   `src/actions/_transcripts-core.ts`).
 * - Canlı transkriptte ses VARSAYILAN olarak yüklenmez; kayıt yükleme yolu ayrı
 *   KVKK onayıyla sunucuya gider (`src/components/app/live-transcribe.tsx`).
 *   "Ses asla yüklenmez" YAZILAMAZ.
 * - `src/lib/insights.ts` (otomatik içgörüler), koç notu → görev ayrıştırma ve
 *   net motoru deterministik; AI diye etiketlenemez.
 */

export type AiSystemKey =
  | "gorusme"
  | "program"
  | "radar"
  | "gizlilik"
  | "asistan";

type AiSystemCard = {
  icon: typeof AudioLinesIcon;
  title: string;
  body: string;
  badge: string;
};

const AI_SYSTEM_CARDS: Record<AiSystemKey, AiSystemCard> = {
  gorusme: {
    icon: AudioLinesIcon,
    title: "Görüşme kendi notunu tutar",
    body: "Birebir görüşme yazıya çevrilir; konuşulanlardan çözülen sorular, deneme sonuçları, biten konular ve haftaya yapılacaklar öneri olarak çıkarılır. Her önerinin altında konuşmadan birebir alıntı ve bir güven yüzdesi durur.",
    badge: "Koç onaylamadan kaydedilmez",
  },
  program: {
    icon: CalendarRangeIcon,
    title: "Haftalık program taslak olarak gelir",
    body: "Zayıf konuların, hedefin, son denemelerin, elindeki kaynaklar ve son dört haftada zaten çalıştıkların dikkate alınarak ders × konu taslağı çıkarılır. Yalnızca işaretlenen konular programa yazılır.",
    badge: "Seçim koçun ve senin",
  },
  radar: {
    icon: RadarIcon,
    title: "Kimse gözden kaçmaz",
    body: "Koçun, öğrenci listesine doğrudan soru sorabilir: neti gerileyen kim, kaç gündür giriş yapmayan var. Yanıt sistemdeki veriden üretilir; veriyi değiştirecek her işlem koçun onayına düşer ve kayda geçer.",
    badge: "Her sorgu kayıtlı",
  },
  gizlilik: {
    icon: LockKeyholeIcon,
    title: "Ses koçun cihazından çıkmaz",
    body: "Canlı transkriptte konuşma, koçun kendi bilgisayarında yazıya çevrilir; varsayılan olarak ses sunucuya yüklenmez. Bir kayıt yüklenerek işlenecekse bu ayrı bir onay kutusuyla açıkça belirtilir.",
    badge: "KVKK · açık onay",
  },
  asistan: {
    icon: MessageCircleIcon,
    title: "Kendi verinle konuşabilirsin",
    body: "Öğrenci, yalnız kendi takip verisi üzerinden asistana soru sorabilir: hangi derste geriledim, bu hafta ne kadar çözdüm. Net ya da sıralama tahmini yapmaz; kaygı, sağlık ve aile konuları koçun ve uzmanın işidir.",
    badge: "Sadece senin verin",
  },
};

const DEFAULT_ITEMS: readonly AiSystemKey[] = [
  "gorusme",
  "program",
  "radar",
  "gizlilik",
];

const DEFAULT_TITLE = "Koçun tek başına değil";

const DEFAULT_DESCRIPTION =
  "Derecenin Ruhu'nda yapay zekâ koçunun yerine geçmez; koçunun not tutma, taslak çıkarma ve takip işini üstlenir — ki görüşmedeki 45 dakika tamamen sana kalsın.";

const DEFAULT_FOOTNOTE =
  "Modelin veritabanına yazma yetkisi yoktur. Her öneri bir insanın onayından geçer ve koçun elle yaptığında çalışan aynı yolla kaydedilir.";

type AiSystemSectionProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  /** Gösterilecek kartlar ve sırası. Varsayılan: 4'lü set. */
  items?: readonly AiSystemKey[];
  /** Alt güvence satırı; `null` ile gizlenir. */
  footnote?: string | null;
  className?: string;
};

export function AiSystemSection({
  eyebrow = "Sistem",
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  items = DEFAULT_ITEMS,
  footnote,
  className,
}: AiSystemSectionProps) {
  const cards = items.map((key) => AI_SYSTEM_CARDS[key]);

  return (
    <section className={cn("flex flex-col items-center gap-8", className)}>
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        align="center"
      />

      {/* İlke — sayfanın her yerinde birebir aynı cümle. */}
      <span className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-3.5 py-1.5 text-xs font-semibold text-gold-foreground ring-1 ring-gold/25 dark:text-gold">
        <SparklesIcon aria-hidden className="size-3.5" />
        AI önerir, koç onaylar
      </span>

      {/*
        `items-center` grid'i shrink-wrap etmesin diye `w-full` şart
        (bkz. AGENTS.md düzen notları / diğer pazarlama bölümleri).
      */}
      <div
        className={cn(
          "mx-auto grid w-full gap-4",
          cards.length >= 5
            ? "max-w-6xl sm:grid-cols-2 lg:grid-cols-3"
            : cards.length === 3
              ? "max-w-5xl sm:grid-cols-3"
              : "max-w-4xl sm:grid-cols-2",
        )}
      >
        {cards.map((card) => (
          <div
            key={card.title}
            className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 text-center ring-1 ring-foreground/10"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <card.icon className="size-5" />
            </span>
            <h3 className="font-heading text-base font-semibold text-balance">
              {card.title}
            </h3>
            <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
              {card.body}
            </p>
            <span className="mt-auto inline-flex items-center gap-1.5 rounded-full bg-info/10 px-2.5 py-1 text-[11px] font-semibold text-info">
              <ShieldCheckIcon aria-hidden className="size-3" />
              {card.badge}
            </span>
          </div>
        ))}
      </div>

      {footnote !== null && (
        <p className="max-w-prose text-center text-xs leading-relaxed text-pretty text-muted-foreground">
          {footnote ?? DEFAULT_FOOTNOTE}
        </p>
      )}
    </section>
  );
}
