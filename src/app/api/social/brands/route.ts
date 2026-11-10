import { NextResponse } from "next/server";
import { UpsertBrandChannelSchema } from "@/domain/social-types";
import {
  listPublicBrandProfiles,
  upsertBrandProfileAndChannel,
} from "@/repositories/social-db";

export async function GET() {
  return NextResponse.json({
    brands: listPublicBrandProfiles(),
  });
}

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as unknown;
    const parsed = UpsertBrandChannelSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid brand configuration" },
        { status: 400 }
      );
    }

    const updated = upsertBrandProfileAndChannel(parsed.data);
    return NextResponse.json({
      brand: updated,
      brands: listPublicBrandProfiles(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save brand profile";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
