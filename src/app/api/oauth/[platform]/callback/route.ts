import { NextResponse } from "next/server";
import { SocialChannelIdSchema } from "@/domain/social-types";
import { upsertBrandProfileAndChannel } from "@/repositories/social-db";
import { exchangeOAuthCodeForTokens } from "@/services/social-oauth";

export async function GET(
  request: Request,
  context: { params: Promise<{ platform: string }> }
) {
  const { platform } = await context.params;
  const parsedPlatform = SocialChannelIdSchema.safeParse(platform);
  const url = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL?.trim() || url.origin;

  if (!parsedPlatform.success) {
    return NextResponse.redirect(`${origin}/social?oauth_notice=invalid_platform`);
  }

  const code = url.searchParams.get("code");
  const rawState = url.searchParams.get("state") || "";
  if (!code) {
    return NextResponse.redirect(`${origin}/social?oauth_notice=cancelled&platform=${platform}`);
  }

  let brandId = "brand-neramit";
  try {
    const decoded = JSON.parse(Buffer.from(rawState, "base64url").toString("utf8")) as {
      brandId?: string;
    };
    if (decoded.brandId) brandId = decoded.brandId;
  } catch {
    // Use default brandId when state cannot be parsed
  }

  try {
    const tokens = await exchangeOAuthCodeForTokens(parsedPlatform.data, code, origin);
    upsertBrandProfileAndChannel({
      brandId,
      channel: parsedPlatform.data,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      dryRun: false,
    });
    return NextResponse.redirect(`${origin}/social?oauth_notice=connected&platform=${platform}`);
  } catch (err) {
    const msg = encodeURIComponent(err instanceof Error ? err.message : "OAuth failed");
    return NextResponse.redirect(`${origin}/social?oauth_notice=error&message=${msg}`);
  }
}
