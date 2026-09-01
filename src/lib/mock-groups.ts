/**
 * Deneme listesini GENEL ve BRANŞ gruplarına ayırır.
 *
 * Tek düz listede aynı dersin iki branş denemesi arasına başka dört ders
 * giriyordu; koç "Matematik nasıl gidiyor?" sorusunu tabloyu tarayarak
 * yanıtlamak zorunda kalıyordu. Grup anahtarı denemedeki PUANLANAN derslerin
 * id'leri (bkz. `paceKey`) — "TYT Türkçe" yalnız kendi geçmişiyle yan yana
 * durur, adı aynı olan KPSS Türkçesiyle karışmaz. Genel denemeler de bölüme
 * göre ayrılır: TYT ile AYT aynı ölçek değildir.
 *
 * Saf modül — `@/db`'ye dokunmaz, istemci bileşeni de kullanabilir.
 */
import { paceKey } from "@/lib/pace";

export type GroupableMock = {
  id: number;
  takenOn: Date;
  scope: "full" | "branch";
  totalNet: number;
  sectionCode: string;
  sectionName: string;
  subjectIds: number[];
  subjectNames: string[];
};

export type MockGroup<T> = {
  key: string;
  kind: "full" | "branch";
  /** Genel'de bölüm adı ("KPSS Denemesi"), branşta ders adları ("Matematik"). */
  title: string;
  /** Branşta bölüm adı; genelde null (başlığın kendisi zaten bölüm). */
  subtitle: string | null;
  /** Yeniden eskiye sıralı denemeler. */
  mocks: T[];
  count: number;
  avgNet: number;
  /** En son denemenin neti. */
  lastNet: number;
  bestNet: number;
  /** Son net − bir önceki net; tek deneme varsa null. */
  deltaNet: number | null;
};

const byNewest = (a: GroupableMock, b: GroupableMock) =>
  b.takenOn.getTime() - a.takenOn.getTime() || b.id - a.id;

/** Ders adları — sıra `group_concat`'e bırakılmasın diye TR'ye göre sıralı. */
function titleOf(mock: GroupableMock): string {
  if (mock.scope === "full") return mock.sectionName;
  const names = [...mock.subjectNames].sort((a, b) => a.localeCompare(b, "tr"));
  return names.join(" · ") || "Ders belirtilmemiş";
}

export function groupMocks<T extends GroupableMock>(
  mocks: readonly T[],
): MockGroup<T>[] {
  const buckets = new Map<string, T[]>();
  for (const m of mocks) {
    /*
     * Branşta anahtar YALNIZ ders id'leridir — `paceKey` ile birebir aynı.
     * Böylece bir denemenin "bir önceki"si tempoda da nette de aynı satır olur.
     * Ders id'leri bölüme özgü olduğundan TYT Türkçesi ile KPSS Türkçesi zaten
     * ayrışır; bölüm kodu ancak ders çözülemediğinde (sonuç satırı yok) ayırıcı
     * olarak devreye girer.
     */
    const key =
      m.scope === "full"
        ? `genel:${m.sectionCode}`
        : `brans:${paceKey(m.subjectIds) || `diger:${m.sectionCode}`}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(m);
    else buckets.set(key, [m]);
  }

  const groups = [...buckets.entries()].map(([key, list]) => {
    const sorted = [...list].sort(byNewest);
    const nets = sorted.map((m) => m.totalNet);
    const total = nets.reduce((acc, n) => acc + n, 0);
    const head = sorted[0];
    return {
      key,
      kind: head.scope,
      title: titleOf(head),
      subtitle: head.scope === "branch" ? head.sectionName : null,
      mocks: sorted,
      count: sorted.length,
      avgNet: total / sorted.length,
      lastNet: nets[0],
      bestNet: Math.max(...nets),
      deltaNet: nets.length > 1 ? nets[0] - nets[1] : null,
    };
  });

  // Önce genel denemeler, sonra branşlar; her ikisi de en son çözülen üstte.
  return groups.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "full" ? -1 : 1;
    return (
      byNewest(a.mocks[0], b.mocks[0]) || a.title.localeCompare(b.title, "tr")
    );
  });
}
