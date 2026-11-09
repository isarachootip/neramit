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
  "https://cdn.genwhy.app/templates/dafbcf8c-d52a-49d5-b0d5-bbb1519ab561/cover-video-1fd57af0-33d1-4367-9dc0-4922b7b89cdb.mp4",
  "https://cdn.genwhy.app/templates/6a1eed36-e01c-4302-9bb0-fae627f8904b/cover-video-1386c3b2-4245-48bb-b866-1ad997aa63bb.mp4",
  "https://cdn.genwhy.app/templates/8b07627a-516f-45dc-bc8c-8aa0979a3fb7/cover-video.mp4",
  "https://cdn.genwhy.app/templates/8f9505d0-4d0d-455e-af39-aebd6a8501f2/cover-video-336378cc-9a1e-4019-81fc-cbaca371ffc2.mp4",
  "https://cdn.genwhy.app/templates/41f28602-ee7f-431d-abf8-71e690e4c48c/cover-video.mp4",
];

export async function POST(request: Request) {
  try {
    const rawBody: unknown = await request.json();
    const parsed = validateGenerationInput(rawBody);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message ?? "Invalid generation parameters" },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const model = getModelBySlug(input.modelSlug);
    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
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
    };

    return NextResponse.json({ turn });
  } catch {
    return NextResponse.json(
      { error: "Failed to process generation request" },
      { status: 500 }
    );
  }
}
