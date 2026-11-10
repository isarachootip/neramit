import {
  AutoPostBridgeConfig,
  ChannelPublishResult,
  PlatformCopyVariant,
  SocialChannelId,
  SocialMediaKind,
  StoredChannelCredential,
} from "../../domain/social-types";
import { decryptSecret, signHmacSha256 } from "../../domain/token-crypto";
import { formatFullCaption } from "./meta-x-publisher";

export async function publishToTelegram(
  cred: StoredChannelCredential,
  variant: PlatformCopyVariant,
  mediaKind: SocialMediaKind,
  publicMediaUrl: string | undefined,
  retryCount: number
): Promise<ChannelPublishResult> {
  const botToken = cred.encryptedAccessToken ? decryptSecret(cred.encryptedAccessToken) : "";
  const chatId = cred.externalTargetId?.trim() || cred.accountHandle.trim() || "@neramit_channel";
  if (cred.dryRun || !botToken) {
    return {
      channel: "telegram",
      status: "published",
      externalPostId: `dry-tg-${Date.now()}`,
      externalPostUrl: `https://t.me/${chatId.replace(/^@/, "")}`,
      publishedAt: new Date().toISOString(),
      modeUsed: "dry_run",
      retryCount,
    };
  }

  const caption = formatFullCaption(variant, 1000);
  const method =
    mediaKind === "video" && publicMediaUrl
      ? "sendVideo"
      : mediaKind === "image" && publicMediaUrl
      ? "sendPhoto"
      : "sendMessage";

  const payload =
    method === "sendVideo"
      ? { chat_id: chatId, video: publicMediaUrl, caption }
      : method === "sendPhoto"
      ? { chat_id: chatId, photo: publicMediaUrl, caption }
      : { chat_id: chatId, text: formatFullCaption(variant, 3900) };

  const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(25000),
  });
  const json = (await res.json()) as {
    ok?: boolean;
    result?: { message_id?: number };
    description?: string;
  };
  if (!res.ok || !json.ok) {
    throw new Error(json.description ?? `Telegram Bot API HTTP ${res.status}`);
  }
  const msgId = json.result?.message_id ?? Date.now();
  return {
    channel: "telegram",
    status: "published",
    externalPostId: String(msgId),
    externalPostUrl: `https://t.me/${chatId.replace(/^@/, "")}/${msgId}`,
    publishedAt: new Date().toISOString(),
    modeUsed: "live_api",
    retryCount,
  };
}

export interface AutoPostBridgeDispatchParams {
  bridge: AutoPostBridgeConfig;
  postId: string;
  brandId: string;
  brandName: string;
  channel: SocialChannelId;
  cred: StoredChannelCredential;
  variant: PlatformCopyVariant;
  mediaKind: SocialMediaKind;
  publicMediaUrl?: string;
  baseOrigin: string;
  retryCount: number;
}

export async function publishViaAutoPostBridge(
  params: AutoPostBridgeDispatchParams
): Promise<ChannelPublishResult> {
  const { bridge, postId, brandId, brandName, channel, cred, variant, mediaKind, publicMediaUrl, baseOrigin, retryCount } = params;
  const endpoint = bridge.endpointUrl.trim();
  const bridgeKey = bridge.encryptedBridgeKey ? decryptSecret(bridge.encryptedBridgeKey) : "";
  const webhookSecret = bridge.encryptedWebhookSecret ? decryptSecret(bridge.encryptedWebhookSecret) : "";

  if (!bridgeKey && cred.dryRun) {
    return {
      channel,
      status: "published",
      externalPostId: `bridge-${bridge.provider}-${channel}-${Date.now()}`,
      externalPostUrl: endpoint.startsWith("https://vibepost.online")
        ? "https://vibepost.online/dashboard"
        : endpoint,
      publishedAt: new Date().toISOString(),
      modeUsed: "autopost_bridge",
      retryCount,
    };
  }

  const bodyObj = {
    source: "neramit-ai-studio",
    provider: bridge.provider,
    postId,
    brandId,
    brandName,
    channel,
    accountHandle: cred.accountHandle,
    externalTargetId: cred.externalTargetId,
    mediaKind,
    mediaUrl: publicMediaUrl,
    caption: formatFullCaption(variant, 4000),
    variant,
    callbackWebhookUrl: `${baseOrigin}/api/social/webhook`,
    timestamp: new Date().toISOString(),
  };

  const rawBody = JSON.stringify(bodyObj);
  const signature = signHmacSha256(rawBody, webhookSecret || bridgeKey);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Neramit-Signature": signature,
    "X-Neramit-Channel": channel,
  };
  if (bridgeKey) {
    headers.Authorization = `Bearer ${bridgeKey}`;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: rawBody,
    signal: AbortSignal.timeout(30000),
  });
  const json = (await res.json().catch(() => ({}))) as {
    id?: string;
    postId?: string;
    url?: string;
    externalPostUrl?: string;
    error?: string;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(json.error ?? json.message ?? `AutoPost Bridge (${bridge.provider}) HTTP ${res.status}`);
  }

  return {
    channel,
    status: "published",
    externalPostId: json.id ?? json.postId ?? `bridge-${channel}-${Date.now()}`,
    externalPostUrl:
      json.externalPostUrl ??
      json.url ??
      (endpoint.startsWith("https://vibepost.online") ? "https://vibepost.online" : endpoint),
    publishedAt: new Date().toISOString(),
    modeUsed: "autopost_bridge",
    retryCount,
  };
}
