import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearToken,
  fetchPickerData,
  getSelection,
  getSettings,
  maskToken,
  postTranscript,
  saveSelection,
  saveSettings,
  transcriptLink,
  type ExtSession,
  type ExtStudent,
  type Selection,
  type Settings,
} from "@/lib/api";
import { matchSession } from "@/lib/match";
import type { CaptureState, ExtMessage } from "@/lib/messages";

type Saved = {
  transcriptId: number;
  url: string;
  proposalCount: number;
  extractionFailed?: boolean;
};

const VERSION = chrome.runtime?.getManifest?.().version ?? "";

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="9" fill="url(#dr-g)" />
        <rect x="8" y="18" width="3.6" height="6" rx="1.8" fill="#fff" opacity="0.9" />
        <rect x="14.2" y="13" width="3.6" height="11" rx="1.8" fill="#fff" opacity="0.95" />
        <rect x="20.4" y="8.5" width="3.6" height="15.5" rx="1.8" fill="#fff" />
        <defs>
          <linearGradient
            id="dr-g"
            x1="0"
            y1="0"
            x2="32"
            y2="32"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

function Brand() {
  return (
    <div className="brand">
      <BrandMark />
      <div className="brand-text">
        <span className="brand-title">Canlı Transkript</span>
        <span className="brand-sub">Derecenin Ruhu</span>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <span className="footer-note">
        Ses kaydedilmez · yazıya çevirme cihazında (WebGPU)
      </span>
      {VERSION ? <span className="ver">v{VERSION}</span> : null}
    </footer>
  );
}

