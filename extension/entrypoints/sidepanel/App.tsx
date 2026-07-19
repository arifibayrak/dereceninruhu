import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearToken,
  fetchPickerData,
  getSettings,
  postTranscript,
  saveSettings,
  transcriptLink,
  type ExtSession,
  type ExtStudent,
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

  const loadData = useCallback(async (s: Settings) => {
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
        setAutoMatched(match);
        setEnrollmentId(match.enrollmentId);
        setSessionId(match.id);
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Veri alınamadı.");
    } finally {
      setLoading(false);
    }
  }, []);

  // İlk yükleme: ayarlar + (token varsa) veri + aktif sekme eşlemesi.
  useEffect(() => {
    void (async () => {
      const s = await getSettings();
      setSettings(s);
      setBaseInput(s.baseUrl);
      if (s.token) await loadData(s);
    })();
  }, [loadData]);

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
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) {
      setNotice("Aktif sekme bulunamadı.");
      return;
    }
    setCapture("starting");
    const res = (await chrome.runtime.sendMessage({
      type: "START_CAPTURE",
      tabId: tab.id,
    })) as { ok: boolean; error?: string } | undefined;
    if (res && !res.ok) {
      setCapture("error");
      setNotice(res.error || "Kayıt başlatılamadı.");
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
      <div className="wrap">
        <h1>Canlı Transkript</h1>
        <p className="small muted">
          Eklentiyi Derecenin Ruhu hesabına bağlamak için koç panelinden
          (Ayarlar → Eklenti) bir token oluştur ve buraya yapıştır.
        </p>
        <div className="card">
          <div>
            <label htmlFor="token">Eklenti token&apos;ı</label>
            <input
              id="token"
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="drx_…"
            />
          </div>
          <div>
            <label htmlFor="base">Sunucu adresi</label>
            <input
              id="base"
              value={baseInput}
              onChange={(e) => setBaseInput(e.target.value)}
              placeholder="https://dereceninruhu.com"
            />
          </div>
          <button className="btn btn-primary" onClick={connect}>
            Bağla
          </button>
        </div>
        {notice ? <div className="note">{notice}</div> : null}
      </div>
    );
  }

  // --- Bağlı: ana ekran ---
  return (
    <div className="wrap">
      <div className="row between">
        <h1>Canlı Transkript</h1>
        <button className="btn btn-sm" onClick={disconnect}>
          Bağlantıyı kes
        </button>
      </div>

      {loadError ? (
        <div className="err">
          {loadError}{" "}
          <button
            className="btn btn-sm"
            onClick={() => settings && loadData(settings)}
          >
            Tekrar dene
          </button>
        </div>
      ) : null}

      <div className="card">
        {autoMatched ? (
          <div className="ok small">
            Görüşme algılandı: <strong>{autoMatched.studentName}</strong> —{" "}
            {new Date(autoMatched.scheduledAt).toLocaleString("tr-TR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        ) : null}

        <div>
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
          <div>
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

        <div className="row">
          {!isRunning ? (
            <button
              className="btn btn-primary grow"
              onClick={start}
              disabled={!enrollmentId}
            >
              Başlat
            </button>
          ) : (
            <button className="btn btn-danger grow" onClick={stop}>
              <span className="dot" /> Durdur
            </button>
          )}
        </div>

        {modelStatus ? <div className="note">{modelStatus}</div> : null}
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

      {isStopped && fullText.length >= 20 && !saved ? (
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Kaydediliyor…" : "Kaydet ve önerileri çıkar"}
        </button>
      ) : null}

      {saved ? (
        <div className="ok small">
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

      <p className="footer small muted">
        Ses hiçbir zaman kaydedilmez ya da sunucuya gönderilmez; yazıya çevirme
        tamamen bu cihazda (WebGPU) çalışır.
      </p>
    </div>
  );
}
