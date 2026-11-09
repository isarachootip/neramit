import { NextResponse } from "next/server";
import { ALL_STUDIO_MODELS } from "@/domain/models-video-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("output");

  const items = kind
    ? ALL_STUDIO_MODELS.filter((m) => m.output === kind)
    : ALL_STUDIO_MODELS;

  return NextResponse.json({
    items,
    total: items.length,
  });
}