export function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [baseInput, setBaseInput] = useState("");

  const [students, setStudents] = useState<ExtStudent[]>([]);
  const [sessions, setSessions] = useState<ExtSession[]>([]);
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [autoMatched, setAutoMatched] = useState<ExtSession | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [capture, setCapture] = useState<CaptureState | "idle">("idle");
  const [modelStatus, setModelStatus] = useState("");
  const [finals, setFinals] = useState<string[]>([]);
  const [partial, setPartial] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [saving, setSaving] = useState(false);

  const transcriptRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async (s: Settings, saved?: Selection) => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchPickerData(s);
      setStudents(data.students);
      setSessions(data.sessions);
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const match = matchSession(tab?.url, data.sessions);
      if (match) {
        // Aktif sekme bir planlı görüşmeyle eşleşiyorsa o kazanır.
        setAutoMatched(match);
        setEnrollmentId(match.enrollmentId);
        setSessionId(match.id);
      } else if (
        saved?.enrollmentId != null &&
        data.students.some((st) => st.enrollmentId === saved.enrollmentId)
      ) {
        // Eşleşme yoksa son seçimi geri yükle (hâlâ geçerliyse).
        setEnrollmentId(saved.enrollmentId);
        setSessionId(
          saved.sessionId != null &&
            data.sessions.some((se) => se.id === saved.sessionId)
            ? saved.sessionId
            : null,
        );
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Veri alınamadı.");
    } finally {
      setLoading(false);
    }
  }, []);

  // İlk yükleme: ayarlar + (token varsa) veri + aktif sekme eşlemesi / son seçim.
  useEffect(() => {
    void (async () => {
      const s = await getSettings();
      setSettings(s);
      setBaseInput(s.baseUrl);
      if (s.token) {
        const saved = await getSelection();
        await loadData(s, saved);
      }
    })();
  }, [loadData]);

  // Seçim değişince kalıcılaştır (panel yeniden açılınca geri gelsin).
  useEffect(() => {
    if (!settings?.token) return;
    void saveSelection({ enrollmentId, sessionId });
  }, [enrollmentId, sessionId, settings?.token]);

  // Offscreen / service worker mesajlarını dinle.
  useEffect(() => {
    const listener = (msg: ExtMessage) => {
      if (msg?.type === "SEGMENT") {
        if (msg.kind === "final") {
          setFinals((f) => [...f, msg.text]);
          setPartial("");
        } else {
          setPartial(msg.text);
        }
      } else if (msg?.type === "MODEL_PROGRESS") {
        setModelStatus(msg.status);
      } else if (msg?.type === "CAPTURE_STATE") {
        setCapture(msg.state);
        if (msg.error) setNotice(msg.error);
        if (msg.state === "running") setModelStatus("");
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [finals, partial]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.enrollmentId === enrollmentId) ?? null,
    [students, enrollmentId],
  );
  const enrollmentSessions = useMemo(
    () => sessions.filter((s) => s.enrollmentId === enrollmentId),
    [sessions, enrollmentId],
  );
  const fullText = useMemo(
    () =>
      [...finals, partial]
        .map((t) => t.trim())
        .filter(Boolean)
        .join(" "),
    [finals, partial],
  );

  const connect = async () => {
    if (tokenInput.trim().length < 8) {
      setNotice("Token çok kısa görünüyor.");
      return;
    }
    await saveSettings({ token: tokenInput.trim(), baseUrl: baseInput.trim() });
    const s = await getSettings();
    setSettings(s);
    setTokenInput("");
    setNotice(null);
    await loadData(s);
  };

  const disconnect = async () => {
    await clearToken();
    setSettings((prev) => (prev ? { ...prev, token: null } : prev));
    setStudents([]);
    setSessions([]);
    setEnrollmentId(null);
    setSessionId(null);
    setAutoMatched(null);
  };

  const start = async () => {
    if (!enrollmentId) {
      setNotice("Önce bir öğrenci/görüşme seç.");
      return;
    }
    setFinals([]);
    setPartial("");
    setSaved(null);
    setNotice(null);

    // Mikrofon izni. Yan panel & offscreen belge tarayıcı iznini GÖSTEREMEZ
    // (adres çubuğu yok) → istem hiç çıkmadan reddedilir. İzin zaten verilmişse
    // bu prob sessizce geçer; değilse izni NORMAL SEKMEDE isteyen sayfayı açarız
    // (orada tarayıcı istemi + adres çubuğu mikrofon simgesi görünür).
    try {
      const probe = await navigator.mediaDevices?.getUserMedia({ audio: true });
      probe?.getTracks().forEach((t) => t.stop());
    } catch {
      setCapture("error");
      setNotice(
        "Mikrofon izni gerekli. Açılan sekmede 'İzin ver'e bas (ya da adres çubuğundaki mikrofon simgesinden bu eklentiye izin ver), sonra panele dönüp yeniden Başlat'a bas.",
      );
      void chrome.tabs.create({ url: chrome.runtime.getURL("permission.html") });
      return;
    }

    // Sekme sesi opsiyonel: aktif sekme varsa en iyi çabayla eklenir, yoksa
    // yalnız mikrofonla devam (telefon/WhatsApp/yüz yüze görüşmeler için).
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    setCapture("starting");
    const res = (await chrome.runtime.sendMessage({
      type: "START_CAPTURE",
      tabId: tab?.id ?? null,
    })) as { ok: boolean; error?: string } | undefined;
    if (res && !res.ok) {
      setCapture("error");
      const raw = res.error || "";
      // Chrome'un ham tabCapture hatasını eyleme dönük Türkçe mesaja çevir.
      const friendly = /invoked|activeTab|Chrome pages/i.test(raw)
        ? "Bu sekmede eklenti henüz yetkilenmedi. Bu Meet/Zoom sekmesindeyken araç çubuğundaki eklenti simgesine bir kez tıkla (panel yeniden açılır), sonra hemen Başlat'a bas. Not: chrome:// ve Yeni Sekme sayfaları yakalanamaz."
        : raw || "Kayıt başlatılamadı.";
      setNotice(friendly);
    }
  };

  const stop = () => {
    void chrome.runtime.sendMessage({ type: "STOP_CAPTURE" });
  };

  const save = async () => {
    if (!settings || !enrollmentId) return;
    if (fullText.length < 20) {
      setNotice("Kaydedilecek transkript çok kısa.");
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const res = await postTranscript(settings, {
        enrollmentId,
        coachingSessionId: sessionId,
        rawText: fullText,
      });
      const url = selectedStudent
        ? transcriptLink(settings.baseUrl, selectedStudent.studentId, res.transcriptId)
        : settings.baseUrl;
      setSaved({ ...res, url });
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const isRunning = capture === "running" || capture === "starting";
  const isStopped = capture === "stopped" || capture === "error";

  // --- Bağlı değil: token ekranı ---
  if (!settings?.token) {
    return (
      <div className="app app--center">
        <header className="topbar">
          <Brand />
        </header>

        <section className="section">
          <div className="section-head">
            <span className="section-title">Bağlantı</span>
          </div>
          <p className="hint">
            Hesabına bağlamak için koç panelinde{" "}
            <strong>Ayarlar → Eklenti</strong> sayfasından bir token oluştur ve
            buraya yapıştır.
          </p>
          <div className="field">
            <label htmlFor="token">Eklenti token&apos;ı</label>
            <input
              id="token"
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void connect();
              }}
              placeholder="drx_…"
            />
          </div>
          <div className="field">
            <label htmlFor="base">Sunucu adresi</label>
            <input
              id="base"
              value={baseInput}
              onChange={(e) => setBaseInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void connect();
              }}
              placeholder="https://dereceninruhu.com"
            />
          </div>
          <button className="btn btn-primary btn-block" onClick={connect}>
            Bağla
          </button>
          {notice ? <div className="note">{notice}</div> : null}
        </section>

        <Footer />
      </div>
    );
  }

  // --- Bağlı: ana ekran ---
  return (
    <div className="app">
      <header className="topbar">
        <Brand />
        <button className="btn btn-ghost btn-sm" onClick={disconnect}>
          Çıkış
        </button>
      </header>

      <div className="conn">
        <span className="dot-ok" />
        <span className="conn-text">
          Bağlı · <code>{maskToken(settings.token)}</code>
        </span>
        <span className="conn-host">
          {settings.baseUrl.replace(/^https?:\/\//, "")}
        </span>
      </div>

      {loadError ? (
        <div className="err">
          {loadError}{" "}
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => settings && loadData(settings)}
          >
            Tekrar dene
          </button>
        </div>
      ) : null}

      <section className="section">
        <div className="section-head">
          <span className="section-title">Görüşme</span>
          {isRunning ? (
            <span className="rec">
              <span className="rec-dot" /> Kaydediliyor
            </span>
          ) : null}
        </div>

        {autoMatched ? (
          <div className="matched">
            <span className="matched-label">Algılandı</span>
            <strong>{autoMatched.studentName}</strong>
            <span className="muted">
              {new Date(autoMatched.scheduledAt).toLocaleString("tr-TR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ) : null}

        <div className="field">
          <label htmlFor="student">Öğrenci</label>
          <select
            id="student"
            value={enrollmentId ?? ""}
            disabled={isRunning || loading}
            onChange={(e) => {
              const id = e.target.value ? Number(e.target.value) : null;
              setEnrollmentId(id);
              setSessionId(null);
              setAutoMatched(null);
            }}
          >
            <option value="">{loading ? "Yükleniyor…" : "Seç…"}</option>
            {students.map((s) => (
              <option key={s.enrollmentId} value={s.enrollmentId}>
                {s.fullName} · {s.examCode}
              </option>
            ))}
          </select>
        </div>

        {enrollmentSessions.length > 0 ? (
          <div className="field">
            <label htmlFor="session">Görüşme (opsiyonel)</label>
            <select
              id="session"
              value={sessionId ?? ""}
              disabled={isRunning}
              onChange={(e) =>
                setSessionId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Bağlama…</option>
              {enrollmentSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {new Date(s.scheduledAt).toLocaleString("tr-TR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {!isRunning ? (
          <button
            className="btn btn-rec btn-block"
            onClick={start}
            disabled={!enrollmentId}
          >
            Başlat
          </button>
        ) : (
          <button className="btn btn-danger btn-block" onClick={stop}>
            <span className="rec-dot" /> Durdur
          </button>
        )}

        {modelStatus ? <div className="progress">{modelStatus}</div> : null}
      </section>

      <section className="section section--grow">
        <div className="section-head">
          <span className="section-title">Transkript</span>
        </div>
        <div className="transcript" ref={transcriptRef}>
          {finals.length === 0 && !partial ? (
            <span className="muted small">
              {isRunning
                ? "Dinleniyor… konuşuldukça metin burada akacak."
                : "Başlat'a basınca canlı transkript burada görünür."}
            </span>
          ) : (
            <>
              {finals.join(" ")}
              {partial ? <span className="partial"> {partial}</span> : null}
            </>
          )}
        </div>
      </section>

      {isStopped && fullText.length >= 20 && !saved ? (
        <button
          className="btn btn-primary btn-block"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Kaydediliyor…" : "Kaydet ve önerileri çıkar"}
        </button>
      ) : null}

      {saved ? (
        <div className="ok">
          Kaydedildi.{" "}
          {saved.extractionFailed
            ? "AI çıkarımı şimdilik yapılamadı; uygulamadan tekrar deneyebilirsin. "
            : `${saved.proposalCount} öneri çıkarıldı. `}
          <a href={saved.url} target="_blank" rel="noreferrer">
            Uygulamada incele →
          </a>
        </div>
      ) : null}

      {notice ? <div className="note">{notice}</div> : null}

      <Footer />
    </div>
  );
}
