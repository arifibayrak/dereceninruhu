/**
 * Pure helpers for resolving an enrollment's subjects from the seeded template.
 * The one engine serves LGS/YKS/KPSS: track filtering (YKS alan) + scored/child
 * partition (GEO/MANTIK log separately, MAT is scored). No DB access here.
 */

export type SubjectRow = {
  id: number;
  examSectionId: number;
  code: string;
  name: string;
  parentSubjectId: number | null;
  isScored: boolean;
  /** JSON-encoded string[] or null (null = all tracks). */
  trackCodes: string | null;
  officialQuestionCount: number | null;
  sortOrder: number;
  chartColor: string | null;
};

/**
 * Bölümün RESMÎ sınav süresi (dakika), bölüm koduna göre.
 *
 * `exam_sections.duration_minutes` sütunu var ama hiçbir kayıtta dolu değil;
 * süre bir kurum bilgisi olduğu için burada, kodun yanında durur — böylece
 * veri tabanına dokunmadan güncellenir. Birleşik oturumda (KPSS GY+GK)
 * bölümlerin süreleri TOPLANIR: 65 + 65 = 130 dk.
 */
const OFFICIAL_SECTION_MINUTES: Record<string, number> = {
  TYT: 165,
  AYT: 180,
  YDT: 120,
  KPSS_GY: 65,
  KPSS_GK: 65,
  LGS_SOZEL: 75,
  LGS_SAYISAL: 80,
};

/** Verilen bölümlerin toplam resmî süresi; hiçbiri tanınmıyorsa null. */
export function officialDurationMinutes(sectionCodes: string[]): number | null {
  let total = 0;
  for (const code of sectionCodes) {
    const m = OFFICIAL_SECTION_MINUTES[code];
    if (m) total += m;
  }
  return total > 0 ? total : null;
}

/** Süre alanının hızlı seçim düğmesi. */
export type DurationPreset = { minutes: number; label: string };

/** Branşta tipik çözüm süreleri — tek dersin 10–40 soruluk testi. */
const BRANCH_PRESETS = [15, 20, 30, 40, 60];
/** Bölümü tanınmayan tam denemede makul aralık. */
const FALLBACK_FULL_PRESETS = [60, 90, 120, 150, 180];

/**
 * Süre alanının hazır seçenekleri — öğrenci klavye açmadan tek dokunuşla
 * girsin diye. Tam denemede resmî süre ilk sırada ("Resmî") ve ondan geriye
 * 15'er dakikalık gerçekçi adımlar gelir (deneme erken bitirilir); branşta
 * sabit kısa süreler.
 */
export function durationPresets(opts: {
  scope: "full" | "branch";
  sectionCodes: string[];
}): DurationPreset[] {
  if (opts.scope === "branch") {
    return BRANCH_PRESETS.map((minutes) => ({
      minutes,
      label: `${minutes} dk`,
    }));
  }
  const official = officialDurationMinutes(opts.sectionCodes);
  if (!official) {
    return FALLBACK_FULL_PRESETS.map((minutes) => ({
      minutes,
      label: `${minutes} dk`,
    }));
  }
  const presets: DurationPreset[] = [
    { minutes: official, label: `${official} dk · Resmî` },
  ];
  for (const step of [15, 30, 45]) {
    const minutes = official - step;
    if (minutes > 0) presets.push({ minutes, label: `${minutes} dk` });
  }
  return presets;
}

/**
 * Şablonun bölümleri TEK oturumda çözülüyorsa birleşik deneme adı, değilse null.
 *
 * KPSS'de Genel Yetenek ve Genel Kültür aynı oturumun iki kitapçığıdır; iki ayrı
 * deneme kaydı yerine tek "KPSS Denemesi" olarak girilir (toplam net = GY + GK).
 * YKS'de TYT ve AYT ayrı oturumlardır — birleştirilmez.
 */
export function combinedMockLabel(templateCode: string): string | null {
  return templateCode === "KPSS" ? "KPSS Denemesi" : null;
}

