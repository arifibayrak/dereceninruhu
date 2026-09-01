import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Home-dizinindeki package-lock.json'ın workspace-root sanılmasını engelle
  // (aksi halde Turbopack yanlış kökü izleyip sürekli yeniden derliyor).
  turbopack: { root: import.meta.dirname },
  /*
   * Sürüm uyuşmazlığı (version skew) koruması. Yeni sürüm yayınlandığında
   * telefonlarda AÇIK KALMIŞ sekmeler eski JS ile çalışmaya devam eder; oradan
   * yapılan her Server Action çağrısı sunucuda tanınmaz ve reddedilir
   * (kullanıcı için: "kaydet"e basınca donma). deploymentId tanımlıysa Next
   * istemcinin sürümünü yanıt başlığıyla karşılaştırıp gezinmede TAM SAYFA
   * yenilemesi yapar — sekme eski derlemede takılı kalmaz.
   * `pnpm run deploy` bunu commit sha'sından geçirir. Cloudflare Workers
   * Builds'te (git'ten dağıtım) o değişken yoktur; oradaki karşılığı
   * WORKERS_CI_COMMIT_SHA — yedeği olmasa skew koruması sessizce kapanırdı.
   */
  deploymentId:
    process.env.NEXT_DEPLOYMENT_ID ??
    process.env.WORKERS_CI_COMMIT_SHA?.slice(0, 7),
  // transformers.js canlı-transkript YALNIZ tarayıcıda (WebGPU) dinamik import
  // edilir; sunucu/Cloudflare Worker paketine GİRMEMELİ. onnxruntime-node native
  // .node ikilisi içerir (esbuild yükleyemez) → dışsal tut.
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node"],
  images: {
    // Marketing/blog may reference remote covers; keep tight and explicit.
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  experimental: {
    // Ses transkript hattı: ~45 sn'lik WAV parçaları (base64) Server Action ile
    // yüklenir; varsayılan 1MB sınırı yetmez.
    serverActions: { bodySizeLimit: "8mb" },
    /*
     * Next'in kendi varsayılan listesi `lucide-react` ve `recharts`ı zaten
     * kapsıyor; bu ikisi kapsam dışında. Barrel importları tek tek modüllere
     * çevrilir, kullanılmayan alt modüller pakete girmez.
     */
    optimizePackageImports: ["@base-ui/react"],
  },
};

export default nextConfig;

// Enables getCloudflareContext() (D1/R2/env bindings) during `next dev` only.
// Guarded so `next build` doesn't start the Miniflare binding proxy.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
