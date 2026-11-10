import { NextResponse } from "next/server";
import { z } from "zod";
import { listSocialPosts } from "@/repositories/social-db";
import {
  syncAllPublishedPostsMetrics,
  syncSocialPostMetrics,
} from "@/services/social-metrics-tracker";

const SyncRequestSchema = z.object({
  postId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const raw: unknown = await request.json().catch(() => ({}));
    const parsed = SyncRequestSchema.safeParse(raw);
    const postId = parsed.success ? parsed.data.postId : undefined;

    if (postId) {
      const target = listSocialPosts().find((p) => p.id === postId);
      if (!target) {
        return NextResponse.json({ error: "Social post not found" }, { status: 404 });
      }
      const syncedPost = await syncSocialPostMetrics(target);
      return NextResponse.json({ ok: true, post: syncedPost, posts: listSocialPosts() });
    }

    const posts = await syncAllPublishedPostsMetrics();
    return NextResponse.json({ ok: true, posts });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to sync social post metrics";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
