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
 * Şablonun bölümleri TEK oturumda çözülüyorsa birleşik deneme adı, değilse null.
 *
 * KPSS'de Genel Yetenek ve Genel Kültür aynı oturumun iki kitapçığıdır; iki ayrı
 * deneme kaydı yerine tek "KPSS Denemesi" olarak girilir (toplam net = GY + GK).
 * YKS'de TYT ve AYT ayrı oturumlardır — birleştirilmez.
 */
export function combinedMockLabel(templateCode: string): string | null {
  return templateCode === "KPSS" ? "KPSS Denemesi" : null;
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
