/**
 * Idempotent topic seed: `pnpm db:seed:topics` (tsx).
 *
 * Mirrors src/db/seed/index.ts: opens miniflare's local D1 sqlite with
 * better-sqlite3 (no request context available). Requires the template seed
 * (`pnpm db:seed:local`) to have run first — subjects are resolved by
 * template.code → section.code → subject.code natural keys.
 *
 * Upsert key: (subject_id, name). Re-running never duplicates; renames in this
 * file create NEW topics (old rows stay isActive for history) — retire old
 * ones from the UI/DB manually if needed.
 *
 * KPSS lists are verbatim from the coach's real tracking sheet; YKS (TYT) and
 * LGS lists follow the standard MEB/ÖSYM curricula.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import Database from "better-sqlite3";
import { and, eq } from "drizzle-orm";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../schema";

export type SeedDb = BetterSQLite3Database<typeof schema>;

const { examTemplates, examSections, subjects, topics } = schema;

interface TopicGroup {
  /** Template natural key (KPSS | YKS | LGS). */
  template: string;
  /** Section natural key within the template. */
  section: string;
  /** Subject natural key within the section. */
  subject: string;
  topics: string[];
}

/* -------------------------------------------------------------------------- */
/*  KPSS — gerçek takip çizelgesinden birebir                                 */
/* -------------------------------------------------------------------------- */