/** Tek bir sınav kapsamı: şablon + (varsa) alan. */
export type ExamScope = {
  examTemplateId: number;
  trackCode: string | null;
};

/**
 * Kaydın sınav kapsamları — ikinci sınav varsa İKİ, yoksa TEK eleman.
 *
 * Bir öğrenci aynı dönemde iki sınava hazırlanabilir (ör. Ekim'de ortaöğretim
 * KPSS, ardından 2027 YKS). Ders/bölüm çözen her sorgu buradan geçer, böylece
 * program ızgarası, soru takibi ve deneme girişi iki sınavın derslerini birden
 * gösterir. Aynı şablon iki kez seçilmişse sessizce tekilleştirilir.
 */
export function examScopesOf(e: {
  examTemplateId: number;
  trackCode: string | null;
  secondaryExamTemplateId?: number | null;
  secondaryTrackCode?: string | null;
}): ExamScope[] {
  const scopes: ExamScope[] = [
    { examTemplateId: e.examTemplateId, trackCode: e.trackCode },
  ];
  if (
    e.secondaryExamTemplateId != null &&
    e.secondaryExamTemplateId !== e.examTemplateId
  ) {
    scopes.push({
      examTemplateId: e.secondaryExamTemplateId,
      trackCode: e.secondaryTrackCode ?? null,
    });
  }
  return scopes;
}

/**
 * Rozet metinleri — çift sınavlı kayıtta iki eleman ("YKS · Sayısal", "KPSS").
 * Kokpit ve öğrenci başlığı aynı listeyi basar.
 */
export function examLabels(e: {
  examCode: string;
  trackName: string | null;
  secondaryExamCode?: string | null;
  secondaryTrackName?: string | null;
}): string[] {
  const label = (code: string, track: string | null | undefined) =>
    track ? `${code} · ${track}` : code;
  const out = [label(e.examCode, e.trackName)];
  if (e.secondaryExamCode) {
    out.push(label(e.secondaryExamCode, e.secondaryTrackName));
  }
  return out;
}

export function parseTrackCodes(raw: string | null): string[] | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as string[]) : null;
  } catch {
    return null;
  }
}

/** null trackCodes → applies to all tracks; otherwise must include trackCode. */
export function subjectAppliesToTrack(
  subject: Pick<SubjectRow, "trackCodes">,
  trackCode: string | null,
): boolean {
  const codes = parseTrackCodes(subject.trackCodes);
  if (!codes) return true;
  return trackCode != null && codes.includes(trackCode);
}

/** Subjects visible for an enrollment's track, in display order. */
export function filterSubjectsForTrack(
  subjects: SubjectRow[],
  trackCode: string | null,
): SubjectRow[] {
  return subjects
    .filter((s) => subjectAppliesToTrack(s, trackCode))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Only scored subjects (mock results / net charts reference these). */
export function scoredSubjects(subjects: SubjectRow[]): SubjectRow[] {
  return subjects.filter((s) => s.isScored);
}

/** Loggable subjects for soru takibi — includes non-scored children (GEO/MANTIK). */
export function loggableSubjects(subjects: SubjectRow[]): SubjectRow[] {
  return [...subjects].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function childrenOf(
  subjects: SubjectRow[],
  parentId: number,
): SubjectRow[] {
  return subjects.filter((s) => s.parentSubjectId === parentId);
}

/** Map a child (or scored) subject id to the scored ancestor it rolls up into. */
export function scoredAncestorId(
  subjects: SubjectRow[],
  subjectId: number,
): number | null {
  const byId = new Map(subjects.map((s) => [s.id, s]));
  let cur = byId.get(subjectId);
  const seen = new Set<number>();
  while (cur && !seen.has(cur.id)) {
    if (cur.isScored) return cur.id;
    seen.add(cur.id);
    cur = cur.parentSubjectId ? byId.get(cur.parentSubjectId) : undefined;
  }
  return null;
}
