/**
 * Gerçek içerik — Ahmet Hakan Almak'ın Gigbi profilinden
 * (gigbi.com/p/ahmet-hakan-almak1723581674). Puan/yorum sayısı BURADA
 * DEĞİL — tek kaynak `@/db/seed/cms-content` (`coachStats` + `ratingLabel`);
 * burada ikinci bir kopya tutulunca rakamlar birbirinden kaçıyordu.
 * Pazarlama sitesi + /marka önizlemesi için kaynak. Şema oturunca
 * src/db/seed/* içine taşınacak (coach_profiles, testimonials).
 *
 * GİZLİLİK: Halka açık sitede ad + soyadın ilk harfi kullanılır ("Merve K.").
 */
import type { Testimonial } from "@/components/brand/testimonial-card";
import { coachStats } from "@/db/seed/cms-content";

export const coachProfile = {
  fullName: "Ahmet Hakan Almak",
  title: "Eğitim Koçu",
  location: "Kartal, İstanbul",
  bio:
    "Merhaba, ben Ahmet Hakan Almak. Marmara Hukuk Fakültesi öğrencisiyim ve aynı zamanda memurum. " +
    "Bu yıl YKS'de derece yaptım ve 876. oldum, KPSS'de ise 93 puan alarak 712. oldum. " +
    "Üç yıldır KPSS ve YKS koçluğu yapmaktayım.",
  credentials: [
    "Marmara Üniversitesi Hukuk Fakültesi",
    "YKS Türkiye 876.",
    "KPSS 93 puan — 712.",
    "3+ yıl KPSS / YKS / LGS koçluğu",
  ],
  stats: {
    exams: ["KPSS", "YKS", "LGS"] as const,
  },
  proofUrl: coachStats.proofUrl,
};

/** Öne çıkan yorumlar — tam metin, yayına hazır. */
export const featuredTestimonials: Testimonial[] = [
  {
    displayName: "Reyyan Ç.",
    exam: "KPSS",
    date: "2026-07-09",
    quote: "İlgili bir hoca, harika yönlendiriyor. Herkese tavsiye ederim.",
  },
  {
    displayName: "Yağmur V.",
    exam: "YKS",
    date: "2026-03-27",
    quote: "Bir koçtan çok daha fazlası; çok ilgili, çok profesyonel.",
  },
  {
    displayName: "Nisa B.",
    exam: "KPSS",
    date: "2026-04-18",
    quote: "Hakan Bey KPSS sürecinde planlı ilerlememe çok yardımcı oldu.",
  },
  {
    displayName: "Didem T.",
    exam: "LGS",
    date: "2025-10-20",
    quote: "Matematiği sevdiren bir hoca.",
  },
  {
    displayName: "Berke",
    exam: "YKS",
    date: "2026-06-14",
    quote: "Mükemmel biri; bir tek ders konusundan değil, her yönden çok iyi.",
  },
  {
    displayName: "Azra K.",
    exam: "YKS",
    date: "2025-10-13",
    quote: "Çok iyi, çok verimli ilerliyor. Tavsiye ederim.",
  },
];

/** "Sevgi duvarı" şeridi için kısa önizlemeler (kaynakta kırpılmış metinler). */
export const wallOfLoveTeasers: { displayName: string; preview: string }[] = [
  { displayName: "Merve K.", preview: "Hem motive edici hem sistemli…" },
  { displayName: "Elif D.", preview: "Sistematik bir çalışma düzeni kuruyor…" },
  { displayName: "İpek G. (veli)", preview: "Oğlum LGS hazırlık döneminde…" },
  { displayName: "Sibel K.", preview: "Ön görüşme çok güven verdi…" },
  { displayName: "Zeynep B.", preview: "Gönül rahatlığıyla tavsiye ederim…" },
  { displayName: "Şehriban U.", preview: "Bilgisiyle, enerjisiyle fark yaratan…" },
];
