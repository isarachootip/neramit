import { NextResponse } from "next/server";
import { SocialChannelIdSchema } from "@/domain/social-types";
import { buildOAuthAuthorizeRedirect } from "@/services/social-oauth";

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

  const brandId = url.searchParams.get("brandId") || "brand-neramit";
  const { redirectUrl } = buildOAuthAuthorizeRedirect(parsedPlatform.data, brandId, origin);
  return NextResponse.redirect(redirectUrl);
}
