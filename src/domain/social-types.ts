import { z } from "zod";

export const SocialChannelIdSchema = z.enum([
  "x",
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
]);

export type SocialChannelId = z.infer<typeof SocialChannelIdSchema>;
export type SocialMediaKind = "none" | "image" | "video";
export type SocialPostStatus = "published" | "partial_failure" | "failed" | "scheduled";

export interface SocialChannelMetadata {
  id: SocialChannelId;
  label: string;
  accentHex: string;
  maxChars: number;
  requiresVideo: boolean;
  requiresMedia: boolean;
}

export const SOCIAL_CHANNELS: SocialChannelMetadata[] = [
  { id: "x", label: "X (Twitter)", accentHex: "#38bdf8", maxChars: 280, requiresVideo: false, requiresMedia: false },
  { id: "facebook", label: "Facebook Page", accentHex: "#1877F2", maxChars: 5000, requiresVideo: false, requiresMedia: false },
  { id: "instagram", label: "Instagram", accentHex: "#E1306C", maxChars: 2200, requiresVideo: false, requiresMedia: true },
  { id: "youtube", label: "YouTube Shorts", accentHex: "#FF0000", maxChars: 5000, requiresVideo: true, requiresMedia: true },
  { id: "tiktok", label: "TikTok", accentHex: "#2dd4bf", maxChars: 2200, requiresVideo: true, requiresMedia: true },
];

export interface StoredChannelCredential {
  connected: boolean;
  authMode: "oauth" | "token" | "dry_run";
  accountHandle: string;
  externalTargetId?: string;
  encryptedAccessToken: string;
  encryptedRefreshToken?: string;
  dryRun: boolean;
  updatedAt: string;
}

export interface PublicChannelConnection {
  connected: boolean;
  authMode: "oauth" | "token" | "dry_run";
  accountHandle: string;
  externalTargetId?: string;
  maskedToken: string;
  dryRun: boolean;
}

export interface BrandProfileRecord {
  id: string;
  name: string;
  voiceTone: string;
  defaultHashtags: string[];
  channels: Record<SocialChannelId, StoredChannelCredential>;
}

export interface PublicBrandProfile {
  id: string;
  name: string;
  voiceTone: string;
  defaultHashtags: string[];
  channels: Record<SocialChannelId, PublicChannelConnection>;
}

export const PlatformCopyVariantSchema = z.object({
  title: z.string().max(120).optional(),
  caption: z.string().min(1).max(5000),
  hashtags: z.array(z.string()).max(25).default([]),
  callToAction: z.string().max(200).optional(),
});

export type PlatformCopyVariant = z.infer<typeof PlatformCopyVariantSchema>;
export type SocialCopyVariantsMap = Record<SocialChannelId, PlatformCopyVariant>;

export interface ChannelPublishResult {
  channel: SocialChannelId;
  status: "pending" | "published" | "failed" | "skipped";
  externalPostId?: string;
  externalPostUrl?: string;
  errorMessage?: string;
  publishedAt?: string;
  modeUsed?: "live_api" | "dry_run";
  retryCount: number;
}

export interface SocialPostRecord {
  id: string;
  brandId: string;
  brandName: string;
  createdAt: string;
  scheduledAt?: string;
  status: SocialPostStatus;
  topicIntro: string;
  mediaKind: SocialMediaKind;
  mediaUrl?: string;
  channels: SocialChannelId[];
  variants: SocialCopyVariantsMap;
  results: ChannelPublishResult[];
}

export const GenerateSocialCopySchema = z.object({
  topicIntro: z.string().trim().max(2000).default(""),
  mediaUrl: z.string().optional(),
  mediaKind: z.enum(["none", "image", "video"]).default("none"),
  brandName: z.string().trim().min(1).max(100).default("Neramit Brand"),
  voiceTone: z.string().trim().max(200).default("Modern Commercial & Engaging"),
  locale: z.enum(["th", "en"]).default("th"),
  vault: z.unknown().optional(),
}).refine((d) => Boolean(d.topicIntro || d.mediaUrl), {
  message: "กรุณาใส่คำนำ (Topic) หรืออัปโหลดรูปภาพอย่างน้อย 1 อย่าง",
});

export const CreateSocialPostSchema = z.object({
  brandId: z.string().min(1),
  topicIntro: z.string().max(2000).default(""),
  mediaKind: z.enum(["none", "image", "video"]).default("none"),
  mediaUrl: z.string().optional(),
  channels: z.array(SocialChannelIdSchema).min(1, "เลือกอย่างน้อย 1 ช่องทาง"),
  variants: z.record(SocialChannelIdSchema, PlatformCopyVariantSchema),
  scheduledAt: z.string().datetime().optional(),
});

export const UpsertBrandChannelSchema = z.object({
  brandId: z.string().min(1),
  brandName: z.string().trim().min(1).max(80).optional(),
  voiceTone: z.string().trim().max(200).optional(),
  channel: SocialChannelIdSchema.optional(),
  accountHandle: z.string().trim().max(120).optional(),
  externalTargetId: z.string().trim().max(120).optional(),
  accessToken: z.string().trim().max(2048).optional(),
  refreshToken: z.string().trim().max(2048).optional(),
  dryRun: z.boolean().optional(),
});

export const RetrySocialChannelSchema = z.object({
  postId: z.string().min(1),
  channels: z.array(SocialChannelIdSchema).optional(),
});

export function checkChannelMediaCompatibility(
  selectedChannels: SocialChannelId[],
  mediaKind: SocialMediaKind
): {
  compatible: SocialChannelId[];
  requiresVideoConversion: SocialChannelId[];
  requiresAnyMedia: SocialChannelId[];
} {
  const compatible: SocialChannelId[] = [];
  const requiresVideoConversion: SocialChannelId[] = [];
  const requiresAnyMedia: SocialChannelId[] = [];

  for (const chId of selectedChannels) {
    const meta = SOCIAL_CHANNELS.find((c) => c.id === chId);
    if (!meta) continue;
    if (meta.requiresVideo && mediaKind !== "video") {
      requiresVideoConversion.push(chId);
    } else if (meta.requiresMedia && mediaKind === "none") {
      requiresAnyMedia.push(chId);
    } else {
      compatible.push(chId);
    }
  }
  return { compatible, requiresVideoConversion, requiresAnyMedia };
}

export function computePostAggregateStatus(
  results: ChannelPublishResult[]
): SocialPostStatus {
  const publishedCount = results.filter((r) => r.status === "published").length;
  const failedCount = results.filter((r) => r.status === "failed").length;
  const pendingCount = results.filter((r) => r.status === "pending").length;

  if (pendingCount > 0 && publishedCount === 0 && failedCount === 0) {
    return "scheduled";
  }
  if (publishedCount > 0 && failedCount > 0) {
    return "partial_failure";
  }
  if (publishedCount > 0 && failedCount === 0) {
    return "published";
  }
  return "failed";
}
