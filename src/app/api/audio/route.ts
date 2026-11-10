import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildScriptSubtitles,
  mergeVaultWithServerEnv,
  resolveAudioProvider,
} from "@/domain/provider-router";
import { AudioGenerationSchema } from "@/domain/studio-schemas";
import { AudioStudioTurn } from "@/domain/studio-types";
import { estimateAudioScriptTokens } from "@/domain/token-pricing";
import { generateLiveSpeechAudio } from "@/services/live-audio";

const AudioApiEnvelopeSchema = AudioGenerationSchema.extend({
  voiceName: z.string().min(1).default("Nicha · Thai Commercial"),
  vault: z.unknown().optional(),
});

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as unknown;
    const parsed = AudioApiEnvelopeSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid audio request", refunded: true },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const estimate = estimateAudioScriptTokens(input.prompt);
    const vault = mergeVaultWithServerEnv(input.vault);
    const resolved = resolveAudioProvider(vault);

    let audioUrl = "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg";

    if (resolved.provider !== "simulation") {
      try {
        audioUrl = await generateLiveSpeechAudio({
          provider: resolved,
          script: input.prompt,
          voiceId: input.voiceId,
          format: input.format,
          speechRate: input.speechRate,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Live TTS API error";
        return NextResponse.json(
          { error: `${resolved.label} Error: ${msg} — Tokens Refunded`, refunded: true },
          { status: 502 }
        );
      }
    } else {
      await new Promise((r) => setTimeout(r, 450));
    }

    const turn: AudioStudioTurn = {
      id: `aud-${Date.now()}`,
      createdAt: new Date().toISOString(),
      mode: input.mode,
      prompt: input.prompt,
      voiceId: input.voiceId,
      voiceName: `${input.voiceName} · ${resolved.label}`,
      format: resolved.provider === "gemini" ? "wav" : input.format,
      seconds: estimate.seconds,
      tokensCharged: estimate.tokens,
      audioUrl,
      subtitles: buildScriptSubtitles(input.prompt, estimate.seconds),
    };

    return NextResponse.json({ turn, providerUsed: resolved.label });
  } catch {
    return NextResponse.json(
      { error: "Failed to synthesize speech", refunded: true },
      { status: 500 }
    );
  }
}
