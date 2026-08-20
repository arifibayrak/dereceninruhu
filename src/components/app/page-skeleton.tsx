import { Skeleton } from "@/components/ui/skeleton";

/**
 * Gezinme sırasında anında boyanan iskelet.
 *
 * NEDEN VAR: `/ogrenci` ve `/koc` kabukları `force-dynamic`. `loading.tsx`
 * yokken Next'in gezinmede gösterebileceği bir şey olmuyor, `<Link>` ön
 * getirmesi boşa çıkıyor ve tarayıcı tüm sunucu turu boyunca ESKİ sayfayı
 * ekranda tutuyordu. Gezinme istemci bileşeninde olduğu için tarayıcının kendi
 * yüklenme göstergesi de çıkmıyor — kullanıcı için bu tam olarak "site dondu".
 *
 * Gerçek düzeni birebir taklit etmesi gerekmez; ölçüsü tutan gri bloklar
 * "istek gitti, geliyor" mesajını vermeye yeter.
 */
export function PageSkeleton({
  /** Başlıktan sonra kaç blok çizilsin. */
  rows = 3,
  /** Başlığın altında istatistik kutusu şeridi göster. */
  stats = 0,
}: {
  rows?: number;
  stats?: number;
}) {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      {stats > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: stats }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Satır satır tablo iskeleti — kadro/deneme/fatura listeleri için. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="flex flex-col gap-2 rounded-xl bg-card p-3 ring-1 ring-foreground/10">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    </div>
  );
}
