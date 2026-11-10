import { NextResponse } from "next/server";
import { InboundAutoPostWebhookSchema } from "@/domain/social-types";
import { decryptSecret, verifyHmacSha256 } from "@/domain/token-crypto";
import {
  getBrandProfileById,
  listSocialPosts,
  updateSocialPostFromWebhook,
} from "@/repositories/social-db";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const json: unknown = JSON.parse(rawBody);
    const parsed = InboundAutoPostWebhookSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid webhook payload" },
        { status: 400 }
      );
    }

    const signature = request.headers.get("x-neramit-signature") || "";
    const targetPost = listSocialPosts().find((p) => p.id === parsed.data.postId);
    if (!targetPost) {
      return NextResponse.json({ error: "Social post not found" }, { status: 404 });
    }

    const brand = getBrandProfileById(targetPost.brandId);
    const configuredSecret = brand?.bridge?.encryptedWebhookSecret
      ? decryptSecret(brand.bridge.encryptedWebhookSecret)
      : process.env.NERAMIT_WEBHOOK_SECRET?.trim() || "";

    if (configuredSecret && signature) {
      const valid = verifyHmacSha256(rawBody, signature, configuredSecret);
      if (!valid) {
        return NextResponse.json({ error: "Invalid webhook HMAC signature" }, { status: 401 });
      }
    }

    const updatedPost = updateSocialPostFromWebhook(parsed.data);
    return NextResponse.json({ ok: true, post: updatedPost });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook processing failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
