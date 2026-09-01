/**
 * Seed definitions for the three exam templates (KPSS, YKS, LGS).
 * Pure data — no DB access. Upserted by natural keys (template.code,
 * section.code within template, subject.code within section) by the runner.
 *
 * Topic lists are intentionally NOT seeded yet (later phase).
 */

export interface SubjectSeed {
  code: string;
  name: string;
  /** Resmi soru sayısı (NULL where unknown / not fixed). */
  officialQuestionCount?: number;
  isScored: boolean;
  /** Parent subject code within the SAME section (GEO → MAT). */
  parentCode?: string;
  /** Track codes this subject applies to; omitted = all tracks. */
  trackCodes?: string[];
  sortOrder: number;
  /** Distinct hex per scored subject (charts). Unscored subjects: none. */
  chartColor?: string;
}

export interface SectionSeed {
  code: string;
  name: string;
  wrongPenaltyDivisor: number;
  sortOrder: number;
  subjects: SubjectSeed[];
}

export interface TrackSeed {
  code: string;
  name: string;
  sortOrder: number;
}

export interface TemplateSeed {
  code: string;
  name: string;
  tracks: TrackSeed[];
  sections: SectionSeed[];
}

export const examTemplateSeeds: TemplateSeed[] = [
  {
    code: "KPSS",
    name: "KPSS (GY-GK)",
    /*
     * KPSS'de "alan" yerine DÜZEY var: aynı GY-GK derslerini üç ayrı oturum
     * çözer. Ders listesini değiştirmediği için tüm derslerin trackCodes'u
     * boş kalır (hepsi her düzeye uygulanır) — düzey yalnız kadroyu bölmek
     * ve doğru sınav tarihini seçmek için tutulur. Etiketler `@/lib/tracks`.
     */
    tracks: [
      { code: "LISANS", name: "Lisans", sortOrder: 1 },
      { code: "ONLISANS", name: "Ön Lisans", sortOrder: 2 },
      { code: "ORTAOGRETIM", name: "Ortaöğretim", sortOrder: 3 },
    ],
    sections: [
      {
        code: "KPSS_GY",
        name: "Genel Yetenek",
        wrongPenaltyDivisor: 4,
        sortOrder: 1,
        subjects: [
          {
            code: "TUR",
            name: "Türkçe",
            officialQuestionCount: 30,
            isScored: true,
            sortOrder: 1,
            chartColor: "#E11D48",
          },
          {
            code: "PARAGRAF",
            name: "Paragraf",
            isScored: false,
            parentCode: "TUR",
            sortOrder: 2,
          },
          {
            code: "MAT",
            name: "Matematik",
            officialQuestionCount: 30,
            isScored: true,
            sortOrder: 3,
            chartColor: "#2563EB",
          },
          {
            code: "GEO",
            name: "Geometri",
            isScored: false,
            parentCode: "MAT",
            sortOrder: 4,
          },
          {
            code: "MANTIK",
            name: "Problemler",
            isScored: false,
            parentCode: "MAT",
            sortOrder: 5,
          },
        ],
      },
      {
        code: "KPSS_GK",
        name: "Genel Kültür",
        wrongPenaltyDivisor: 4,
        sortOrder: 2,
        subjects: [
          {
            code: "TAR",
            name: "Tarih",
            officialQuestionCount: 27,
            isScored: true,
            sortOrder: 1,
            chartColor: "#D97706",
          },
          {
            code: "COG",
            name: "Coğrafya",
            officialQuestionCount: 18,
            isScored: true,
            sortOrder: 2,
            chartColor: "#059669",
          },
          {
            code: "VAT",
            name: "Vatandaşlık",
            officialQuestionCount: 9,
            isScored: true,
            sortOrder: 3,
            chartColor: "#7C3AED",
          },
          {
            code: "GUNCEL",
            name: "Güncel Bilgiler",
            officialQuestionCount: 6,
            isScored: true,
            sortOrder: 4,
            chartColor: "#64748B",
          },
        ],
      },
    ],
  },
  {
    code: "YKS",
    name: "YKS (TYT + AYT)",
    tracks: [
      { code: "SAY", name: "Sayısal", sortOrder: 1 },
      { code: "EA", name: "Eşit Ağırlık", sortOrder: 2 },
      { code: "SOZ", name: "Sözel", sortOrder: 3 },
    ],
    sections: [
      {
        code: "TYT",
        name: "Temel Yeterlilik Testi",
        wrongPenaltyDivisor: 4,
        sortOrder: 1,
        // TYT applies to all tracks → trackCodes omitted everywhere.
        subjects: [
          {
            code: "TUR",
            name: "Türkçe",
            officialQuestionCount: 40,
            isScored: true,
            sortOrder: 1,
            chartColor: "#E11D48",
          },
          {
            code: "MAT",
            name: "Matematik",
            officialQuestionCount: 40,
            isScored: true,
            sortOrder: 2,
            chartColor: "#2563EB",
          },
          {
            code: "GEO",
            name: "Geometri",
            isScored: false,
            parentCode: "MAT",
            sortOrder: 3,
          },
          {
            code: "SOS",
            name: "Sosyal Bilimler",
            officialQuestionCount: 20,
            isScored: true,
            sortOrder: 4,
            chartColor: "#D97706",
          },
          {
            code: "TYT_TAR",
            name: "Tarih",
            isScored: false,
            parentCode: "SOS",
            sortOrder: 5,
          },
          {
            code: "TYT_COG",
            name: "Coğrafya",
            isScored: false,
            parentCode: "SOS",
            sortOrder: 6,
          },
          {
            code: "TYT_FEL",
            name: "Felsefe",
            isScored: false,
            parentCode: "SOS",
            sortOrder: 7,
          },
          {
            code: "TYT_DIN",
            name: "Din",
            isScored: false,
            parentCode: "SOS",
            sortOrder: 8,
          },
          {
            code: "FEN",
            name: "Fen Bilimleri",
            officialQuestionCount: 20,
            isScored: true,
            sortOrder: 9,
            chartColor: "#059669",
          },
          {
            code: "TYT_FIZ",
            name: "Fizik",
            isScored: false,
            parentCode: "FEN",
            sortOrder: 10,
          },
          {
            code: "TYT_KIM",
            name: "Kimya",
            isScored: false,
            parentCode: "FEN",
            sortOrder: 11,
          },
          {
            code: "TYT_BIY",
            name: "Biyoloji",
            isScored: false,
            parentCode: "FEN",
            sortOrder: 12,
          },
        ],
      },
      {
        code: "AYT",
        name: "Alan Yeterlilik Testi",
        wrongPenaltyDivisor: 4,
        sortOrder: 2,
        // All AYT subjects are scored; trackCodes limit them to alan(lar).
        subjects: [
          {
            code: "AYT_MAT",
            name: "Matematik",
            officialQuestionCount: 40,
            isScored: true,
            trackCodes: ["SAY", "EA"],
            sortOrder: 1,
            chartColor: "#1D4ED8",
          },
          {
            code: "AYT_FIZ",
            name: "Fizik",
            officialQuestionCount: 14,
            isScored: true,
            trackCodes: ["SAY"],
            sortOrder: 2,
            chartColor: "#F97316",
          },
          {
            code: "AYT_KIM",
            name: "Kimya",
            officialQuestionCount: 13,
            isScored: true,
            trackCodes: ["SAY"],
            sortOrder: 3,
            chartColor: "#8B5CF6",
          },
          {
            code: "AYT_BIY",
            name: "Biyoloji",
            officialQuestionCount: 13,
            isScored: true,
            trackCodes: ["SAY"],
            sortOrder: 4,
            chartColor: "#10B981",
          },
          {
            code: "AYT_EDB",
            name: "Türk Dili ve Edebiyatı",
            officialQuestionCount: 24,
            isScored: true,
            trackCodes: ["EA", "SOZ"],
            sortOrder: 5,
            chartColor: "#DB2777",
          },
          {
            code: "AYT_TAR",
            name: "Tarih",
            isScored: true,
            trackCodes: ["EA", "SOZ"],
            sortOrder: 6,
            chartColor: "#B45309",
          },
          {
            code: "AYT_COG",
            name: "Coğrafya",
            isScored: true,
            trackCodes: ["EA", "SOZ"],
            sortOrder: 7,
            chartColor: "#0D9488",
          },
          {
            code: "AYT_FEL",
            name: "Felsefe Grubu",
            isScored: true,
            trackCodes: ["SOZ"],
            sortOrder: 8,
            chartColor: "#6366F1",
          },
          {
            code: "AYT_DIN",
            name: "Din Kültürü",
            isScored: true,
            trackCodes: ["SOZ"],
            sortOrder: 9,
            chartColor: "#84CC16",
          },
        ],
      },
    ],
  },
  {
    code: "LGS",
    name: "LGS",
    tracks: [],
    sections: [
      {
        code: "LGS_SOZEL",
        name: "Sözel Bölüm",
        wrongPenaltyDivisor: 3,
        sortOrder: 1,
        subjects: [
          {
            code: "TUR",
            name: "Türkçe",
            officialQuestionCount: 20,
            isScored: true,
            sortOrder: 1,
            chartColor: "#E11D48",
          },
          {
            code: "INK",
            name: "T.C. İnkılap Tarihi ve Atatürkçülük",
            officialQuestionCount: 10,
            isScored: true,
            sortOrder: 2,
            chartColor: "#D97706",
          },
          {
            code: "DIN",
            name: "Din Kültürü",
            officialQuestionCount: 10,
            isScored: true,
            sortOrder: 3,
            chartColor: "#84CC16",
          },
          {
            code: "ING",
            name: "İngilizce",
            officialQuestionCount: 10,
            isScored: true,
            sortOrder: 4,
            chartColor: "#7C3AED",
          },
        ],
      },
      {
        code: "LGS_SAYISAL",
        name: "Sayısal Bölüm",
        wrongPenaltyDivisor: 3,
        sortOrder: 2,
        subjects: [
          {
            code: "MAT",
            name: "Matematik",
            officialQuestionCount: 20,
            isScored: true,
            sortOrder: 1,
            chartColor: "#2563EB",
          },
          {
            code: "FEN",
            name: "Fen Bilimleri",
            officialQuestionCount: 20,
            isScored: true,
            sortOrder: 2,
            chartColor: "#059669",
          },
        ],
      },
    ],
  },
];
