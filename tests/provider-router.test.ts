import assert from "node:assert/strict";
import {
  buildScriptSubtitles,
  mergeVaultWithServerEnv,
  pcm16Base64ToWavDataUrl,
  resolveAudioProvider,
  resolveChatProvider,
  resolveImageProvider,
  resolveVideoProvider,
} from "../src/domain/provider-router";

export interface ProviderTestCase {
  name: string;
  run: () => void;
}

export const providerRouterTests: ProviderTestCase[] = [
  {
    name: "Provider Router: Simulation mode bypasses live keys; Hybrid mode selects matching vendor or active fallback",
    run: () => {
      const simVault = {
        engineMode: "simulation" as const,
        geminiApiKey: "AIzaTest",
        openaiApiKey: "sk-test",
        falApiKey: "fal-test",
      };
      assert.equal(resolveImageProvider("google", simVault).provider, "simulation");
      assert.equal(resolveChatProvider("neramit/gemini-omni-flash-1-1", simVault).provider, "simulation");

      const geminiOnly = mergeVaultWithServerEnv(
        { engineMode: "hybrid", geminiApiKey: "AIzaLiveKey", openaiApiKey: "", falApiKey: "" },
        {}
      );
      // Vendor google -> gemini directly; vendor bytedance -> falls back to active gemini key
      assert.equal(resolveImageProvider("google", geminiOnly).provider, "gemini");
      assert.equal(resolveImageProvider("bytedance", geminiOnly).provider, "gemini");
      assert.equal(resolveChatProvider("neramit/glm-5-3-flash", geminiOnly).provider, "gemini");
      assert.equal(resolveAudioProvider(geminiOnly).provider, "gemini");
      // Video without falApiKey cleanly falls back to simulation
      assert.equal(resolveVideoProvider(geminiOnly).provider, "simulation");

      const fullVault = mergeVaultWithServerEnv(
        { engineMode: "hybrid", geminiApiKey: "", openaiApiKey: "sk-live", falApiKey: "" },
        { FAL_KEY: "fal-env-key" }
      );
      assert.equal(resolveImageProvider("openai", fullVault).provider, "openai");
      assert.equal(resolveImageProvider("bytedance", fullVault).provider, "fal");
      assert.equal(resolveVideoProvider(fullVault).provider, "fal");
      assert.equal(resolveAudioProvider(fullVault).provider, "openai");
    },
  },
  {
    name: "Audio Codec & Subtitles: Encodes raw 16-bit PCM into valid RIFF WAVE Data URL and builds timed SRT cues",
    run: () => {
      const rawPcm = Buffer.alloc(4800, 0).toString("base64");
      const wavUrl = pcm16Base64ToWavDataUrl(rawPcm, 24000);
      assert.equal(wavUrl.startsWith("data:audio/wav;base64,"), true);

      const decoded = Buffer.from(wavUrl.replace("data:audio/wav;base64,", ""), "base64");
      assert.equal(decoded.subarray(0, 4).toString("ascii"), "RIFF");
      assert.equal(decoded.subarray(8, 12).toString("ascii"), "WAVE");
      assert.equal(decoded.length, 44 + 4800);

      const subs = buildScriptSubtitles("สวัสดีครับ ยินดีต้อนรับ. พบกับโปรโมชันพิเศษวันนี้!", 6);
      assert.equal(subs.length, 2);
      assert.equal(subs[0].startMs, 0);
      assert.equal(subs[1].endMs, 6000);
    },
  },
];
