import { z } from "zod";
import {
  AutoPostBridgeConfig, ChannelEngagementMetrics, ChannelPublishResult, InboundAutoPostWebhookSchema,
  SOCIAL_CHANNELS, SocialChannelId, SocialCopyVariantsMap, SocialMediaKind, SocialPostRecord, SocialPostStatus, StoredChannelCredential,
} from "./social-types";

export function createEmptyCopyVariants(defaultText = ""): SocialCopyVariantsMap {
  const tag = defaultText ? ["#NeramitAI"] : [];
  return {
    x: { caption: defaultText, hashtags: tag },
    facebook: { caption: defaultText, hashtags: tag, callToAction: "" },
    instagram: { caption: defaultText, hashtags: tag },
    youtube: { title: defaultText.slice(0, 80), caption: defaultText, hashtags: tag },
    tiktok: { caption: defaultText, hashtags: tag },
    line: { caption: defaultText, hashtags: tag, callToAction: "" },
    linkedin: { caption: defaultText, hashtags: tag },
    threads: { caption: defaultText, hashtags: tag },
    telegram: { caption: defaultText, hashtags: tag },
  };
}

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

  if (pendingCount > 0 && publishedCount === 0 && failedCount === 0) return "scheduled";
  if (publishedCount > 0 && failedCount > 0) return "partial_failure";
  if (publishedCount > 0 && failedCount === 0) return "published";
  return "failed";
}

export function shouldRouteViaAutoPostBridge(
  bridge: AutoPostBridgeConfig | undefined,
  cred: StoredChannelCredential | undefined
): boolean {
  if (!bridge || !bridge.enabled || !bridge.endpointUrl.trim()) return false;
  if (bridge.routingMode === "direct_only") return false;
  if (bridge.routingMode === "bridge_primary") return true;
  const hasLiveDirectToken = Boolean(cred && !cred.dryRun && cred.encryptedAccessToken);
  return !hasLiveDirectToken;
}

const CHANNEL_REACH_MULTIPLIER: Record<SocialChannelId, number> = {
  tiktok: 3.4,
  youtube: 2.8,
  instagram: 2.1,
  facebook: 1.8,
  x: 1.5,
  threads: 1.4,
  line: 1.2,
  telegram: 1.1,
  linkedin: 0.9,
};

export function estimateProgressiveMetrics(
  channel: SocialChannelId,
  mediaKind: SocialMediaKind,
  publishedAtIso?: string,
  seedKey = "neramit"
): ChannelEngagementMetrics {
  const pubMs = publishedAtIso ? new Date(publishedAtIso).getTime() : Date.now() - 120_000;
  const elapsedMin = Math.max(2, Math.min(10_080, Math.floor((Date.now() - pubMs) / 60_000)));
  const seedNum = seedKey.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 70;
  const mediaBoost = mediaKind === "video" ? 1.65 : mediaKind === "image" ? 1.25 : 0.85;
  const mult = CHANNEL_REACH_MULTIPLIER[channel] ?? 1.2;

  const views = Math.max(45, Math.round((140 + Math.sqrt(elapsedMin) * 185 + seedNum * 6) * mult * mediaBoost));
  const likes = Math.max(6, Math.round(views * (0.068 + (seedNum % 15) * 0.002)));
  const comments = Math.max(1, Math.round(likes * 0.14));
  const shares = Math.max(1, Math.round(likes * 0.19));
  const engagementRate = Number((((likes + comments + shares) / Math.max(1, views)) * 100).toFixed(1));

  return {
    views,
    likes,
    comments,
    shares,
    engagementRate,
    lastSyncedAt: new Date().toISOString(),
  };
}

export function computeCampaignTotals(posts: SocialPostRecord[]): {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalEngagements: number;
  avgEngagementRate: number;
} {
  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;

  for (const post of posts) {
    for (const res of post.results) {
      if (res.metrics) {
        totalViews += res.metrics.views;
        totalLikes += res.metrics.likes;
        totalComments += res.metrics.comments;
        totalShares += res.metrics.shares;
      }
    }
  }
  const totalEngagements = totalLikes + totalComments + totalShares;
  const avgEngagementRate =
    totalViews > 0 ? Number(((totalEngagements / totalViews) * 100).toFixed(1)) : 0;

  return { totalViews, totalLikes, totalComments, totalShares, totalEngagements, avgEngagementRate };
}

export function applyInboundWebhookToPost(
  post: SocialPostRecord,
  payload: z.infer<typeof InboundAutoPostWebhookSchema>
): SocialPostRecord {
  const nowIso = new Date().toISOString();
  const incomingMetrics: ChannelEngagementMetrics | undefined = payload.metrics
    ? {
        ...payload.metrics,
        engagementRate: Number(
          (
            ((payload.metrics.likes + payload.metrics.comments + payload.metrics.shares) /
              Math.max(1, payload.metrics.views)) *
            100
          ).toFixed(1)
        ),
        lastSyncedAt: nowIso,
      }
    : undefined;

  const updatedResults: ChannelPublishResult[] = post.results.map((item) => {
    if (item.channel !== payload.channel) return item;
    return {
      ...item,
      status: payload.status,
      remoteState: payload.remoteState ?? (payload.status === "published" ? "live_verified" : "flagged"),
      externalPostId: payload.externalPostId ?? item.externalPostId,
      externalPostUrl: payload.externalPostUrl ?? item.externalPostUrl,
      errorMessage: payload.status === "failed" ? payload.errorMessage ?? "Webhook reported failure" : undefined,
      publishedAt: payload.status === "published" ? item.publishedAt ?? nowIso : item.publishedAt,
      modeUsed: "autopost_bridge",
      metrics: incomingMetrics ?? item.metrics,
    };
  });

  if (!updatedResults.some((r) => r.channel === payload.channel)) {
    updatedResults.push({
      channel: payload.channel,
      status: payload.status,
      remoteState: payload.remoteState ?? (payload.status === "published" ? "live_verified" : "flagged"),
      externalPostId: payload.externalPostId,
      externalPostUrl: payload.externalPostUrl,
      errorMessage: payload.errorMessage,
      publishedAt: payload.status === "published" ? nowIso : undefined,
      modeUsed: "autopost_bridge",
      metrics: incomingMetrics,
      retryCount: 0,
    });
  }

  return {
    ...post,
    status: computePostAggregateStatus(updatedResults),
    results: updatedResults,
  };
}
