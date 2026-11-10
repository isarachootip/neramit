import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  applyInboundWebhookToPost,
  BrandProfileRecord,
  InboundAutoPostWebhookSchema,
  PublicBrandProfile,
  PublicChannelConnection,
  SOCIAL_CHANNELS,
  SocialChannelId,
  SocialPostRecord,
  UpsertBrandChannelSchema,
} from "../domain/social-types";
import { decryptSecret, encryptSecret, maskSecretPreview } from "../domain/token-crypto";
import {
  INITIAL_BRAND_PROFILES,
  INITIAL_SOCIAL_POSTS,
  makeDefaultBridgeConfig,
  makeDefaultChannels,
} from "./social-seeds";

interface SocialDatabaseShape {
  brands: BrandProfileRecord[];
  posts: SocialPostRecord[];
}

function ensureDirectories(): { dbFile: string; mediaDir: string } {
  const root = process.env.NERAMIT_DATA_DIR?.trim() || path.join(process.cwd(), "data");
  const mediaDir = path.join(root, "media");
  fs.mkdirSync(mediaDir, { recursive: true });
  return { dbFile: path.join(root, "social-db.json"), mediaDir };
}

function normalizeBrandRecord(brand: BrandProfileRecord): BrandProfileRecord {
  const defaults = makeDefaultChannels(brand.id.replace(/^brand-/, ""));
  return {
    ...brand,
    channels: { ...defaults, ...(brand.channels ?? {}) },
    bridge: { ...makeDefaultBridgeConfig(), ...(brand.bridge ?? {}) },
  };
}

function readDb(): SocialDatabaseShape {
  const { dbFile } = ensureDirectories();
  if (!fs.existsSync(dbFile)) {
    const initial: SocialDatabaseShape = { brands: INITIAL_BRAND_PROFILES, posts: INITIAL_SOCIAL_POSTS };
    writeDb(initial);
    return initial;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(dbFile, "utf8")) as Partial<SocialDatabaseShape>;
    const brands = (Array.isArray(parsed.brands) && parsed.brands.length > 0 ? parsed.brands : INITIAL_BRAND_PROFILES).map(normalizeBrandRecord);
    return { brands, posts: Array.isArray(parsed.posts) ? parsed.posts : INITIAL_SOCIAL_POSTS };
  } catch {
    return { brands: INITIAL_BRAND_PROFILES, posts: INITIAL_SOCIAL_POSTS };
  }
}

