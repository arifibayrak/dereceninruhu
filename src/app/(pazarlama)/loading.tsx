import { Skeleton } from "@/components/ui/skeleton";

/**
 * Pazarlama kabuğunun tek yükleme iskeleti — 19 public sayfayı da kapsar.
 *
 * NEDEN VAR: bu sayfaların hepsi `force-dynamic` (D1 okuyorlar). `loading.tsx`
 * yokken Next gezinmede gösterecek bir şey bulamıyor ve tarayıcı, sunucu turu
 * bitene kadar ESKİ sayfayı ekranda tutuyordu — kullanıcı tarafında bu birebir
 * "site dondu" hissi. `@/components/app/page-skeleton` yerine buraya özel:
 * ölçüler pazarlama kabının (max-w-6xl, px-4/sm:px-6) hizasında dursun.
 *
 * SEO/GEO'ya etkisi yok: tarayıcılar akışın tamamını, yani çözülmüş içeriği alır.
 */
export default function PazarlamaLoading() {
  return (
    <div
      aria-hidden
      className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 md:py-16"
    >
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-full max-w-2xl" />
        <Skeleton className="h-12 w-full max-w-xl" />
        <Skeleton className="h-5 w-full max-w-lg" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-11 w-52 rounded-lg" />
        <Skeleton className="h-11 w-36 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
