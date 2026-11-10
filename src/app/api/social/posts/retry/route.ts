import { NextResponse } from "next/server";
import { RetrySocialChannelSchema } from "@/domain/social-types";
import { listSocialPosts } from "@/repositories/social-db";
import { dispatchSocialPostChannels } from "@/services/social-scheduler";

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as unknown;
    const parsed = RetrySocialChannelSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid retry request" },
        { status: 400 }
      );
    }

    const existing = listSocialPosts().find((p) => p.id === parsed.data.postId);
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const failedChannels =
      parsed.data.channels ??
      existing.results.filter((r) => r.status === "failed").map((r) => r.channel);

    if (failedChannels.length === 0) {
      return NextResponse.json({ post: existing });
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(request.url).origin;
    const updated = await dispatchSocialPostChannels(existing, origin, failedChannels);
    return NextResponse.json({ post: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Retry failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
