import { CtaBand } from "@/components/marketing/cta-band";
import { ExamCountdown } from "@/components/marketing/exam-countdown";
import { SectionHeading } from "@/components/brand/section-heading";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Sayaç — Sınava Kaç Gün Kaldı?",
  description:
    "LGS, YKS ve KPSS (Lisans, Ön Lisans, Ortaöğretim) için sınav geri sayımı. Sınava kaç gün kaldığını canlı takip et.",
  path: "/sayac",
});

export default function SayacPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-10 sm:px-6 md:gap-24 md:py-16">
      <section className="flex flex-col gap-8">
        <SectionHeading
          eyebrow="Sayaç"
          title="Sınava kaç gün kaldı?"
          description="LGS, YKS ve KPSS'nin üç kademesi için gün gün geri sayım."
          align="center"
        />
        <ExamCountdown />
        <p className="mx-auto max-w-prose text-center text-xs text-muted-foreground">
          Tarihler ÖSYM/MEB takvimine göredir. KPSS 2026 tarihleri kesindir; LGS
          ve YKS&apos;nin 2027 tarihleri henüz resmi olarak açıklanmadığından
          &ldquo;tahmini&rdquo; olarak gösterilir ve takvim yayımlanınca
          güncellenir.
        </p>
      </section>

      <CtaBand />
    </div>
  );
}