const KPSS: TopicGroup[] = [
  {
    template: "KPSS",
    section: "KPSS_GY",
    subject: "TUR",
    topics: [
      "Sözcükte Anlam",
      "Cümlede Anlam",
      "Anlatım Biçimleri",
      "Paragrafta Anlam",
      "Ses Bilgisi",
      "Yazım Kuralları",
      "Noktalama İşaretleri",
      "Sözcük Yapısı ve Ekler",
      "İsimler",
      "Sıfatlar",
      "Zamirler",
      "Zarflar",
      "Edat-Bağlaç-Ünlem",
      "Fiilde Yapı",
      "Ek Fiil-Fiilimsiler",
      "Fiilde Kipler",
      "Fiilde Çatı",
      "Cümlenin Ögeleri",
      "Cümle Türleri",
      "Anlatım Bozuklukları",
      "Sözel Muhakeme ve Mantık",
    ],
  },
  {
    template: "KPSS",
    section: "KPSS_GY",
    subject: "MAT",
    topics: [
      "Temel Kavramlar",
      "Sayı Basamakları",
      "Bölme-Bölünebilme",
      "Asal Çarpanlara Ayırma",
      "EBOB-EKOK",
      "Rasyonel Sayılar",
      "Ondalık Sayılar",
      "Basit Eşitsizlikler",
      "Mutlak Değer",
      "Üslü Sayılar",
      "Köklü Sayılar",
      "Faktöriyel",
      "Çarpanlara Ayırma",
      "Oran-Orantı",
      "Denklem Çözme",
      "Sayı Problemleri",
      "Kesir Problemleri",
      "Yaş Problemleri",
      "İşçi-Havuz Problemleri",
      "Hareket Problemleri",
      "Yüzde-Kar-Zarar",
      "Faiz Problemleri",
      "Karışım Problemleri",
      "Grafik Problemleri",
      "Kümeler",
      "Bağıntı ve Fonksiyon",
      "İşlem",
      "Modüler Aritmetik",
      "Permütasyon",
      "Kombinasyon",
      "Olasılık",
      "Sayısal Mantık",
      "Şekil Yetenek",
    ],
  },
  {
    template: "KPSS",
    section: "KPSS_GY",
    subject: "GEO",
    topics: [
      "Doğruda Açılar",
      "Üçgende Açılar",
      "Üçgende Alan",
      "Üçgende Benzerlik",
      "Açı-Kenar Bağıntıları",
      "Özel Üçgenler",
      "Açıortay",
      "Kenarortay",
      "Çokgenler",
      "Dörtgenler",
      "Çember ve Daire",
      "Analitik Geometri",
      "Katı Cisimler",
    ],
  },
  {
    template: "KPSS",
    section: "KPSS_GK",
    subject: "TAR",
    topics: [
      "İslamiyet Öncesi Türk Tarihi",
      "İlk Türk-İslam Devletleri",
      "Türkiye (Anadolu) Selçuklu Devleti",
      "Osmanlı Kuruluş",
      "Osmanlı Yükselme",
      "Osmanlı Duraklama",
      "Osmanlı Gerileme",
      "Osmanlı Dağılma",
      "Osmanlı Kültür-Uygarlık",
      "20. Yüzyılda Osmanlı",
      "Kurtuluş Savaşı Hazırlık",
      "TBMM Dönemi ve Ayaklanmalar",
      "Kurtuluş Savaşı Muharebeler",
      "Atatürk İlkeleri",
      "Atatürk İnkılapları",
      "Dış Politika",
      "İkinci Dünya Savaşı",
      "Soğuk Savaş",
      "Yumuşama Dönemi",
      "Küreselleşen Dünya",
    ],
  },
  {
    template: "KPSS",
    section: "KPSS_GK",
    subject: "COG",
    topics: [
      "Türkiye'nin Coğrafi Konumu",
      "Türkiye'nin Fiziki Coğrafyası",
      "Yer Şekilleri",
      "İklim",
      "Doğal Afetler",
      "Nüfus",
      "Tarım ve Hayvancılık",
      "Madenler ve Enerji",
      "Sanayi",
      "Ticaret",
      "Ulaşım",
      "Turizm",
      "Bölgesel Kalkınma Projeleri",
      "Bölgeler Coğrafyası",
    ],
  },
  {
    template: "KPSS",
    section: "KPSS_GK",
    subject: "VAT",
    topics: [
      "Hukuk Başlangıcı",
      "Devlet ve Devlet Yapıları",
      "Anayasal Gelişmeler",
      "Temel Haklar",
      "İdari Yapı",
      "Yasama",
      "Yürütme",
      "Yargı",
      "İnsan Hakları Hukuku",
      "Uluslararası Örgütler",
      "Güncel Sorular",
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  YKS (TYT) — standart ÖSYM müfredatı                                       */
/* -------------------------------------------------------------------------- */

const YKS: TopicGroup[] = [
  {
    template: "YKS",
    section: "TYT",
    subject: "TUR",
    topics: [
      "Sözcükte Anlam",
      "Söz Yorumu",
      "Deyim ve Atasözü",
      "Cümlede Anlam",
      "Paragrafta Anlam ve Ana Düşünce",
      "Paragrafta Yapı",
      "Paragrafta Anlatım Teknikleri",
      "Ses Bilgisi",
      "Yazım Kuralları",
      "Noktalama İşaretleri",
      "Sözcükte Yapı ve Ekler",
      "İsimler",
      "Zamirler",
      "Sıfatlar",
      "Zarflar",
      "Edat-Bağlaç-Ünlem",
      "Fiiller ve Ek Fiil",
      "Fiilimsiler",
      "Fiilde Çatı",
      "Cümlenin Ögeleri",
      "Cümle Türleri",
      "Anlatım Bozuklukları",
      "Sözel Mantık",
    ],
  },
  {
    template: "YKS",
    section: "TYT",
    subject: "MAT",
    topics: [
      "Temel Kavramlar",
      "Sayı Basamakları",
      "Bölme ve Bölünebilme",
      "EBOB-EKOK",
      "Rasyonel Sayılar",
      "Ondalık Sayılar",
      "Basit Eşitsizlikler",
      "Mutlak Değer",
      "Üslü Sayılar",
      "Köklü Sayılar",
      "Çarpanlara Ayırma",
      "Oran-Orantı",
      "Denklem Çözme",
      "Sayı Problemleri",
      "Kesir Problemleri",
      "Yaş Problemleri",
      "Hareket Problemleri",
      "İşçi-Havuz Problemleri",
      "Yüzde-Kar-Zarar Problemleri",
      "Faiz Problemleri",
      "Karışım Problemleri",
      "Grafik Problemleri",
      "Kümeler",
      "Fonksiyonlar",
      "Permütasyon",
      "Kombinasyon",
      "Olasılık",
      "Veri ve İstatistik",
      "Sayısal Mantık",
    ],
  },
  {
    template: "YKS",
    section: "TYT",
    subject: "GEO",
    topics: [
      "Doğruda Açılar",
      "Üçgende Açılar",
      "Üçgende Alan",
      "Üçgende Benzerlik",
      "Açı-Kenar Bağıntıları",
      "Özel Üçgenler",
      "Açıortay",
      "Kenarortay",
      "Çokgenler",
      "Dörtgenler",
      "Çember ve Daire",
      "Analitik Geometri",
      "Katı Cisimler",
    ],
  },
  {
    template: "YKS",
    section: "TYT",
    subject: "TYT_TAR",
    topics: [
      "Tarih Bilimi",
      "İlk Çağ Uygarlıkları",
      "İslamiyet Öncesi Türk Tarihi",
      "İslam Tarihi ve Uygarlığı",
      "İlk Türk-İslam Devletleri",
      "Türkiye (Anadolu) Selçuklu Devleti ve Beylikler",
      "Osmanlı Kuruluş ve Yükselme",
      "Osmanlı Kültür ve Uygarlığı",
      "Osmanlı Duraklama ve Gerileme",
      "Osmanlı Dağılma Dönemi",
      "20. Yüzyılda Osmanlı",
      "Kurtuluş Savaşı",
      "Atatürk İlke ve İnkılapları",
      "Atatürk Dönemi Dış Politika",
    ],
  },
  {
    template: "YKS",
    section: "TYT",
    subject: "TYT_COG",
    topics: [
      "Doğa ve İnsan",
      "Dünya'nın Şekli ve Hareketleri",
      "Coğrafi Konum",
      "Harita Bilgisi",
      "İklim Bilgisi",
      "İç ve Dış Kuvvetler",
      "Su, Toprak ve Bitkiler",
      "Nüfus ve Yerleşme",
      "Ekonomik Faaliyetler",
      "Bölgeler ve Ülkeler",
      "Doğal Afetler",
      "Çevre ve Toplum",
    ],
  },
  {
    template: "YKS",
    section: "TYT",
    subject: "TYT_FEL",
    topics: [
      "Felsefenin Konusu",
      "Bilgi Felsefesi",
      "Varlık Felsefesi",
      "Ahlak Felsefesi",
      "Sanat Felsefesi",
      "Din Felsefesi",
      "Siyaset Felsefesi",
      "Bilim Felsefesi",
    ],
  },
  {
    template: "YKS",
    section: "TYT",
    subject: "TYT_DIN",
    topics: [
      "Bilgi ve İnanç",
      "Din ve İslam",
      "İslam ve İbadet",
      "Gençlik ve Değerler",
      "Hz. Muhammed'in Hayatı",
      "Vahiy ve Akıl",
      "İslam Düşüncesinde Yorumlar",
      "Ahlaki Tutum ve Davranışlar",
    ],
  },
  {
    template: "YKS",
    section: "TYT",
    subject: "TYT_FIZ",
    topics: [
      "Fizik Bilimine Giriş",
      "Madde ve Özellikleri",
      "Hareket ve Kuvvet",
      "İş, Güç ve Enerji",
      "Isı ve Sıcaklık",
      "Basınç ve Kaldırma Kuvveti",
      "Elektrostatik",
      "Elektrik ve Manyetizma",
      "Dalgalar",
      "Optik",
    ],
  },
  {
    template: "YKS",
    section: "TYT",
    subject: "TYT_KIM",
    topics: [
      "Kimya Bilimi",
      "Atom ve Periyodik Sistem",
      "Kimyasal Türler Arası Etkileşimler",
      "Kimyanın Temel Kanunları",
      "Kimyasal Hesaplamalar",
      "Maddenin Halleri",
      "Karışımlar",
      "Asitler, Bazlar ve Tuzlar",
      "Doğa ve Kimya",
      "Kimya Her Yerde",
    ],
  },
  {
    template: "YKS",
    section: "TYT",
    subject: "TYT_BIY",
    topics: [
      "Canlıların Ortak Özellikleri",
      "Canlıların Temel Bileşenleri",
      "Hücre ve Organeller",
      "Hücre Zarından Madde Geçişleri",
      "Canlıların Sınıflandırılması",
      "Hücre Bölünmeleri",
      "Üreme",
      "Kalıtım",
      "Ekosistem Ekolojisi",
      "Güncel Çevre Sorunları",
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  LGS — 8. sınıf MEB müfredatı                                              */
/* -------------------------------------------------------------------------- */

const LGS: TopicGroup[] = [
  {
    template: "LGS",
    section: "LGS_SOZEL",
    subject: "TUR",
    topics: [
      "Sözcükte Anlam",
      "Cümlede Anlam",
      "Paragrafta Anlam",
      "Söz Sanatları",
      "Metin Türleri",
      "Fiilimsiler",
      "Cümlenin Ögeleri",
      "Fiilde Çatı",
      "Cümle Türleri",
      "Yazım Kuralları",
      "Noktalama İşaretleri",
      "Anlatım Bozuklukları",
      "Görsel ve Grafik Yorumlama",
      "Sözel Mantık",
    ],
  },
  {
    template: "LGS",
    section: "LGS_SOZEL",
    subject: "INK",
    topics: [
      "Bir Kahraman Doğuyor",
      "Milli Uyanış: Bağımsızlık Yolunda Atılan Adımlar",
      "Milli Bir Destan: Ya İstiklal Ya Ölüm",
      "Atatürkçülük ve Çağdaşlaşan Türkiye",
      "Demokratikleşme Çabaları",
      "Atatürk Dönemi Türk Dış Politikası",
      "Atatürk'ün Ölümü ve Sonrası",
    ],
  },
  {
    template: "LGS",
    section: "LGS_SOZEL",
    subject: "DIN",
    topics: [
      "Kader İnancı",
      "Zekât ve Sadaka",
      "Din ve Hayat",
      "Hz. Muhammed'in Örnekliği",
      "Kur'an-ı Kerim ve Özellikleri",
    ],
  },
  {
    template: "LGS",
    section: "LGS_SOZEL",
    subject: "ING",
    topics: [
      "Friendship",
      "Teen Life",
      "In the Kitchen",
      "On the Phone",
      "The Internet",
      "Adventures",
      "Tourism",
      "Chores",
      "Science",
      "Natural Forces",
    ],
  },
  {
    template: "LGS",
    section: "LGS_SAYISAL",
    subject: "MAT",
    topics: [
      "Çarpanlar ve Katlar",
      "Üslü İfadeler",
      "Kareköklü İfadeler",
      "Veri Analizi",
      "Basit Olayların Olma Olasılığı",
      "Cebirsel İfadeler ve Özdeşlikler",
      "Doğrusal Denklemler",
      "Eşitsizlikler",
      "Üçgenler",
      "Eşlik ve Benzerlik",
      "Dönüşüm Geometrisi",
      "Geometrik Cisimler",
      "Sayısal Mantık",
    ],
  },
  {
    template: "LGS",
    section: "LGS_SAYISAL",
    subject: "FEN",
    topics: [
      "Mevsimler ve İklim",
      "DNA ve Genetik Kod",
      "Basınç",
      "Madde ve Endüstri",
      "Basit Makineler",
      "Enerji Dönüşümleri ve Çevre Bilimi",
      "Elektrik Yükleri ve Elektrik Enerjisi",
    ],
  },
];

export const topicSeeds: TopicGroup[] = [...KPSS, ...YKS, ...LGS];

/* -------------------------------------------------------------------------- */
/*  Runner                                                                    */
/* -------------------------------------------------------------------------- */

/** Newest .sqlite under .wrangler/state/v3/d1 (miniflare's local D1). */
function findLocalD1SqliteFile(): string | null {
  const root = path.join(process.cwd(), ".wrangler", "state", "v3", "d1");
  if (!fs.existsSync(root)) return null;
  const entries = fs.readdirSync(root, {
    recursive: true,
    withFileTypes: true,
  });
  const candidates = entries
    .filter((e) => e.isFile() && e.name.endsWith(".sqlite"))
    .map((e) => path.join(e.parentPath, e.name))
    .map((p) => ({ p, mtime: fs.statSync(p).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return candidates[0]?.p ?? null;
}

export function seedTopics(db: SeedDb): {
  inserted: number;
  updated: number;
  missingSubjects: string[];
} {
  let inserted = 0;
  let updated = 0;
  const missingSubjects: string[] = [];

  for (const group of topicSeeds) {
    const subject = db
      .select({ id: subjects.id })
      .from(subjects)
      .innerJoin(examSections, eq(examSections.id, subjects.examSectionId))
      .innerJoin(
        examTemplates,
        eq(examTemplates.id, examSections.examTemplateId),
      )
      .where(
        and(
          eq(examTemplates.code, group.template),
          eq(examSections.code, group.section),
          eq(subjects.code, group.subject),
        ),
      )
      .get();
    if (!subject) {
      missingSubjects.push(
        `${group.template}/${group.section}/${group.subject}`,
      );
      continue;
    }

    group.topics.forEach((name, i) => {
      const sortOrder = i + 1;
      const existing = db
        .select()
        .from(topics)
        .where(and(eq(topics.subjectId, subject.id), eq(topics.name, name)))
        .get();
      if (existing) {
        db.update(topics)
          .set({ sortOrder, isActive: true })
          .where(eq(topics.id, existing.id))
          .run();
        updated++;
      } else {
        db.insert(topics)
          .values({ subjectId: subject.id, name, sortOrder, isActive: true })
          .run();
        inserted++;
      }
    });
  }

  return { inserted, updated, missingSubjects };
}

function main() {
  const sqlitePath = findLocalD1SqliteFile();
  if (!sqlitePath) {
    console.error(
      [
        "Yerel D1 veritabanı bulunamadı (.wrangler/state/v3/d1 altında .sqlite yok).",
        "Önce migration + şablon seed'ini çalıştırın:",
        "",
        "  pnpm db:migrate:local && pnpm db:seed:local",
        "",
        "sonra tekrar `pnpm db:seed:topics` çalıştırın.",
      ].join("\n"),
    );
    process.exit(1);
  }

  console.log(`Yerel D1: ${path.relative(process.cwd(), sqlitePath)}`);
  const sqlite = new Database(sqlitePath);
  sqlite.pragma("foreign_keys = ON");
  const db: SeedDb = drizzle(sqlite, { schema });

  try {
    const result = db.transaction(() => seedTopics(db));
    console.log(
      `Konu seed tamam: ${result.inserted} eklendi, ${result.updated} güncellendi.`,
    );
    if (result.missingSubjects.length > 0) {
      console.warn(
        [
          "Uyarı — şu dersler bulunamadı (önce `pnpm db:seed:local`):",
          ...result.missingSubjects.map((s) => `  - ${s}`),
        ].join("\n"),
      );
      process.exit(1);
    }
  } finally {
    sqlite.close();
  }
}

// Yalnız doğrudan çalıştırıldığında (tsx src/db/seed/topics.ts) main'i tetikle;
// vitest importunda tetiklenmez.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
