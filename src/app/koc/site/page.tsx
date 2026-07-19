import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  countActiveStudents,
  getCohort,
  listAllFaqs,
  listAllPackages,
  listAllTestimonials,
} from "@/db/queries/cms";
import { getViewer } from "@/lib/session";
import {
  CohortSettingsForm,
  type CohortSettingsValues,
} from "@/components/app/cohort-settings-form";
import {
  FaqManager,
  PackageManager,
  TestimonialManager,
} from "@/components/app/content-managers";
import { SectionHeading } from "@/components/brand/section-heading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = { title: "Site İçeriği" };

function parseJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string");
  } catch {
    return raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export default async function IcerikPage() {
  // Pazarlama içeriği tek markadır (Ahmet Hakan) — yalnız yönetici düzenler.
  const viewer = await getViewer();
  if (viewer?.role !== "admin") redirect("/koc");

  const [testimonialRows, packageRows, faqRows, cohort, realActive] =
    await Promise.all([
      listAllTestimonials(),
      listAllPackages(),
      listAllFaqs(),
      getCohort(),
      countActiveStudents(),
    ]);

  const cohortValues: CohortSettingsValues = {
    donemLabel: cohort.donemLabel,
    displayCapacity: cohort.displayCapacity,
    displayFilled: cohort.displayFilled,
    closesOn: cohort.closesOn,
    status: cohort.status,
    waitlistOpen: cohort.waitlistOpen,
    scarcityVisible: cohort.scarcityVisible,
  };

  return (
    <>
      <SectionHeading
        eyebrow="Pazarlama"
        title="Site içeriği"
        description="Ana sayfa, fiyatlar, başarılar ve SSS sayfalarını besleyen içerikler — değişiklikler anında yayına yansır."
      />

      <Tabs defaultValue="yorumlar" className="gap-6">
        <TabsList className="w-full max-w-full justify-start overflow-x-auto sm:w-fit">
          <TabsTrigger value="donem">Dönem</TabsTrigger>
          <TabsTrigger value="yorumlar">
            Yorumlar ({testimonialRows.length})
          </TabsTrigger>
          <TabsTrigger value="paketler">
            Paketler ({packageRows.length})
          </TabsTrigger>
          <TabsTrigger value="sss">SSS ({faqRows.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="donem">
          <CohortSettingsForm
            initial={cohortValues}
            realActiveStudents={realActive}
          />
        </TabsContent>

        <TabsContent value="yorumlar">
          <TestimonialManager
            rows={testimonialRows.map((r) => ({
              id: r.id,
              studentName: r.studentName,
              exam: r.exam,
              result: r.result,
              quote: r.quote,
              sortOrder: r.sortOrder,
              isActive: r.isActive,
            }))}
          />
        </TabsContent>

        <TabsContent value="paketler">
          <PackageManager
            rows={packageRows.map((r) => ({
              id: r.id,
              name: r.name,
              priceKurus: r.priceKurus,
              period: r.period,
              features: parseJsonArray(r.features),
              sortOrder: r.sortOrder,
              isActive: r.isActive,
            }))}
          />
        </TabsContent>

        <TabsContent value="sss">
          <FaqManager
            rows={faqRows.map((r) => ({
              id: r.id,
              question: r.question,
              answer: r.answer,
              sortOrder: r.sortOrder,
              isActive: r.isActive,
            }))}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
