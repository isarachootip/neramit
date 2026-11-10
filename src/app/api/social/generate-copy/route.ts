import { NextResponse } from "next/server";
import { GenerateSocialCopySchema } from "@/domain/social-types";
import { generateMultimodalSocialCopy } from "@/services/social-copywriter";

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as unknown;
    const parsed = GenerateSocialCopySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid copywriting input", refunded: true },
        { status: 400 }
      );
    }

    const result = await generateMultimodalSocialCopy(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Copywriting failed";
    return NextResponse.json(
      { error: `${msg} — Tokens Auto-Refunded`, refunded: true },
      { status: 502 }
    );
  }
}
