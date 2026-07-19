# Derecenin Ruhu — Canlı Transkript Chrome Eklentisi

Görüşmeleri **cihaz-içi** (WebGPU + Whisper Turbo) canlı yazıya çevirir. Ses
hiçbir zaman kaydedilmez ya da sunucuya gönderilmez — yalnız üretilen **metin**,
koçun seçtiği görüşmeye bağlanıp uygulamaya işlenir ve mevcut AI-öneri boru
hattını besler.

## Mimari (MV3)

```
Side Panel (React)  ⇄  Service Worker  ⇄  Offscreen Document
 öğrenci/görüşme seç     tabCapture id      AudioContext: sekme sesi + mikrofon mix
 Başlat/Durdur           offscreen yaşamı   transformers.js whisper-large-v3-turbo (WebGPU)
 canlı metin + Kaydet    app API (bearer)   kayan pencere → final/partial segment
```

- `entrypoints/sidepanel/*` — yan panel UI (bağlan, seç, başlat/durdur, kaydet).
- `entrypoints/background.ts` — orkestrasyon (tabCapture stream id, offscreen).
- `entrypoints/offscreen/main.ts` — ses yakalama + WebGPU Whisper (ağır iş).
- `lib/` — mesaj sözleşmesi, app API istemcisi, sekme-URL eşleştirme.

## Kurulum (geliştirme)

```bash
cd extension
pnpm install          # postinstall: wxt prepare + ORT wasm'ı public/ort'a kopyalar
pnpm dev              # WXT dev sunucusu; Chrome'a otomatik yükler (ya da .output'u manuel yükle)
```

Manuel yükleme: `chrome://extensions` → Geliştirici modu → "Paketlenmemiş yükle"
→ `extension/.output/chrome-mv3`.

### Sonra (uygulama tarafı)

1. Koç panelinde **Ayarlar → Eklenti** (`/koc/eklenti`) sayfasından bir token
   oluştur.
2. Eklenti yan panelinde "Bağla" alanına token'ı (ve gerekiyorsa sunucu
   adresini) yapıştır.
3. Bir Google Meet / Zoom sekmesi aç. Eklenti simgesine tıkla → panel açılır ve
   planlı görüşmeyi **otomatik eşler** (`meetingUrl` ile).
4. **Başlat** → konuşuldukça canlı Türkçe transkript akar. **Durdur → Kaydet**
   ile metin uygulamaya işlenir; transkript sayfasında AI önerileri belirir.

## Önemli notlar / bilinen tuzaklar

- **CORS / EXTENSION_ORIGIN — zaten bağlı.** Eklenti id'si manifest `key` ile
  **sabitlendi**: `chgfdngapkpilefnccpijdfomddeepjh`. Uygulamanın `.dev.vars` ve
  `wrangler.jsonc` `EXTENSION_ORIGIN` değeri bu origin'e önceden ayarlıdır;
  yapılacak bir şey yok. (Anahtarı değiştirirsen `node scripts/gen-key.mjs` ile
  yeni id'yi üret ve iki yere de yaz.) Mağazadan yayınlarsan mağaza id'sini
  `EXTENSION_ORIGIN`'e virgülle ekle. Not: gerçek yetki kapısı bearer token'dır;
  CORS yalnız tarayıcı kolaylığı.
- **ORT wasm (MV3 uzak-kod yasağı).** transformers.js'in ONNX Runtime wasm'ı
  eklenti içinden servis edilmelidir. `pnpm copy-ort` bunları
  `public/ort/`'a kopyalar ve offscreen `env.backends.onnx.wasm.wasmPaths` oraya
  bakar. Sürüm değişince dosya adları farklılaşabilir; gerekirse script'i
  güncelle.
- **Mikrofon izni.** Offscreen `getUserMedia` mikrofon ister; reddedilirse
  yalnız **sekme sesi** çevrilir (koçun sesi düşer). İzni önceden vermek için
  eklentiye mikrofon erişimi tanımlaman gerekebilir.
- **Model indirme.** İlk kullanımda ~200–800 MB (dtype'a göre) indirilir ve
  tarayıcı önbelleğinde kalır. WebGPU yoksa (`navigator.gpu` tanımsız) çalışmaz.
- **Doğruluk / pencere.** Basit kayan-pencere yaklaşımı; ~24 sn'lik bloklar
  hâlinde işler, sınırda 2 sn taşıma bırakır. Uzun görüşmelerde küçük sözcük
  tekrarları olabilir; istenirse VAD tabanlı segmentasyona geçilebilir.
- **Ses saklanmaz.** Hiçbir `MediaRecorder`/Blob/R2 yok; yalnız Whisper'a
  beslenen geçici `Float32Array` tampon.

## Üretim paketi

```bash
pnpm build            # .output/chrome-mv3
pnpm zip              # mağaza için .zip
```

Paketlenmiş id'yi (sabit `key` ile) uygulamanın `EXTENSION_ORIGIN` değerine
eklemeyi unutma.
