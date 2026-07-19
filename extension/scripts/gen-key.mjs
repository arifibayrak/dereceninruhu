// Sabit (deterministik) eklenti kimliği üretir.
//
// Chrome, manifest'teki `key` (SPKI public key, base64) alanından eklenti id'sini
// türetir: SHA-256(DER public key)'in ilk 16 baytı, her yarım-bayt 'a'+nibble
// olarak eşlenir (a–p). Böylece hem paketlenmemiş (dev) hem paketlenmiş yüklemede
// id AYNI kalır ve app'teki EXTENSION_ORIGIN ile eşleşir.
//
// Özel anahtar `.keys/dev-key.pem` (gitignore) — ileride .crx imzası için saklanır.
// Public `key` ve id herkese açıktır; wxt.config.ts'e gömülür.
import crypto from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const keyDir = join(root, ".keys");
const pemPath = join(keyDir, "dev-key.pem");

mkdirSync(keyDir, { recursive: true });

let privatePem;
if (existsSync(pemPath)) {
  privatePem = readFileSync(pemPath, "utf8");
} else {
  const { privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  privatePem = privateKey.export({ type: "pkcs8", format: "pem" });
  writeFileSync(pemPath, privatePem, { mode: 0o600 });
}

const der = crypto
  .createPublicKey(crypto.createPrivateKey(privatePem))
  .export({ type: "spki", format: "der" });
const keyB64 = der.toString("base64");

const hash = crypto.createHash("sha256").update(der).digest();
let id = "";
for (let i = 0; i < 16; i++) {
  id += String.fromCharCode(97 + (hash[i] >> 4));
  id += String.fromCharCode(97 + (hash[i] & 0x0f));
}

console.log(JSON.stringify({ id, origin: `chrome-extension://${id}`, keyB64 }));
