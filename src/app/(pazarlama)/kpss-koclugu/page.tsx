import { ExamLanding } from "@/components/marketing/exam-landing";
import { EXAM_LANDING } from "@/lib/exam-landing-content";
import { buildMetadata } from "@/lib/seo";

// ExamLanding D1 (paket/SSS/dönem) okur → istek başına render.
export const dynamic = "force-dynamic";

const config = EXAM_LANDING.KPSS;

export const metadata = buildMetadata({
  title: config.metaTitle,
  description: config.metaDescription,
  path: config.slug,
});

export default function KpssKoclukPage() {
  return <ExamLanding config={config} />;
}
