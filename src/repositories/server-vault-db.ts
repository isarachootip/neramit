import fs from "node:fs";
import path from "node:path";
import { ApiKeyVaultConfig, ApiKeyVaultSchema } from "../domain/neramit-vault-types";
import { decryptSecret, encryptSecret } from "../domain/token-crypto";

interface EncryptedServerVault {
  engineMode: "hybrid" | "simulation";
  encryptedGeminiKey: string;
  encryptedOpenaiKey: string;
  encryptedFalKey: string;
  updatedAt: string;
}

function getVaultFilePath(): string {
  const root = process.env.NERAMIT_DATA_DIR?.trim() || path.join(process.cwd(), "data");
  fs.mkdirSync(root, { recursive: true });
  return path.join(root, "vault.json");
}

export function loadServerVaultConfig(): ApiKeyVaultConfig {
  const filePath = getVaultFilePath();
  const envGemini = process.env.GEMINI_API_KEY?.trim() ?? "";
  const envOpenai = process.env.OPENAI_API_KEY?.trim() ?? "";
  const envFal = process.env.FAL_KEY?.trim() ?? "";

  if (!fs.existsSync(filePath)) {
    return {
      engineMode: "hybrid",
      geminiApiKey: envGemini,
      openaiApiKey: envOpenai,
      falApiKey: envFal,
    };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as Partial<EncryptedServerVault>;
    const gemini = raw.encryptedGeminiKey ? decryptSecret(raw.encryptedGeminiKey) : "";
    const openai = raw.encryptedOpenaiKey ? decryptSecret(raw.encryptedOpenaiKey) : "";
    const fal = raw.encryptedFalKey ? decryptSecret(raw.encryptedFalKey) : "";
    return {
      engineMode: raw.engineMode === "simulation" ? "simulation" : "hybrid",
      geminiApiKey: gemini || envGemini,
      openaiApiKey: openai || envOpenai,
      falApiKey: fal || envFal,
    };
  } catch {
    return {
      engineMode: "hybrid",
      geminiApiKey: envGemini,
      openaiApiKey: envOpenai,
      falApiKey: envFal,
    };
  }
}

export function saveServerVaultConfig(input: unknown): ApiKeyVaultConfig {
  const parsed = ApiKeyVaultSchema.safeParse(input);
  const current = loadServerVaultConfig();
  if (!parsed.success) return current;

  const next = parsed.data;
  const record: EncryptedServerVault = {
    engineMode: next.engineMode,
    encryptedGeminiKey: encryptSecret(next.geminiApiKey || current.geminiApiKey),
    encryptedOpenaiKey: encryptSecret(next.openaiApiKey || current.openaiApiKey),
    encryptedFalKey: encryptSecret(next.falApiKey || current.falApiKey),
    updatedAt: new Date().toISOString(),
  };

  const filePath = getVaultFilePath();
  const tmpFile = `${filePath}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(record, null, 2), "utf8");
  fs.renameSync(tmpFile, filePath);
  return loadServerVaultConfig();
}
