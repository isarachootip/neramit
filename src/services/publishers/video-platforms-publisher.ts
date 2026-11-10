import {
  ChannelPublishResult,
  PlatformCopyVariant,
  SocialMediaKind,
  StoredChannelCredential,
} from "../../domain/social-types";
import { decryptSecret } from "../../domain/token-crypto";

async function resolveGoogleBearerToken(cred: StoredChannelCredential): Promise<string> {
  const accessToken = cred.encryptedAccessToken ? decryptSecret(cred.encryptedAccessToken) : "";
  const refreshToken = cred.encryptedRefreshToken ? decryptSecret(cred.encryptedRefreshToken) : "";
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (refreshToken && clientId && clientSecret) {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(15000),
    });
    const json = (await res.json()) as { access_token?: string };
    if (res.ok && json.access_token) return json.access_token;
  }
  return accessToken;
}

export async function publishToYouTube(
  cred: StoredChannelCredential,
  variant: PlatformCopyVariant,
  mediaKind: SocialMediaKind,
  publicMediaUrl: string | undefined,
  retryCount: number
): Promise<ChannelPublishResult> {
  if (mediaKind !== "video" || !publicMediaUrl) {
    throw new Error("YouTube Shorts requires a video asset — click Auto-Convert Image → Short Video");
  }
  const token = await resolveGoogleBearerToken(cred);
  if (cred.dryRun || !token) {
    return {
      channel: "youtube",
      status: "published",
      externalPostId: `dry-yt-${Date.now()}`,
      externalPostUrl: `https://youtube.com/shorts/Neramit${Date.now().toString().slice(-6)}`,
      publishedAt: new Date().toISOString(),
      modeUsed: "dry_run",
      retryCount,
    };
  }

  const videoFetch = await fetch(publicMediaUrl, { signal: AbortSignal.timeout(30000) });
  if (!videoFetch.ok) throw new Error(`Unable to fetch video source (${videoFetch.status})`);
  const videoBytes = Buffer.from(await videoFetch.arrayBuffer());

  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": String(videoBytes.length),
        "X-Upload-Content-Type": "video/mp4",
      },
      body: JSON.stringify({
        snippet: {
          title: (variant.title || variant.caption).slice(0, 95),
          description: `${variant.caption}\n\n${variant.hashtags.join(" ")}`.trim(),
          tags: variant.hashtags.map((t) => t.replace(/^#/, "")),
          categoryId: "22",
        },
        status: { privacyStatus: "public", selfDeclaredMadeForKids: false },
      }),
      signal: AbortSignal.timeout(25000),
    }
  );

  const uploadUrl = initRes.headers.get("location");
  if (!initRes.ok || !uploadUrl) {
    const errText = await initRes.text();
    throw new Error(`YouTube Init HTTP ${initRes.status}: ${errText.slice(0, 120)}`);
  }

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(videoBytes.length) },
    body: videoBytes,
    signal: AbortSignal.timeout(55000),
  });
  const putJson = (await putRes.json()) as { id?: string; error?: { message?: string } };
  if (!putRes.ok || !putJson.id) {
    throw new Error(putJson.error?.message ?? `YouTube Upload HTTP ${putRes.status}`);
  }

  return {
    channel: "youtube",
    status: "published",
    externalPostId: putJson.id,
    externalPostUrl: `https://youtube.com/shorts/${putJson.id}`,
    publishedAt: new Date().toISOString(),
    modeUsed: "live_api",
    retryCount,
  };
}

export async function publishToTikTok(
  cred: StoredChannelCredential,
  variant: PlatformCopyVariant,
  mediaKind: SocialMediaKind,
  publicMediaUrl: string | undefined,
  retryCount: number
): Promise<ChannelPublishResult> {
  if (mediaKind !== "video" || !publicMediaUrl) {
    throw new Error("TikTok requires a video asset — click Auto-Convert Image → Short Video");
  }
  const token = cred.encryptedAccessToken ? decryptSecret(cred.encryptedAccessToken) : "";
  if (cred.dryRun || !token) {
    return {
      channel: "tiktok",
      status: "published",
      externalPostId: `dry-tt-${Date.now()}`,
      externalPostUrl: `https://tiktok.com/@${cred.accountHandle.replace(/^@/, "") || "neramit"}/video/${Date.now()}`,
      publishedAt: new Date().toISOString(),
      modeUsed: "dry_run",
      retryCount,
    };
  }

  const title = `${variant.caption} ${variant.hashtags.join(" ")}`.trim().slice(0, 2100);
  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: {
        title,
        privacy_level: "SELF_ONLY",
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: publicMediaUrl,
      },
    }),
    signal: AbortSignal.timeout(35000),
  });

  const json = (await res.json()) as {
    data?: { publish_id?: string };
    error?: { code?: string; message?: string };
  };
  if (!res.ok || (json.error?.code && json.error.code !== "ok")) {
    throw new Error(json.error?.message ?? `TikTok Content API HTTP ${res.status}`);
  }

  return {
    channel: "tiktok",
    status: "published",
    externalPostId: json.data?.publish_id ?? `tt-${Date.now()}`,
    externalPostUrl: `https://tiktok.com/@${cred.accountHandle.replace(/^@/, "") || "me"}`,
    publishedAt: new Date().toISOString(),
    modeUsed: "live_api",
    retryCount,
  };
}
