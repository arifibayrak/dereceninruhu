"use client";

import Script from "next/script";

/**
 * Cal.com inline booking embed (Ahmet'in 30 dk ücretsiz ön görüşme takvimi).
 * embed.js Cal CDN'den yüklenir — uygulama paketine eklenmez (bundle etkisi yok).
 */
const CAL_LINK = "ahmet-hakan-almak-cbyguf/30min";
const CAL_URL = `https://cal.com/${CAL_LINK}`;

export function CalBooking() {
  return (
    <div className="flex flex-col gap-3">
      <div
        id="cal-inline-30min"
        className="min-h-[560px] w-full overflow-auto rounded-2xl bg-card ring-1 ring-foreground/10"
      />
      <a
        href={CAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
      >
        Takvim açılmıyorsa buradan planla →
      </a>
      <Script
        id="cal-embed-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]);} else p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", "d30min", {origin:"https://cal.com"});
Cal.ns.d30min("inline", {elementOrSelector:"#cal-inline-30min", config: {layout:"month_view"}, calLink: "${CAL_LINK}"});
Cal.ns.d30min("ui", {hideEventTypeDetails:false, layout:"month_view"});
`,
        }}
      />
    </div>
  );
}
