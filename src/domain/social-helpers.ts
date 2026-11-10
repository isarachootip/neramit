import { z } from "zod";
import {
  AutoPostBridgeConfig,
  ChannelPublishResult,
  InboundAutoPostWebhookSchema,
  SOCIAL_CHANNELS,
  SocialChannelId,
  SocialCopyVariantsMap,
  SocialMediaKind,
  SocialPostRecord,
  SocialPostStatus,
  StoredChannelCredential,
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

export function shouldRouteViaAutoPostBridge(
  bridge: AutoPostBridgeConfig | undefined,
  cred: StoredChannelCredential | undefined
): boolean {
  if (!bridge || !bridge.enabled || !bridge.endpointUrl.trim()) {
    return false;
  }
  if (bridge.routingMode === "direct_only") {
    return false;
  }
  if (bridge.routingMode === "bridge_primary") {
    return true;
  }
  const hasLiveDirectToken = Boolean(cred && !cred.dryRun && cred.encryptedAccessToken);
  return !hasLiveDirectToken;
}

export function applyInboundWebhookToPost(
  post: SocialPostRecord,
  payload: z.infer<typeof InboundAutoPostWebhookSchema>
): SocialPostRecord {
  const updatedResults: ChannelPublishResult[] = post.results.map((item) => {
    if (item.channel !== payload.channel) return item;
    return {
      ...item,
      status: payload.status,
      externalPostId: payload.externalPostId ?? item.externalPostId,
      externalPostUrl: payload.externalPostUrl ?? item.externalPostUrl,
      errorMessage: payload.status === "failed" ? payload.errorMessage ?? "Webhook reported failure" : undefined,
      publishedAt: payload.status === "published" ? new Date().toISOString() : item.publishedAt,
      modeUsed: "autopost_bridge",
    };
  });

  if (!updatedResults.some((r) => r.channel === payload.channel)) {
    updatedResults.push({
      channel: payload.channel,
      status: payload.status,
      externalPostId: payload.externalPostId,
      externalPostUrl: payload.externalPostUrl,
      errorMessage: payload.errorMessage,
      publishedAt: payload.status === "published" ? new Date().toISOString() : undefined,
      modeUsed: "autopost_bridge",
      retryCount: 0,
    });
  }

  return {
    ...post,
    status: computePostAggregateStatus(updatedResults),
    results: updatedResults,
  };
}
