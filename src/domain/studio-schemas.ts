import { z } from "zod";
import { getModelBySlug } from "./models-video-data";
import { NERAMIT_TEMPLATES } from "./templates-data";

export const GenerationRequestSchema = z
  .object({
    modelSlug: z.string().min(1),
    output: z.enum(["image", "video"]),
    mode: z
      .enum([
        "t2v",
        "i2v",
        "flf",
        "extend",
        "edit",
        "reference",
        "avatar",
        "avatar20",
        "motion",
        "upscale",
      ])
      .optional(),
    prompt: z.string().trim().min(1, "Prompt is required").max(50000),
    aspectRatio: z.string().default("1:1"),
    resolution: z.string().default("2K"),
    duration: z.number().min(4).max(60).optional(),
    numImages: z.number().int().min(1).max(15).default(1),
    sequential: z.boolean().optional(),
    layerDecomposition: z.boolean().optional(),
    thinking: z.boolean().optional(),
    audio: z.boolean().optional(),
    referenceImages: z.array(z.string()).max(16).default([]),
    maskDataUrl: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const model = getModelBySlug(data.modelSlug);
    if (!model) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["modelSlug"],
        message: `Unknown model: ${data.modelSlug}`,
      });
      return;
    }

    if (data.prompt.length > model.maxPromptChars) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["prompt"],
        message: `Prompt exceeds max length of ${model.maxPromptChars} characters`,
      });
    }

    if (data.output === "video" && data.mode) {
      const modeDef = model.modes?.find((m) => m.id === data.mode);
      if (modeDef?.requiresFirstFrame && data.referenceImages.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["referenceImages"],
          message: `Mode ${data.mode} requires at least 1 reference frame image`,
        });
      }
      if (modeDef?.requiresLastFrame && data.referenceImages.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["referenceImages"],
          message: "First & Last Frame mode (flf) requires both opening and closing images",
        });
      }
    }
  });

export const AudioGenerationSchema = z.object({
  mode: z.enum(["describe", "voice", "clone", "image"]),
  prompt: z.string().trim().min(1, "Script is required").max(4000),
  voiceId: z.string().min(1),
  format: z.enum(["mp3", "wav", "ogg_opus"]).default("mp3"),
  speechRate: z.number().min(-50).max(100).default(0),
  loudnessRate: z.number().min(-50).max(100).default(0),
  pitchRate: z.number().min(-12).max(12).default(0),
  subtitles: z.boolean().default(true),
  referenceAudioCount: z.number().int().min(0).max(3).optional(),
  referenceImageUrl: z.string().optional(),
});

export const TemplateExecutionSchema = z
  .object({
    templateSlug: z.string().min(1),
    answers: z.record(z.string(), z.string()),
    slotImages: z.record(z.string(), z.string()),
    brief: z.string().max(1500).optional(),
    aspectRatio: z.string().default("9:16"),
  })
  .superRefine((data, ctx) => {
    const tpl = NERAMIT_TEMPLATES.find((t) => t.slug === data.templateSlug);
    if (!tpl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["templateSlug"],
        message: "Template not found",
      });
      return;
    }
    for (const slot of tpl.imageSlots) {
      if (slot.required && !data.slotImages[slot.key]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["slotImages", slot.key],
          message: `Missing required image slot: ${slot.label}`,
        });
      }
    }
  });

export type ValidatedGenerationInput = z.infer<typeof GenerationRequestSchema>;
export type ValidatedAudioInput = z.infer<typeof AudioGenerationSchema>;
export type ValidatedTemplateInput = z.infer<typeof TemplateExecutionSchema>;

export function validateGenerationInput(input: unknown) {
  return GenerationRequestSchema.safeParse(input);
}

export function validateAudioGenerationInput(input: unknown) {
  return AudioGenerationSchema.safeParse(input);
}

export function validateTemplateExecutionInput(input: unknown) {
  return TemplateExecutionSchema.safeParse(input);
}
