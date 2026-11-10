import {
  ChannelPublishResult,
  PlatformCopyVariant,
  SocialMediaKind,
  StoredChannelCredential,
} from "../../domain/social-types";
import { decryptSecret } from "../../domain/token-crypto";
import { formatFullCaption } from "./meta-x-publisher";

export async function publishToLineOA(
  cred: StoredChannelCredential,
  variant: PlatformCopyVariant,
  mediaKind: SocialMediaKind,
  publicMediaUrl: string | undefined,
  retryCount: number
): Promise<ChannelPublishResult> {
  const token = cred.encryptedAccessToken ? decryptSecret(cred.encryptedAccessToken) : "";
  if (cred.dryRun || !token) {
    return {
      channel: "line",
      status: "published",
      externalPostId: `dry-line-${Date.now()}`,
      externalPostUrl: `https://line.me/R/ti/p/${cred.accountHandle || "@neramit_oa"}`,
      publishedAt: new Date().toISOString(),
      modeUsed: "dry_run",
      retryCount,
    };
  }

  const messages: Array<Record<string, unknown>> = [];
  if (mediaKind === "image" && publicMediaUrl?.startsWith("https://")) {
    messages.push({
      type: "image",
      originalContentUrl: publicMediaUrl,
      previewImageUrl: publicMediaUrl,
    });
  }
  messages.push({
    type: "text",
    text: formatFullCaption(variant, 1950),
  });

  const res = await fetch("https://api.line.me/v2/bot/message/broadcast", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `LINE Messaging API HTTP ${res.status}`);
  }

  return {
    channel: "line",
    status: "published",
    externalPostId: res.headers.get("x-line-request-id") ?? `line-${Date.now()}`,
    externalPostUrl: `https://line.me/R/ti/p/${cred.accountHandle || "@neramit_oa"}`,
    publishedAt: new Date().toISOString(),
    modeUsed: "live_api",
    retryCount,
  };
}

export async function publishToLinkedIn(
  cred: StoredChannelCredential,
  variant: PlatformCopyVariant,
  mediaKind: SocialMediaKind,
  publicMediaUrl: string | undefined,
  retryCount: number
): Promise<ChannelPublishResult> {
  const token = cred.encryptedAccessToken ? decryptSecret(cred.encryptedAccessToken) : "";
  if (cred.dryRun || !token) {
    return {
      channel: "linkedin",
      status: "published",
      externalPostId: `dry-li-${Date.now()}`,
      externalPostUrl: `https://www.linkedin.com/feed/update/urn:li:share:${Date.now()}`,
      publishedAt: new Date().toISOString(),
      modeUsed: "dry_run",
      retryCount,
    };
  }

  const rawTarget = cred.externalTargetId?.trim() || "me";
  const authorUrn = rawTarget.startsWith("urn:li:") ? rawTarget : `urn:li:person:${rawTarget}`;
  const text = formatFullCaption(variant, 2900);

  const shareContent: Record<string, unknown> = {
    shareCommentary: { text },
    shareMediaCategory: mediaKind !== "none" && publicMediaUrl ? "ARTICLE" : "NONE",
  };
  if (mediaKind !== "none" && publicMediaUrl) {
    shareContent.media = [{ status: "READY", originalUrl: publicMediaUrl }];
  }

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: { "com.linkedin.ugc.ShareContent": shareContent },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
    signal: AbortSignal.timeout(25000),
  });
  const json = (await res.json()) as { id?: string; message?: string };
  if (!res.ok || !json.id) {
    throw new Error(json.message ?? `LinkedIn UGC API HTTP ${res.status}`);
  }
  return {
    channel: "linkedin",
    status: "published",
    externalPostId: json.id,
    externalPostUrl: `https://www.linkedin.com/feed/update/${json.id}`,
    publishedAt: new Date().toISOString(),
    modeUsed: "live_api",
    retryCount,
  };
}

export async function publishToThreads(
  cred: StoredChannelCredential,
  variant: PlatformCopyVariant,
  mediaKind: SocialMediaKind,
  publicMediaUrl: string | undefined,
  retryCount: number
): Promise<ChannelPublishResult> {
  const token = cred.encryptedAccessToken ? decryptSecret(cred.encryptedAccessToken) : "";
  if (cred.dryRun || !token) {
    return {
      channel: "threads",
      status: "published",
      externalPostId: `dry-th-${Date.now()}`,
      externalPostUrl: `https://www.threads.net/${cred.accountHandle || "@neramit.threads"}`,
      publishedAt: new Date().toISOString(),
      modeUsed: "dry_run",
      retryCount,
    };
  }

  const threadsUserId = cred.externalTargetId?.trim() || "me";
  const text = formatFullCaption(variant, 490);
  const containerPayload: Record<string, string> = { text, access_token: token };
  if (mediaKind === "video" && publicMediaUrl) {
    containerPayload.media_type = "VIDEO";
    containerPayload.video_url = publicMediaUrl;
  } else if (mediaKind === "image" && publicMediaUrl) {
    containerPayload.media_type = "IMAGE";
    containerPayload.image_url = publicMediaUrl;
  } else {
    containerPayload.media_type = "TEXT";
  }

  const cRes = await fetch(`https://graph.threads.net/v1.0/${threadsUserId}/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(containerPayload),
    signal: AbortSignal.timeout(30000),
  });
  const cJson = (await cRes.json()) as { id?: string; error?: { message?: string } };
  if (!cRes.ok || !cJson.id) {
    throw new Error(cJson.error?.message ?? `Threads Container HTTP ${cRes.status}`);
  }

  const pRes = await fetch(`https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: cJson.id, access_token: token }),
    signal: AbortSignal.timeout(30000),
  });
  const pJson = (await pRes.json()) as { id?: string; error?: { message?: string } };
  if (!pRes.ok || !pJson.id) {
    throw new Error(pJson.error?.message ?? `Threads Publish HTTP ${pRes.status}`);
  }
  return {
    channel: "threads",
    status: "published",
    externalPostId: pJson.id,
    externalPostUrl: `https://www.threads.net/${cred.accountHandle || "@me"}`,
    publishedAt: new Date().toISOString(),
    modeUsed: "live_api",
    retryCount,
  };
}
