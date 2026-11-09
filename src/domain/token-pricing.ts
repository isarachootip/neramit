import { StudioModelDefinition } from "./studio-types";

export interface GenerationPricingParams {
  size?: string;
  resolution?: string;
  num_images?: number;
  sequential?: boolean;
  max_images?: number;
  layer_decomposition?: boolean;
  thinking?: boolean;
  quality?: "low" | "medium" | "high" | "xhigh" | "max";
  mode?: string;
  duration?: number;
  audio?: boolean;
  upscale_factor?: number;
  creativity?: boolean;
}

const IMAGE_RES_MULTIPLIER: Record<string, number> = {
  "0.5K": 0.75,
  "1K": 1,
  "1k": 1,
  "1.5K": 1.25,
  "2K": 1.5,
  "2k": 1.5,
  "3K": 2.0,
  "4K": 2.5,
};

const QUALITY_MULTIPLIER: Record<string, number> = {
  low: 0.75,
  medium: 1,
  high: 1.35,
  xhigh: 1.75,
  max: 2.2,
};

const VIDEO_RES_MULTIPLIER: Record<string, number> = {
  "480p": 0.75,
  "720p": 1,
  "1080p": 1.5,
  "4K": 2.5,
};

export function calculateGenerationTokens(
  model: StudioModelDefinition,
  params: GenerationPricingParams
): number {
  if (model.output === "image") {
    const resKey = params.size ?? params.resolution ?? model.resolutions[0] ?? "1K";
    const resMult = IMAGE_RES_MULTIPLIER[resKey] ?? 1;
    const qualMult = params.quality ? (QUALITY_MULTIPLIER[params.quality] ?? 1) : 1;

    if (params.layer_decomposition && model.supportsLayerDecomposition) {
      const layerBase = Math.round(model.baseTokens * 2.4 * resMult);
      const thinkingAdd = params.thinking ? 12 : 0;
      return layerBase + thinkingAdd;
    }

    const imageCount =
      params.sequential && model.supportsBatch
        ? Math.max(2, Math.min(15, params.max_images ?? 4))
        : Math.max(1, Math.min(4, params.num_images ?? 1));

    const thinkingBonus = params.thinking && model.supportsThinking ? 1.2 : 1;
    const perImage = Math.round(model.baseTokens * resMult * qualMult * thinkingBonus);
    return perImage * imageCount;
  }

  if (model.output === "video") {
    const resKey = params.resolution ?? model.resolutions[0] ?? "720p";
    const resMult = VIDEO_RES_MULTIPLIER[resKey] ?? 1;
    const seconds = Math.max(
      model.durationRange?.min ?? 4,
      Math.min(model.durationRange?.max ?? 30, params.duration ?? model.durationRange?.defaultVal ?? 5)
    );

    if (params.mode === "upscale") {
      const factor = params.upscale_factor ?? 2;
      const creativeMult = params.creativity ? 1.35 : 1;
      return Math.round(model.baseTokens * seconds * (factor / 1.5) * creativeMult);
    }

    const perSecondCost = model.baseTokens * resMult;
    const baseClipCost = Math.round(perSecondCost * seconds);

    if (model.supportsAudioToggle && params.audio) {
      return baseClipCost * 2;
    }

    return baseClipCost;
  }

  return model.baseTokens;
}

export function estimateAudioScriptTokens(script: string): {
  seconds: number;
  tokens: number;
} {
  const cleaned = script.trim();
  if (!cleaned) {
    return { seconds: 0, tokens: 0 };
  }
  const charCount = Array.from(cleaned).length;
  const seconds = Math.max(2, Math.ceil(charCount / 11));
  const tokens = Math.max(10, seconds * 5);
  return { seconds, tokens };
}
