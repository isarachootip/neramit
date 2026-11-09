import { NextResponse } from "next/server";
import { getModelBySlug } from "@/domain/models-video-data";
import { validateGenerationInput } from "@/domain/studio-schemas";
import { LayerItem, StudioGenerationTurn } from "@/domain/studio-types";
import { calculateGenerationTokens } from "@/domain/token-pricing";

const SAMPLE_IMAGE_POOL: string[] = [
  "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1080&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1080&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1080&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1080&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1080&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop",
];

const SAMPLE_VIDEO_POOL: string[] = [
  "/media/templates/swatch-snap-video.mp4",
  "/media/templates/7-day-ootd-video.mp4",
  "/media/templates/cute7ads-video.mp4",
  "/media/templates/fashioncommercial-video.mp4",
  "/media/templates/7-match-cut-video.mp4",
];

interface ExtendedRequestPayload {
  lineageLabel?: string;
  simulateFailure?: boolean;
  providerHint?: string;
}

export async function POST(request: Request) {
  try {
    const rawBody = (await request.json()) as Record<string, unknown> & ExtendedRequestPayload;

    if (rawBody.simulateFailure) {
      await new Promise((resolve) => setTimeout(resolve, 450));
      return NextResponse.json(
        {
          error: "GPU Cluster timeout simulated — 100% Tokens Auto-Refunded to your wallet",
          refunded: true,
        },
        { status: 503 }
      );
    }

    const parsed = validateGenerationInput(rawBody);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message ?? "Invalid generation parameters", refunded: true },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const model = getModelBySlug(input.modelSlug);
    if (!model) {
      return NextResponse.json({ error: "Model not found", refunded: true }, { status: 404 });
    }

    const tokensCharged = calculateGenerationTokens(model, {
      size: input.resolution,
      resolution: input.resolution,
      num_images: input.numImages,
      sequential: input.sequential,
      max_images: input.numImages,
      layer_decomposition: input.layerDecomposition,
      thinking: input.thinking,
      mode: input.mode,
      duration: input.duration,
      audio: input.audio,
    });

    await new Promise((resolve) => setTimeout(resolve, 650));

    const count = input.output === "image" ? Math.min(4, input.numImages) : 1;
    const resultUrls: string[] = [];

    for (let i = 0; i < count; i++) {
      if (input.output === "video") {
        const vidIdx = (input.prompt.length + i) % SAMPLE_VIDEO_POOL.length;
        resultUrls.push(SAMPLE_VIDEO_POOL[vidIdx]);
      } else {
        const imgIdx = (input.prompt.length + i) % SAMPLE_IMAGE_POOL.length;
        resultUrls.push(SAMPLE_IMAGE_POOL[imgIdx]);
      }
    }

    const layers: LayerItem[] | undefined =
      input.layerDecomposition && model.supportsLayerDecomposition
        ? [
            { index: 1, label: "Layer 01 · Studio Backdrop", previewUrl: SAMPLE_IMAGE_POOL[5], opacity: 100 },
            { index: 2, label: "Layer 02 · Primary Product Hero", previewUrl: resultUrls[0], opacity: 100 },
            { index: 3, label: "Layer 03 · Specular Rim Highlights", previewUrl: SAMPLE_IMAGE_POOL[2], opacity: 90 },
            { index: 4, label: "Layer 04 · Contact Shadow & Reflection", previewUrl: SAMPLE_IMAGE_POOL[3], opacity: 80 },
          ]
        : undefined;

    const turn: StudioGenerationTurn = {
      id: `gen-${Date.now()}`,
      createdAt: new Date().toISOString(),
      output: input.output,
      modelSlug: model.slug,
      modelTitle: model.title,
      vendor: model.vendor,
      mode: input.mode,
      prompt: input.prompt,
      aspectRatio: input.aspectRatio,
      resolution: input.resolution,
      durationSeconds: input.duration,
      numImages: count,
      tokensCharged,
      status: "succeeded",
      referenceImages: input.referenceImages,
      maskDataUrl: input.maskDataUrl,
      resultUrls,
      layers,
      lineageLabel: rawBody.lineageLabel ?? `Origin · ${model.title}`,
      providerUsed: rawBody.providerHint || "Neramit Simulation Engine",
    };

    return NextResponse.json({ turn });
  } catch {
    return NextResponse.json(
      { error: "Failed to process generation request", refunded: true },
      { status: 500 }
    );
  }
}
