import { describe, expect, it } from "vitest";
import {
  AsrError,
  applyOverride,
  asrErrorMessage,
  plansFor,
} from "./asr-engine";

describe("plansFor", () => {
  it("fp16 destekleyen GPU: whisper-small fp16 ilk sırada", () => {
    const [first] = plansFor({ available: true, fp16: true });
    expect(first.device).toBe("webgpu");
    expect(first.modelId).toBe("onnx-community/whisper-small");
    expect(first.dtype).toMatchObject({ encoder_model: "fp16" });
  });

  it("fp16'sız GPU (tablet): fp16 hiçbir planda geçmez", () => {
    const plans = plansFor({ available: true, fp16: false });
    expect(plans.length).toBeGreaterThan(0);
    for (const p of plans) {
      expect(JSON.stringify(p.dtype)).not.toContain("fp16");
    }
    expect(plans[0].device).toBe("webgpu");
  });

  it("WebGPU yok: tek plan ve CPU (wasm)", () => {
    const plans = plansFor({ available: false, fp16: false });
    expect(plans).toHaveLength(1);
    expect(plans[0].device).toBe("wasm");
    expect(plans[0].slow).toBe(true);
  });

  it("her merdivenin son basamağı GPU'suz çalışabilen plandır", () => {
    for (const caps of [
      { available: true, fp16: true },
      { available: true, fp16: false },
      { available: false, fp16: false },
    ]) {
      const plans = plansFor(caps);
      expect(plans.at(-1)?.device).toBe("wasm");
    }
  });
});

describe("applyOverride", () => {
  const auto = plansFor({ available: true, fp16: true });

  it("geçersiz/boş değer merdiveni değiştirmez", () => {
    expect(applyOverride(auto, null)).toBe(auto);
    expect(applyOverride(auto, "saçma")).toBe(auto);
  });

  it("\"base\" fp16'sız plandan başlatır, yedek olarak wasm bırakır", () => {
    const plans = applyOverride(auto, "base");
    expect(plans.map((p) => p.device)).toEqual(["webgpu", "wasm"]);
    expect(JSON.stringify(plans[0].dtype)).not.toContain("fp16");
  });

  it("\"wasm\" yalnız CPU planını bırakır", () => {
    expect(applyOverride(auto, "wasm").map((p) => p.device)).toEqual(["wasm"]);
  });
});

describe("asrErrorMessage", () => {
  it("fp16 hatasını Türkçeye çevirir (ham İngilizce sızmaz)", () => {
    const msg = asrErrorMessage(
      new Error("The device (webgpu) does not support fp16."),
    );
    expect(msg).toContain("fp16");
    expect(msg).not.toContain("does not support");
    expect(msg).toContain("Ses kaydından");
  });

  it("ağ hatasını indirme sorunu olarak anlatır", () => {
    expect(asrErrorMessage(new TypeError("Failed to fetch"))).toContain(
      "İnternet bağlantını",
    );
  });

  it("bilinmeyen hatada ham mesajı tanı için korur", () => {
    expect(asrErrorMessage(new Error("kernel exploded"))).toBe(
      "Transkript başlatılamadı (kernel exploded).",
    );
  });

  it("AsrError zaten Türkçedir — tekrar sarmalanmaz", () => {
    expect(asrErrorMessage(new AsrError("Model indirilemedi."))).toBe(
      "Model indirilemedi.",
    );
  });
});