function writeDb(data: SocialDatabaseShape): void {
  const { dbFile } = ensureDirectories();
  const tmpFile = `${dbFile}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmpFile, dbFile);
}

export function toPublicBrandProfile(brand: BrandProfileRecord): PublicBrandProfile {
  const normalized = normalizeBrandRecord(brand);
  const channels = {} as Record<SocialChannelId, PublicChannelConnection>;
  for (const meta of SOCIAL_CHANNELS) {
    const c = normalized.channels[meta.id];
    const plain = c?.encryptedAccessToken ? decryptSecret(c.encryptedAccessToken) : "";
    channels[meta.id] = {
      connected: Boolean(c?.connected),
      authMode: c?.authMode ?? "dry_run",
      accountHandle: c?.accountHandle ?? "",
      externalTargetId: c?.externalTargetId,
      maskedToken: maskSecretPreview(plain),
      dryRun: c?.dryRun ?? true,
    };
  }
  const b = normalized.bridge ?? makeDefaultBridgeConfig();
  return {
    id: normalized.id,
    name: normalized.name,
    voiceTone: normalized.voiceTone,
    defaultHashtags: normalized.defaultHashtags,
    channels,
    bridge: {
      enabled: b.enabled,
      provider: b.provider,
      endpointUrl: b.endpointUrl,
      maskedBridgeKey: maskSecretPreview(b.encryptedBridgeKey ? decryptSecret(b.encryptedBridgeKey) : ""),
      maskedWebhookSecret: maskSecretPreview(b.encryptedWebhookSecret ? decryptSecret(b.encryptedWebhookSecret) : ""),
      routingMode: b.routingMode,
    },
  };
}

export function listPublicBrandProfiles(): PublicBrandProfile[] {
  return readDb().brands.map(toPublicBrandProfile);
}
export function getBrandProfileById(brandId: string): BrandProfileRecord | undefined {
  const db = readDb();
  return db.brands.find((b) => b.id === brandId) ?? db.brands[0];
}
export function listSocialPosts(): SocialPostRecord[] {
  return readDb().posts;
}

export function upsertBrandProfileAndChannel(
  input: ReturnType<typeof UpsertBrandChannelSchema.parse>
): PublicBrandProfile {
  const db = readDb();
  let brand = db.brands.find((b) => b.id === input.brandId);
  if (!brand) {
    brand = normalizeBrandRecord({
      ...INITIAL_BRAND_PROFILES[0],
      id: input.brandId,
      name: input.brandName ?? "New Brand Profile",
      voiceTone: input.voiceTone ?? "Modern Commercial",
      channels: makeDefaultChannels(input.brandId.replace(/^brand-/, "")),
      bridge: makeDefaultBridgeConfig(),
    });
    db.brands.push(brand);
  } else {
    if (input.brandName) brand.name = input.brandName;
    if (input.voiceTone) brand.voiceTone = input.voiceTone;
  }

  if (input.channel) {
    const prev = brand.channels[input.channel];
    const hasNewToken = Boolean(input.accessToken && input.accessToken.length > 0);
    const nextEncrypted = hasNewToken ? encryptSecret(input.accessToken ?? "") : prev.encryptedAccessToken;
    const nextRefresh = input.refreshToken ? encryptSecret(input.refreshToken) : prev.encryptedRefreshToken;
    const nextDryRun = input.dryRun !== undefined ? input.dryRun : !Boolean(nextEncrypted);
    brand.channels[input.channel] = {
      connected: true,
      authMode: nextDryRun ? "dry_run" : hasNewToken ? "token" : prev.authMode,
      accountHandle: input.accountHandle ?? prev.accountHandle,
      externalTargetId: input.externalTargetId ?? prev.externalTargetId,
      encryptedAccessToken: nextEncrypted,
      encryptedRefreshToken: nextRefresh,
      dryRun: nextDryRun,
      updatedAt: new Date().toISOString(),
    };
  }

  if (input.bridge) {
    const prevB = brand.bridge ?? makeDefaultBridgeConfig();
    brand.bridge = {
      enabled: input.bridge.enabled,
      provider: input.bridge.provider,
      endpointUrl: input.bridge.endpointUrl || prevB.endpointUrl,
      encryptedBridgeKey: input.bridge.bridgeKey ? encryptSecret(input.bridge.bridgeKey) : prevB.encryptedBridgeKey,
      encryptedWebhookSecret: input.bridge.webhookSecret ? encryptSecret(input.bridge.webhookSecret) : prevB.encryptedWebhookSecret,
      routingMode: input.bridge.routingMode,
    };
  }

  writeDb(db);
  return toPublicBrandProfile(brand);
}

export function listSocialPosts(): SocialPostRecord[] {
  return readDb().posts;
}

export function saveSocialPostRecord(post: SocialPostRecord): SocialPostRecord {
  const db = readDb();
  const idx = db.posts.findIndex((p) => p.id === post.id);
  if (idx >= 0) db.posts[idx] = post;
  else db.posts.unshift(post);
  db.posts = db.posts.slice(0, 100);
  writeDb(db);
  return post;
}

export function updateSocialPostFromWebhook(
  payload: z.infer<typeof InboundAutoPostWebhookSchema>
): SocialPostRecord | null {
  const db = readDb();
  const idx = db.posts.findIndex((p) => p.id === payload.postId);
  if (idx < 0) return null;
  const updated = applyInboundWebhookToPost(db.posts[idx], payload);
  db.posts[idx] = updated;
  writeDb(db);
  return updated;
}

export function resolvePublicMediaUrl(mediaUrl: string | undefined, baseOrigin: string): string | undefined {
  if (!mediaUrl) return undefined;
  if (mediaUrl.startsWith("https://") || mediaUrl.startsWith("http://")) return mediaUrl;
  if (mediaUrl.startsWith("/")) return `${baseOrigin}${mediaUrl}`;
  if (mediaUrl.startsWith("data:")) {
    const match = mediaUrl.match(/^data:(image|video)\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) return undefined;
    const ext = match[2] === "jpeg" ? "jpg" : match[2].replace(/[^a-z0-9]/gi, "");
    const fileName = `asset-${Date.now()}.${ext || "png"}`;
    fs.writeFileSync(path.join(ensureDirectories().mediaDir, fileName), Buffer.from(match[3], "base64"));
    return `${baseOrigin}/api/social/media/${fileName}`;
  }
  return mediaUrl;
}

export function getStagedMediaFilePath(fileName: string): string | null {
  if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) return null;
  const fullPath = path.join(ensureDirectories().mediaDir, fileName);
  return fs.existsSync(fullPath) ? fullPath : null;
}
