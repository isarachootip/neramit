import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const FALLBACK_DEV_SEED = "neramit-default-dev-vault-aes-key-2026";

function deriveAesKey(seed?: string): Buffer {
  const raw =
    seed?.trim() ||
    process.env.NERAMIT_ENCRYPTION_KEY?.trim() ||
    FALLBACK_DEV_SEED;
  return crypto.createHash("sha256").update(raw, "utf8").digest();
}

export function encryptSecret(plainText: string, customSeed?: string): string {
  if (!plainText) return "";
  const key = deriveAesKey(customSeed);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `enc:v1:${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(payload: string, customSeed?: string): string {
  if (!payload) return "";
  if (!payload.startsWith("enc:v1:")) return payload;
  const parts = payload.split(":");
  if (parts.length !== 5) {
    throw new Error("Malformed encrypted secret payload");
  }
  const key = deriveAesKey(customSeed);
  const iv = Buffer.from(parts[2], "base64");
  const authTag = Buffer.from(parts[3], "base64");
  const cipherBytes = Buffer.from(parts[4], "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(cipherBytes), decipher.final()]);
  return decrypted.toString("utf8");
}

export function maskSecretPreview(secret: string): string {
  const trimmed = secret.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 8) return "••••";
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}
