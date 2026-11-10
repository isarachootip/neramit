import {
  ChannelPublishResult,
  computePostAggregateStatus,
  shouldRouteViaAutoPostBridge,
  SocialChannelId,
  SocialPostRecord,
} from "../domain/social-types";
import {
  getBrandProfileById,
  listSocialPosts,
  resolvePublicMediaUrl,
  saveSocialPostRecord,
} from "../repositories/social-db";
import {
  publishToTelegram,
  publishViaAutoPostBridge,
} from "./publishers/autopost-bridge-publisher";
import {
  publishToLinkedIn,
  publishToLineOA,
  publishToThreads,
} from "./publishers/community-platforms-publisher";
import {
  publishToFacebook,
  publishToInstagram,
  publishToX,
} from "./publishers/meta-x-publisher";
import {
  publishToTikTok,
  publishToYouTube,
} from "./publishers/video-platforms-publisher";

export async function dispatchSocialPostChannels(
  post: SocialPostRecord,
  baseOrigin: string,
  onlyChannels?: SocialChannelId[]
): Promise<SocialPostRecord> {
  const brand = getBrandProfileById(post.brandId);
  if (!brand) throw new Error(`Brand profile not found: ${post.brandId}`);

  const publicMediaUrl = resolvePublicMediaUrl(post.mediaUrl, baseOrigin);
  const targets = onlyChannels ?? post.channels;

  const updatedResultsMap = new Map<SocialChannelId, ChannelPublishResult>();
  for (const existing of post.results) {
    updatedResultsMap.set(existing.channel, existing);
  }

  await Promise.all(
    targets.map(async (channelId) => {
      const prev = updatedResultsMap.get(channelId);
      const retryCount = prev && prev.status === "failed" ? prev.retryCount + 1 : 0;
      const cred = brand.channels[channelId];
      const variant = post.variants[channelId];

      try {
        let res: ChannelPublishResult;
        if (brand.bridge && shouldRouteViaAutoPostBridge(brand.bridge, cred)) {
          res = await publishViaAutoPostBridge({
            bridge: brand.bridge,
            postId: post.id,
            brandId: brand.id,
            brandName: brand.name,
            channel: channelId,
            cred,
            variant,
            mediaKind: post.mediaKind,
            publicMediaUrl,
            baseOrigin,
            retryCount,
          });
        } else if (channelId === "x") {
          res = await publishToX(cred, variant, post.mediaKind, publicMediaUrl, retryCount);
        } else if (channelId === "facebook") {
          res = await publishToFacebook(cred, variant, post.mediaKind, publicMediaUrl, retryCount);
        } else if (channelId === "instagram") {
          res = await publishToInstagram(cred, variant, post.mediaKind, publicMediaUrl, retryCount);
        } else if (channelId === "youtube") {
          res = await publishToYouTube(cred, variant, post.mediaKind, publicMediaUrl, retryCount);
        } else if (channelId === "tiktok") {
          res = await publishToTikTok(cred, variant, post.mediaKind, publicMediaUrl, retryCount);
        } else if (channelId === "line") {
          res = await publishToLineOA(cred, variant, post.mediaKind, publicMediaUrl, retryCount);
        } else if (channelId === "linkedin") {
          res = await publishToLinkedIn(cred, variant, post.mediaKind, publicMediaUrl, retryCount);
        } else if (channelId === "threads") {
          res = await publishToThreads(cred, variant, post.mediaKind, publicMediaUrl, retryCount);
        } else {
          res = await publishToTelegram(cred, variant, post.mediaKind, publicMediaUrl, retryCount);
        }
        updatedResultsMap.set(channelId, res);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Channel publish failed";
        updatedResultsMap.set(channelId, {
          channel: channelId,
          status: "failed",
          errorMessage: msg,
          retryCount,
        });
      }
    })
  );

  const finalResults: ChannelPublishResult[] = post.channels.map(
    (ch) => updatedResultsMap.get(ch) ?? { channel: ch, status: "pending", retryCount: 0 }
  );

  const updatedPost: SocialPostRecord = {
    ...post,
    status: computePostAggregateStatus(finalResults),
    results: finalResults,
  };

  return saveSocialPostRecord(updatedPost);
}

export async function processDueScheduledPosts(baseOrigin: string): Promise<number> {
  const nowMs = Date.now();
  const due = listSocialPosts().filter(
    (p) =>
      p.status === "scheduled" &&
      p.scheduledAt &&
      new Date(p.scheduledAt).getTime() <= nowMs
  );

  for (const post of due) {
    await dispatchSocialPostChannels(post, baseOrigin);
  }
  return due.length;
}

declare global {
  // eslint-disable-next-line no-var
  var __neramitSchedulerStarted: boolean | undefined;
}

export function startBackgroundSocialScheduler(): void {
  if (globalThis.__neramitSchedulerStarted) return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  globalThis.__neramitSchedulerStarted = true;
  const publicOrigin =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.COOLIFY_URL?.trim()?.replace(/\/$/, "") ||
    "http://localhost:3000";

  const timer = setInterval(() => {
    processDueScheduledPosts(publicOrigin).catch(() => {});
  }, 60_000);

  if (typeof timer.unref === "function") {
    timer.unref();
  }
}
