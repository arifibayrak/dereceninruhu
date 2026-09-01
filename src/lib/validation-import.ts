import { z } from "zod";

import { isTrackOfExam } from "@/lib/tracks";
import { examCodeSchema, phoneSchema, trackCodeSchema } from "@/lib/validation";

/** CSV `status` sözlüğü → öğrenci durumu. */
export const rosterStatusSchema = z
  .enum(["aktif", "pasif", "mezun"])
  .default("aktif");
export type RosterStatus = z.infer<typeof rosterStatusSchema>;

/** Tek bir kadro satırı (CSV'den normalize edilmiş değerlerle). */
export const rosterRowSchema = z
  .object({
    fullName: z.string().trim().min(2, "Ad soyad gerekli.").max(120),
    phone: phoneSchema,
    examCode: examCodeSchema,
    trackCode: trackCodeSchema.optional(),
    targetText: z.string().trim().max(200).optional(),
    grade: z.string().trim().max(40).optional(),
    status: rosterStatusSchema,
  })
  .refine((v) => v.examCode !== "YKS" || !!v.trackCode, {
    message: "YKS için alan (SAY/EA/SOZ) gerekli.",
    path: ["trackCode"],
  })
  /*
   * KPSS düzeyi (LISANS/ONLISANS/ORTAOGRETIM) CSV'de İSTEĞE BAĞLI: eski dosyalar
   * bu sütunu taşımıyor, içe aktarım onlar yüzünden patlamamalı. Yazıldıysa
   * doğru sınava ait olması aranır — koç düzeyi sonradan kokpitten seçer.
   */
  .refine((v) => !v.trackCode || isTrackOfExam(v.examCode, v.trackCode), {
    message: "Bölüm kodu bu sınava ait değil.",
    path: ["trackCode"],
  });
export type RosterRowInput = z.infer<typeof rosterRowSchema>;

/** İçe aktarım isteği — önce dry-run (commit:false), sonra commit:true. */
export const importRosterSchema = z.object({
  csv: z.string().min(1, "CSV boş."),
  commit: z.boolean().default(false),
});

/** CSV durum kelimesi → students.status enum. */
export function mapRosterStatus(
  s: RosterStatus,
): "active" | "inactive" | "alumni" {
  if (s === "pasif") return "inactive";
  if (s === "mezun") return "alumni";
  return "active";
}
