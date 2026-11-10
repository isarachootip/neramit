import { NextResponse } from "next/server";
import {
  CreateSocialPostSchema,
  SocialCopyVariantsMap,
  SocialPostRecord,
} from "@/domain/social-types";
import {
  getBrandProfileById,
  listSocialPosts,
  saveSocialPostRecord,
} from "@/repositories/social-db";
import {
  dispatchSocialPostChannels,
  processDueScheduledPosts,
} from "@/services/social-scheduler";

function getOriginFromRequest(request: Request): string {
  const url = new URL(request.url);
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || url.origin;
}

const DEFAULT_EMPTY_VARIANT = { caption: "", hashtags: [] as string[] };

export async function GET(request: Request) {
  await processDueScheduledPosts(getOriginFromRequest(request)).catch(() => {});
  const posts = listSocialPosts();
  return NextResponse.json({ posts, total: posts.length });
}

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as unknown;
    const parsed = CreateSocialPostSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid social post payload" },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const brand = getBrandProfileById(input.brandId);
    const fullVariants: SocialCopyVariantsMap = {
      x: input.variants.x ?? DEFAULT_EMPTY_VARIANT,
      facebook: input.variants.facebook ?? DEFAULT_EMPTY_VARIANT,
      instagram: input.variants.instagram ?? DEFAULT_EMPTY_VARIANT,
      youtube: input.variants.youtube ?? DEFAULT_EMPTY_VARIANT,
      tiktok: input.variants.tiktok ?? DEFAULT_EMPTY_VARIANT,
    };

    const isScheduledFuture = Boolean(
      input.scheduledAt && new Date(input.scheduledAt).getTime() > Date.now() + 10_000
    );

    const record: SocialPostRecord = {
      id: `spost-${Date.now()}`,
      brandId: brand?.id ?? input.brandId,
      brandName: brand?.name ?? "Neramit Brand",
      createdAt: new Date().toISOString(),
      scheduledAt: input.scheduledAt,
      status: "scheduled",
      topicIntro: input.topicIntro,
      mediaKind: input.mediaKind,
      mediaUrl: input.mediaUrl,
      channels: input.channels,
      variants: fullVariants,
      results: input.channels.map((ch) => ({ channel: ch, status: "pending", retryCount: 0 })),
    };

    if (isScheduledFuture) {
      const saved = saveSocialPostRecord(record);
      return NextResponse.json({ post: saved });
    }

    const dispatched = await dispatchSocialPostChannels(record, getOriginFromRequest(request));
    return NextResponse.json({ post: dispatched });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to publish social post";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
