import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Minimal for now. When the marketing site needs ISR (Faz 3), add an
// R2 incremental cache here (r2IncrementalCache) backed by the R2 bucket.
export default defineCloudflareConfig({});
