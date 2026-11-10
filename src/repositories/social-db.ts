import fs from "node:fs";
import path from "node:path";
import {
  BrandProfileRecord,
  PublicBrandProfile,
  PublicChannelConnection,
  SOCIAL_CHANNELS,
  SocialChannelId,
  SocialPostRecord,
  UpsertBrandChannelSchema,
} from "../domain/social-types";
import { decryptSecret, encryptSecret, maskSecretPreview } from "../domain/token-crypto";
import { INITIAL_BRAND_PROFILES, INITIAL_SOCIAL_POSTS } from "./social-seeds";

interface SocialDatabaseShape {
  brands: BrandProfileRecord[];
  posts: SocialPostRecord[];
}

function getDataRoot(): string {
  return process.env.NERAMIT_DATA_DIR?.trim() || path.join(process.cwd(), "data");
}

function ensureDirectories(): { dbFile: string; mediaDir: string } {
  const root = getDataRoot();
  const mediaDir = path.join(root, "media");
  fs.mkdirSync(mediaDir, { recursive: true });
  return { dbFile: path.join(root, "social-db.json"), mediaDir };
}

function readDb(): SocialDatabaseShape {
  const { dbFile } = ensureDirectories();
  if (!fs.existsSync(dbFile)) {
    const initial: SocialDatabaseShape = {
      brands: INITIAL_BRAND_PROFILES,
      posts: INITIAL_SOCIAL_POSTS,
    };
    writeDb(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(dbFile, "utf8");
    const parsed = JSON.parse(raw) as Partial<SocialDatabaseShape>;
    return {
      brands: Array.isArray(parsed.brands) && parsed.brands.length > 0 ? parsed.brands : INITIAL_BRAND_PROFILES,
      posts: Array.isArray(parsed.posts) ? parsed.posts : INITIAL_SOCIAL_POSTS,
    };
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
  const channels = {} as Record<SocialChannelId, PublicChannelConnection>;
  for (const meta of SOCIAL_CHANNELS) {
    const c = brand.channels[meta.id];
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
  return {
    id: brand.id,
    name: brand.name,
    voiceTone: brand.voiceTone,
    defaultHashtags: brand.defaultHashtags,
    channels,
  };
}

export function listPublicBrandProfiles(): PublicBrandProfile[] {
  return readDb().brands.map(toPublicBrandProfile);
}

export function getBrandProfileById(brandId: string): BrandProfileRecord | undefined {
  const db = readDb();
  return db.brands.find((b) => b.id === brandId) ?? db.brands[0];
}

export function upsertBrandProfileAndChannel(
  input: ReturnType<typeof UpsertBrandChannelSchema.parse>
): PublicBrandProfile {
  const db = readDb();
  let brand = db.brands.find((b) => b.id === input.brandId);

  if (!brand) {
    brand = {
      ...INITIAL_BRAND_PROFILES[0],
      id: input.brandId,
      name: input.brandName ?? "New Brand Profile",
      voiceTone: input.voiceTone ?? "Modern Commercial",
      channels: JSON.parse(JSON.stringify(INITIAL_BRAND_PROFILES[0].channels)) as BrandProfileRecord["channels"],
    };
    db.brands.push(brand);
  } else {
    if (input.brandName) brand.name = input.brandName;
    if (input.voiceTone) brand.voiceTone = input.voiceTone;
  }

  if (input.channel) {
    const prev = brand.channels[input.channel];
    const hasNewToken = Boolean(input.accessToken && input.accessToken.length > 0);
    const nextEncrypted = hasNewToken
      ? encryptSecret(input.accessToken ?? "")
      : prev.encryptedAccessToken;
    const nextRefresh = input.refreshToken
      ? encryptSecret(input.refreshToken)
      : prev.encryptedRefreshToken;
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

export function resolvePublicMediaUrl(mediaUrl: string | undefined, baseOrigin: string): string | undefined {
  if (!mediaUrl) return undefined;
  if (mediaUrl.startsWith("https://") || mediaUrl.startsWith("http://")) return mediaUrl;
  if (mediaUrl.startsWith("/")) return `${baseOrigin}${mediaUrl}`;
  if (mediaUrl.startsWith("data:")) {
    const match = mediaUrl.match(/^data:(image|video)\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) return undefined;
    const ext = match[2] === "jpeg" ? "jpg" : match[2].replace(/[^a-z0-9]/gi, "");
    const fileName = `asset-${Date.now()}.${ext || "png"}`;
    const { mediaDir } = ensureDirectories();
    fs.writeFileSync(path.join(mediaDir, fileName), Buffer.from(match[3], "base64"));
    return `${baseOrigin}/api/social/media/${fileName}`;
  }
  return mediaUrl;
}

export function getStagedMediaFilePath(fileName: string): string | null {
  if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) return null;
  const { mediaDir } = ensureDirectories();
  const fullPath = path.join(mediaDir, fileName);
  return fs.existsSync(fullPath) ? fullPath : null;
}
