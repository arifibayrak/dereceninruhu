// Mikrofon izni sayfası — NORMAL SEKMEDE açılır. Yan panel/offscreen belge
// tarayıcı izin istemini gösteremediğinden (adres çubuğu yok), izin buradan
// istenir. Verilen izin eklenti origin'i için kalıcıdır → offscreen yakalama da
// erişir. Ses burada YALNIZ izni tetiklemek için alınır, hemen serbest bırakılır.

const statusEl = document.getElementById("status") as HTMLParagraphElement;
const retryEl = document.getElementById("retry") as HTMLButtonElement;

async function request(): Promise<void> {
  statusEl.className = "";
  statusEl.textContent = "Mikrofon izni isteniyor… (tarayıcı sorunca 'İzin ver'e bas)";
  retryEl.hidden = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    statusEl.className = "ok";
    statusEl.textContent =
      "✅ Mikrofon izni verildi. Bu sekmeyi kapatıp panele dön ve Başlat'a bas.";
    setTimeout(() => window.close(), 1600);
  } catch {
    statusEl.className = "err";
    statusEl.textContent =
      "Mikrofon izni verilmedi. Adres çubuğundaki mikrofon simgesine tıklayıp 'Bu eklentiye izin ver'i seç (ya da brave://settings/content/microphone), sonra 'Tekrar dene'ye bas.";
    retryEl.hidden = false;
  }
}

retryEl.addEventListener("click", () => void request());
void request();
