import { ApiKeyVaultConfig } from "../domain/neramit-vault-types";
import {
  PublicBrandProfile,
  SocialChannelId,
  SocialCopyVariantsMap,
  SocialMediaKind,
  SocialPostRecord,
} from "../domain/social-types";
import { StudioGenerationTurn, StudioLocale } from "../domain/studio-types";

export async function fetchSocialDashboardData(): Promise<{
  brands: PublicBrandProfile[];
  posts: SocialPostRecord[];
}> {
  const [bRes, pRes] = await Promise.all([
    fetch("/api/social/brands"),
    fetch("/api/social/posts"),
  ]);
  const bJson = (await bRes.json()) as { brands?: PublicBrandProfile[] };
  const pJson = (await pRes.json()) as { posts?: SocialPostRecord[] };
  return { brands: bJson.brands ?? [], posts: pJson.posts ?? [] };
}

export async function requestMultimodalSocialCopy(params: {
  topicIntro: string;
  mediaUrl?: string;
  mediaKind: SocialMediaKind;
  brandName: string;
  voiceTone: string;
  locale: StudioLocale;
  vault: ApiKeyVaultConfig;
}): Promise<{ variants?: SocialCopyVariantsMap; providerUsed?: string; error?: string; ok: boolean }> {
  const res = await fetch("/api/social/generate-copy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = (await res.json()) as {
    variants?: SocialCopyVariantsMap;
    providerUsed?: string;
    error?: string;
  };
  return { ...data, ok: res.ok };
}

export async function requestShortVideoConversion(params: {
  topicIntro: string;
  mediaUrl: string;
  vault: ApiKeyVaultConfig;
}): Promise<{ videoUrl?: string; error?: string; ok: boolean }> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      modelSlug: "seedance-2-5",
      output: "video",
      mode: params.mediaUrl ? "i2v" : "t2v",
      prompt:
        params.topicIntro.trim() ||
        "Commercial product showcase orbital camera motion with synchronized audio",
      aspectRatio: "9:16",
      resolution: "1080p",
      duration: 5,
      audio: true,
      referenceImages: params.mediaUrl ? [params.mediaUrl] : [],
      vault: params.vault,
    }),
  });
  const data = (await res.json()) as { turn?: StudioGenerationTurn; error?: string };
  return { videoUrl: data.turn?.resultUrls[0], error: data.error, ok: res.ok };
}

export async function submitSocialPostRequest(payload: {
  brandId: string;
  topicIntro: string;
  mediaKind: SocialMediaKind;
  mediaUrl?: string;
  channels: SocialChannelId[];
  variants: SocialCopyVariantsMap;
  scheduledAt?: string;
}): Promise<{ post?: SocialPostRecord; error?: string; ok: boolean }> {
  const res = await fetch("/api/social/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { post?: SocialPostRecord; error?: string };
  return { ...data, ok: res.ok };
}
