import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  countActiveStudents,
  getCoachProfileRow,
  getCohort,
  listAllFaqs,
  listAllPackages,
  listAllTestimonials,
} from "@/db/queries/cms";
import { getViewer } from "@/lib/session";
import { coachContent } from "@/db/seed/cms-content";
import {
  CoachProfileForm,
  type CoachProfileValues,
} from "@/components/app/coach-profile-form";
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

  const [testimonialRows, packageRows, faqRows, profileRow, cohort, realActive] =
    await Promise.all([
      listAllTestimonials(),
      listAllPackages(),
      listAllFaqs(),
      getCoachProfileRow(),
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

  const profile: CoachProfileValues = profileRow
    ? {
        id: profileRow.id,
        displayName: profileRow.displayName,
        bio: profileRow.bio ?? "",
        photoUrl: profileRow.photoUrl ?? "",
        subjects: parseJsonArray(profileRow.subjects),
        achievements: parseJsonArray(profileRow.achievements),
        isActive: profileRow.isActive,
      }
    : {
        // Profil henüz yok — seed içeriğiyle ön dolu form; kaydedince oluşur.
        id: null,
        displayName: coachContent.displayName,
        bio: coachContent.bio,
        photoUrl: "",
        subjects: [...coachContent.subjects],
        achievements: [...coachContent.credentials],
        isActive: true,
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
          <TabsTrigger value="profil">Koç profili</TabsTrigger>
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

        <TabsContent value="profil">
          <CoachProfileForm profile={profile} />
        </TabsContent>
      </Tabs>
    </>
  );
}
