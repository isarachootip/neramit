import { ApiKeyVaultConfig, ApiKeyVaultSchema } from "./neramit-vault-types";
import { AudioSubtitleSentence, VendorName } from "./studio-types";

export type LiveProviderId = "gemini" | "openai" | "fal" | "simulation";

export interface ResolvedProvider {
  provider: LiveProviderId;
  apiKey: string;
  label: string;
}

export interface ServerProviderEnv {
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  FAL_KEY?: string;
}

export function mergeVaultWithServerEnv(
  rawVault: unknown,
  env: ServerProviderEnv = process.env as ServerProviderEnv
): ApiKeyVaultConfig {
  const parsed = ApiKeyVaultSchema.safeParse(rawVault ?? {});
  const base: ApiKeyVaultConfig = parsed.success
    ? parsed.data
    : { engineMode: "hybrid", geminiApiKey: "", openaiApiKey: "", falApiKey: "" };

  return {
    engineMode: base.engineMode,
    geminiApiKey: base.geminiApiKey || (env.GEMINI_API_KEY?.trim() ?? ""),
    openaiApiKey: base.openaiApiKey || (env.OPENAI_API_KEY?.trim() ?? ""),
    falApiKey: base.falApiKey || (env.FAL_KEY?.trim() ?? ""),
  };
}

export function hasAnyLiveKey(vault: ApiKeyVaultConfig): boolean {
  return Boolean(
    vault.engineMode === "hybrid" &&
      (vault.geminiApiKey || vault.openaiApiKey || vault.falApiKey)
  );
}

export function resolveImageProvider(
  vendor: VendorName,
  vault: ApiKeyVaultConfig
): ResolvedProvider {
  if (vault.engineMode === "simulation") {
    return { provider: "simulation", apiKey: "", label: "Simulation · Neramit Preview" };
  }

  if (vendor === "google" && vault.geminiApiKey) {
    return { provider: "gemini", apiKey: vault.geminiApiKey, label: "Live · Google Gemini Image" };
  }
  if (vendor === "openai" && vault.openaiApiKey) {
    return { provider: "openai", apiKey: vault.openaiApiKey, label: "Live · OpenAI Image API" };
  }
  if ((vendor === "bytedance" || vendor === "blackforestlabs" || vendor === "xai") && vault.falApiKey) {
    return { provider: "fal", apiKey: vault.falApiKey, label: "Live · Fal.ai GPU Cloud" };
  }

  // Smart cross-vendor fallback when the user configured at least one live API key
  if (vault.falApiKey) {
    return { provider: "fal", apiKey: vault.falApiKey, label: "Live · Fal.ai GPU Cloud" };
  }
  if (vault.geminiApiKey) {
    return { provider: "gemini", apiKey: vault.geminiApiKey, label: "Live · Google Gemini Image" };
  }
  if (vault.openaiApiKey) {
    return { provider: "openai", apiKey: vault.openaiApiKey, label: "Live · OpenAI Image API" };
  }

  return { provider: "simulation", apiKey: "", label: "Simulation · Neramit Preview" };
}

export function resolveVideoProvider(vault: ApiKeyVaultConfig): ResolvedProvider {
  if (vault.engineMode === "hybrid" && vault.falApiKey) {
    return { provider: "fal", apiKey: vault.falApiKey, label: "Live · Fal.ai Video Cloud" };
  }
  return { provider: "simulation", apiKey: "", label: "Simulation · Neramit Video Preview" };
}

export function resolveChatProvider(
  modelAlias: string,
  vault: ApiKeyVaultConfig
): ResolvedProvider {
  if (vault.engineMode === "simulation") {
    return { provider: "simulation", apiKey: "", label: "Simulation · Neramit Director" };
  }
  if (modelAlias.includes("gemini") && vault.geminiApiKey) {
    return { provider: "gemini", apiKey: vault.geminiApiKey, label: "Live · Gemini 2.5 Flash" };
  }
  if (vault.geminiApiKey) {
    return { provider: "gemini", apiKey: vault.geminiApiKey, label: "Live · Gemini 2.5 Flash" };
  }
  if (vault.openaiApiKey) {
    return { provider: "openai", apiKey: vault.openaiApiKey, label: "Live · OpenAI GPT-4o Mini" };
  }
  return { provider: "simulation", apiKey: "", label: "Simulation · Neramit Director" };
}

export function resolveAudioProvider(vault: ApiKeyVaultConfig): ResolvedProvider {
  if (vault.engineMode === "simulation") {
    return { provider: "simulation", apiKey: "", label: "Simulation · Seed Audio Preview" };
  }
  if (vault.openaiApiKey) {
    return { provider: "openai", apiKey: vault.openaiApiKey, label: "Live · OpenAI Neural TTS" };
  }
  if (vault.geminiApiKey) {
    return { provider: "gemini", apiKey: vault.geminiApiKey, label: "Live · Gemini 2.5 Neural TTS" };
  }
  return { provider: "simulation", apiKey: "", label: "Simulation · Seed Audio Preview" };
}

export function pcm16Base64ToWavDataUrl(pcmBase64: string, sampleRate = 24000): string {
  const pcmBuffer = Buffer.from(pcmBase64, "base64");
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(pcmBuffer.length, 40);

  const wavBuffer = Buffer.concat([header, pcmBuffer]);
  return `data:audio/wav;base64,${wavBuffer.toString("base64")}`;
}

export function buildScriptSubtitles(
  script: string,
  totalSeconds: number
): AudioSubtitleSentence[] {
  const parts = script
    .split(/(?<=[.!?।])\s+|\s{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  const items = parts.length > 0 ? parts : [script.trim()];
  const totalMs = Math.max(1500, Math.round(totalSeconds * 1000));
  const stepMs = Math.floor(totalMs / items.length);

  return items.map((text, idx) => ({
    startMs: idx * stepMs,
    endMs: idx === items.length - 1 ? totalMs : (idx + 1) * stepMs,
    text,
  }));
}
