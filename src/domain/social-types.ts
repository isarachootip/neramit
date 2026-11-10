import { z } from "zod";

export const SocialChannelIdSchema = z.enum([
  "x", "facebook", "instagram", "youtube", "tiktok", "line", "linkedin", "threads", "telegram",
]);

export type SocialChannelId = z.infer<typeof SocialChannelIdSchema>;
export type SocialMediaKind = "none" | "image" | "video";
export type SocialPostStatus = "published" | "partial_failure" | "failed" | "scheduled";
export type AutoPostBridgeProvider = "vibepost" | "webhook" | "upload_post";
export type AutoPostRoutingMode = "bridge_fallback" | "bridge_primary" | "direct_only";

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
  { id: "line", label: "LINE OA", accentHex: "#06C755", maxChars: 2000, requiresVideo: false, requiresMedia: false },
  { id: "linkedin", label: "LinkedIn", accentHex: "#0A66C2", maxChars: 3000, requiresVideo: false, requiresMedia: false },
  { id: "threads", label: "Threads", accentHex: "#a855f7", maxChars: 500, requiresVideo: false, requiresMedia: false },
  { id: "telegram", label: "Telegram", accentHex: "#229ED9", maxChars: 4096, requiresVideo: false, requiresMedia: false },
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

export interface AutoPostBridgeConfig {
  enabled: boolean;
  provider: AutoPostBridgeProvider;
  endpointUrl: string;
  encryptedBridgeKey: string;
  encryptedWebhookSecret: string;
  routingMode: AutoPostRoutingMode;
}

export interface PublicAutoPostBridgeConfig {
  enabled: boolean;
  provider: AutoPostBridgeProvider;
  endpointUrl: string;
  maskedBridgeKey: string;
  maskedWebhookSecret: string;
  routingMode: AutoPostRoutingMode;
}

export interface DiscoveredSocialTarget {
  id: string;
  label: string;
  handle: string;
  accessToken?: string;
}

export interface BrandProfileRecord {
  id: string;
  name: string;
  voiceTone: string;
  defaultHashtags: string[];
  channels: Record<SocialChannelId, StoredChannelCredential>;
  bridge?: AutoPostBridgeConfig;
}

export interface PublicBrandProfile {
  id: string;
  name: string;
  voiceTone: string;
  defaultHashtags: string[];
  channels: Record<SocialChannelId, PublicChannelConnection>;
  bridge: PublicAutoPostBridgeConfig;
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
  modeUsed?: "live_api" | "autopost_bridge" | "dry_run";
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
  externalTargetId: z.string().trim().max(160).optional(),
  accessToken: z.string().trim().max(2048).optional(),
  refreshToken: z.string().trim().max(2048).optional(),
  dryRun: z.boolean().optional(),
  bridge: z.object({
    enabled: z.boolean(),
    provider: z.enum(["vibepost", "webhook", "upload_post"]),
    endpointUrl: z.string().trim().max(500),
    bridgeKey: z.string().trim().max(1024).optional(),
    webhookSecret: z.string().trim().max(512).optional(),
    routingMode: z.enum(["bridge_fallback", "bridge_primary", "direct_only"]),
  }).optional(),
});

export const RetrySocialChannelSchema = z.object({
  postId: z.string().min(1),
  channels: z.array(SocialChannelIdSchema).optional(),
});

export const InboundAutoPostWebhookSchema = z.object({
  postId: z.string().min(1),
  channel: SocialChannelIdSchema,
  status: z.enum(["published", "failed"]),
  externalPostId: z.string().max(200).optional(),
  externalPostUrl: z.string().max(500).optional(),
  errorMessage: z.string().max(500).optional(),
});

export {
  applyInboundWebhookToPost,
  checkChannelMediaCompatibility,
  computePostAggregateStatus,
  createEmptyCopyVariants,
  shouldRouteViaAutoPostBridge,
} from "./social-helpers";
