"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Grafikler talep üzerine inen ayrı bir parçaya taşındı.
 *
 * NEDEN: recharts (+ d3 bağımlılıkları) gzip'li ~90-110 KB — uygulamanın en
 * ağır istemci kütüphanesi. Statik import edildiğinde `/ogrenci/gelisim`,
 * `/ogrenci/kronometre` ve koç kokpitinin İLK yükünde iniyordu; hepsi mobil
 * öncelikli ekranlar. Grafik ekranın altında ve saf sunum olduğu için
 * `ssr: false` ile ertelenmesi doğru: sayfa metni ve sayılar hemen boyanır,
 * çizim birkaç yüz ms sonra yerine oturur.
 *
 * Tipler doğrudan asıl modülden alınır — `dynamic()` yalnız çalışma zamanını
 * erteler, tip bağı kopmaz.
 */

const chartFallback = () => (
  <Skeleton aria-hidden className="h-[220px] w-full rounded-xl" />
);

export const NetProgressChart = dynamic(
  () => import("./net-progress-chart").then((m) => m.NetProgressChart),
  { ssr: false, loading: chartFallback },
);

export const WeeklyVolumeChart = dynamic(
  () => import("./weekly-volume-chart").then((m) => m.WeeklyVolumeChart),
  { ssr: false, loading: chartFallback },
);

export const WeeklyStudyChart = dynamic(
  () => import("./weekly-study-chart").then((m) => m.WeeklyStudyChart),
  { ssr: false, loading: chartFallback },
);
