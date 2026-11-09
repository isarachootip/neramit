import { z } from "zod";
import { VideoModeId } from "./studio-types";

export const ApiKeyVaultSchema = z.object({
  engineMode: z.enum(["simulation", "hybrid"]).default("hybrid"),
  geminiApiKey: z.string().trim().max(256).default(""),
  openaiApiKey: z.string().trim().max(256).default(""),
  falApiKey: z.string().trim().max(256).default(""),
});

export type ApiKeyVaultConfig = z.infer<typeof ApiKeyVaultSchema>;

export function validateApiKeyVault(input: unknown) {
  return ApiKeyVaultSchema.safeParse(input);
}

export interface AtMentionOption {
  tag: string;
  kind: "image" | "video" | "audio";
  label: string;
  previewUrl?: string;
}

export function detectAtMentionQuery(prompt: string): string | null {
  const match = prompt.match(/(?:^|\s)@([a-zA-Z0-9_-]*)$/);
  if (!match) return null;
  return match[1] ?? "";
}

export function applyAtMentionSelection(prompt: string, selectedTag: string): string {
  const replaced = prompt.replace(/(?:^|\s)@([a-zA-Z0-9_-]*)$/, (full) => {
    const leadingSpace = full.startsWith(" ") ? " " : "";
    return `${leadingSpace}${selectedTag} `;
  });
  if (replaced === prompt) {
    return `${prompt.trimEnd()} ${selectedTag} `;
  }
  return replaced;
}

export interface PipelineChainPayload {
  sourceTurnId: string;
  sourceModelTitle: string;
  mediaUrl: string;
  targetStage: "image" | "video" | "audio";
  layerLabel?: string;
}

export interface ChainedStageResult {
  targetStage: "image" | "video" | "audio";
  modelSlug: string;
  mode?: VideoModeId;
  referenceImages: string[];
  lineageLabel: string;
  prompt: string;
}

export function buildChainedStageState(payload: PipelineChainPayload): ChainedStageResult {
  const sourcePart = payload.layerLabel
    ? `${payload.sourceModelTitle} (${payload.layerLabel})`
    : payload.sourceModelTitle;

  if (payload.targetStage === "video") {
    return {
      targetStage: "video",
      modelSlug: "seedance-2-5",
      mode: "i2v",
      referenceImages: [payload.mediaUrl],
      lineageLabel: `Chained from ${sourcePart} → Seedance 2.5 (I2V)`,
      prompt: `Animate @img-1 with smooth orbital camera motion and cinematic lighting`,
    };
  }

  if (payload.targetStage === "audio") {
    return {
      targetStage: "audio",
      modelSlug: "seed-audio-1",
      referenceImages: [payload.mediaUrl],
      lineageLabel: `Chained from ${sourcePart} → Seed Audio 1.0`,
      prompt: `สัมผัสประสบการณ์ใหม่ที่เหนือระดับกับ Neramit AI วันนี้`,
    };
  }

  return {
    targetStage: "image",
    modelSlug: "gpt-image-2-5-flare",
    referenceImages: [payload.mediaUrl],
    lineageLabel: `Chained from ${sourcePart} → GPT Image 2.5 Flare`,
    prompt: `Refine product lighting and background details of @img-1`,
  };
}

export interface QueueJobItem {
  id: string;
  modelTitle: string;
  prompt: string;
  tokensReserved: number;
  status: "running" | "succeeded" | "failed";
  refundedTokens?: number;
  createdAt: string;
}

export function settleQueueJobRefund(input: {
  jobId: string;
  tokensReserved: number;
  status: "succeeded" | "failed";
}): { jobId: string; refundedTokens: number; netCharged: number } {
  if (input.status === "failed") {
    return {
      jobId: input.jobId,
      refundedTokens: input.tokensReserved,
      netCharged: 0,
    };
  }
  return {
    jobId: input.jobId,
    refundedTokens: 0,
    netCharged: input.tokensReserved,
  };
}
