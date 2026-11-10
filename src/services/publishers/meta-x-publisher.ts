import {
  ChannelPublishResult,
  PlatformCopyVariant,
  SocialMediaKind,
  StoredChannelCredential,
} from "../../domain/social-types";
import { decryptSecret } from "../../domain/token-crypto";

export function formatFullCaption(variant: PlatformCopyVariant, maxLen: number): string {
  const tags = variant.hashtags.length > 0 ? `\n\n${variant.hashtags.join(" ")}` : "";
  const cta = variant.callToAction ? `\n👉 ${variant.callToAction}` : "";
  const combined = `${variant.caption}${cta}${tags}`.trim();
  return combined.length <= maxLen ? combined : `${combined.slice(0, maxLen - 1)}…`;
}

async function tryUploadMediaToX(token: string, publicMediaUrl?: string): Promise<string | null> {
  if (!publicMediaUrl) return null;
  try {
    const mediaFetch = await fetch(publicMediaUrl, { signal: AbortSignal.timeout(20000) });
    if (!mediaFetch.ok) return null;
    const base64Data = Buffer.from(await mediaFetch.arrayBuffer()).toString("base64");
    const uploadRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ media_data: base64Data }),
      signal: AbortSignal.timeout(25000),
    });
    const uploadJson = (await uploadRes.json()) as { media_id_string?: string };
    return uploadRes.ok && uploadJson.media_id_string ? uploadJson.media_id_string : null;
  } catch {
    return null;
  }
}

export async function publishToX(
  cred: StoredChannelCredential,
  variant: PlatformCopyVariant,
  mediaKind: SocialMediaKind,
  publicMediaUrl: string | undefined,
  retryCount: number
): Promise<ChannelPublishResult> {
  const token = cred.encryptedAccessToken ? decryptSecret(cred.encryptedAccessToken) : "";
  if (cred.dryRun || !token) {
    return {
      channel: "x",
      status: "published",
      externalPostId: `dry-x-${Date.now()}`,
      externalPostUrl: `https://x.com/${cred.accountHandle.replace(/^@/, "") || "neramit"}/status/${Date.now()}`,
      publishedAt: new Date().toISOString(),
      modeUsed: "dry_run",
      retryCount,
    };
  }

  const mediaId = mediaKind !== "none" ? await tryUploadMediaToX(token, publicMediaUrl) : null;
  const tweetBody: Record<string, unknown> = { text: formatFullCaption(variant, 280) };
  if (mediaId) tweetBody.media = { media_ids: [mediaId] };

  const res = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(tweetBody),
    signal: AbortSignal.timeout(25000),
  });
  const json = (await res.json()) as { data?: { id?: string }; detail?: string; title?: string };
  if (!res.ok || !json.data?.id) throw new Error(json.detail ?? json.title ?? `X API v2 HTTP ${res.status}`);
  return {
    channel: "x",
    status: "published",
    externalPostId: json.data.id,
    externalPostUrl: `https://x.com/i/web/status/${json.data.id}`,
    publishedAt: new Date().toISOString(),
    modeUsed: "live_api",
    retryCount,
  };
}

export async function publishToFacebook(
  cred: StoredChannelCredential,
  variant: PlatformCopyVariant,
  mediaKind: SocialMediaKind,
  publicMediaUrl: string | undefined,
  retryCount: number
): Promise<ChannelPublishResult> {
  const token = cred.encryptedAccessToken ? decryptSecret(cred.encryptedAccessToken) : "";
  if (cred.dryRun || !token) {
    return {
      channel: "facebook",
      status: "published",
      externalPostId: `dry-fb-${Date.now()}`,
      externalPostUrl: `https://facebook.com/posts/${Date.now()}`,
      publishedAt: new Date().toISOString(),
      modeUsed: "dry_run",
      retryCount,
    };
  }

  const pageId = cred.externalTargetId?.trim() || "me";
  const caption = formatFullCaption(variant, 4800);
  const endpoint =
    mediaKind === "video" && publicMediaUrl
      ? `https://graph.facebook.com/v21.0/${pageId}/videos`
      : mediaKind === "image" && publicMediaUrl
      ? `https://graph.facebook.com/v21.0/${pageId}/photos`
      : `https://graph.facebook.com/v21.0/${pageId}/feed`;

  const payload =
    mediaKind === "video" && publicMediaUrl
      ? { file_url: publicMediaUrl, description: caption, access_token: token }
      : mediaKind === "image" && publicMediaUrl
      ? { url: publicMediaUrl, caption, access_token: token }
      : { message: caption, access_token: token };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(35000),
  });
  const json = (await res.json()) as { id?: string; error?: { message?: string } };
  if (!res.ok || !json.id) {
    throw new Error(json.error?.message ?? `Facebook Graph API HTTP ${res.status}`);
  }
  return {
    channel: "facebook",
    status: "published",
    externalPostId: json.id,
    externalPostUrl: `https://facebook.com/${json.id}`,
    publishedAt: new Date().toISOString(),
    modeUsed: "live_api",
    retryCount,
  };
}

export async function publishToInstagram(
  cred: StoredChannelCredential,
  variant: PlatformCopyVariant,
  mediaKind: SocialMediaKind,
  publicMediaUrl: string | undefined,
  retryCount: number
): Promise<ChannelPublishResult> {
  if (!publicMediaUrl || mediaKind === "none") throw new Error("Instagram requires an image or video asset");
  const token = cred.encryptedAccessToken ? decryptSecret(cred.encryptedAccessToken) : "";
  if (cred.dryRun || !token) {
    return {
      channel: "instagram",
      status: "published",
      externalPostId: `dry-ig-${Date.now()}`,
      externalPostUrl: `https://instagram.com/p/Neramit${Date.now().toString().slice(-6)}`,
      publishedAt: new Date().toISOString(),
      modeUsed: "dry_run",
      retryCount,
    };
  }
  const igUserId = cred.externalTargetId?.trim();
  if (!igUserId) throw new Error("Instagram Business Account ID is required in Brand Settings");

  const caption = formatFullCaption(variant, 2150);
  const containerBody =
    mediaKind === "video"
      ? { media_type: "REELS", video_url: publicMediaUrl, caption, access_token: token }
      : { image_url: publicMediaUrl, caption, access_token: token };

  const createRes = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(containerBody),
    signal: AbortSignal.timeout(35000),
  });
  const createJson = (await createRes.json()) as { id?: string; error?: { message?: string } };
  if (!createRes.ok || !createJson.id) {
    throw new Error(createJson.error?.message ?? `Instagram Container HTTP ${createRes.status}`);
  }

  const pubRes = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: createJson.id, access_token: token }),
    signal: AbortSignal.timeout(35000),
  });
  const pubJson = (await pubRes.json()) as { id?: string; error?: { message?: string } };
  if (!pubRes.ok || !pubJson.id) {
    throw new Error(pubJson.error?.message ?? `Instagram Publish HTTP ${pubRes.status}`);
  }

  return {
    channel: "instagram",
    status: "published",
    externalPostId: pubJson.id,
    externalPostUrl: "https://instagram.com",
    publishedAt: new Date().toISOString(),
    modeUsed: "live_api",
    retryCount,
  };
}
