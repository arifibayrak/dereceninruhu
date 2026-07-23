"use client";

import Script from "next/script";

import { cn } from "@/lib/utils";

/**
 * Cal.com inline booking embed — koça özel `calLink` ile parametrize (eskiden
 * pazarlama sayfasındaki tek sabit link). embed.js Cal CDN'den yüklenir; uygulama
 * paketine eklenmez (bundle etkisi yok). Namespace + element id `calLink`'ten
 * türetilir ki aynı sayfada birden çok embed çakışmasın. Değerler script'e
 * JSON.stringify ile gömülür (enjeksiyon güvenliği).
 */
export function CoachCalBooking({
  calLink,
  url,
  className,
}: {
  /** Cal.com slug (ör. "ahmet/haftalik"). */
  calLink: string;
  /** Yeni sekmede açılan yedek tam URL. */
  url: string;
  className?: string;
}) {
  const ns = `cal_${calLink.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const elementId = `cal-inline-${ns}`;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        id={elementId}
        className="min-h-[560px] w-full overflow-auto rounded-2xl bg-card ring-1 ring-foreground/10"
      />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
      >
        Takvim açılmıyorsa buradan planla →
      </a>
      <Script
        id={`cal-embed-init-${ns}`}
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]);} else p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", ${JSON.stringify(ns)}, {origin:"https://cal.com"});
Cal.ns[${JSON.stringify(ns)}]("inline", {elementOrSelector:${JSON.stringify(`#${elementId}`)}, config: {layout:"month_view"}, calLink: ${JSON.stringify(calLink)}});
Cal.ns[${JSON.stringify(ns)}]("ui", {hideEventTypeDetails:false, layout:"month_view"});
`,
        }}
      />
    </div>
  );
}
