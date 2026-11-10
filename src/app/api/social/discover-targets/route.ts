import { NextResponse } from "next/server";
import { z } from "zod";
import { SocialChannelIdSchema } from "@/domain/social-types";
import { discoverSocialChannelTargets } from "@/services/social-account-discovery";

const DiscoverRequestSchema = z.object({
  brandId: z.string().min(1),
  channel: SocialChannelIdSchema,
  accessToken: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const raw: unknown = await request.json();
    const parsed = DiscoverRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid discovery request" },
        { status: 400 }
      );
    }

    const result = await discoverSocialChannelTargets(
      parsed.data.brandId,
      parsed.data.channel,
      parsed.data.accessToken
    );
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to discover social targets";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
