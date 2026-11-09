"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ALL_STUDIO_MODELS, getModelBySlug } from "../domain/models-video-data";
import { buildChainedStageState, PipelineChainPayload, QueueJobItem, settleQueueJobRefund } from "../domain/neramit-vault-types";
import { enhanceCreativePrompt, insertReferenceTag, rollPromptIdea, syncPromptWithReferences } from "../domain/rich-prompt-engine";
import { StudioGenerationTurn, StudioLocale, StudioModelDefinition, VideoModeId } from "../domain/studio-types";
import { calculateGenerationTokens } from "../domain/token-pricing";
import { loadGenerationTurns, saveGenerationTurns } from "../repositories/studio-storage";

export function useMediaStudio(
  initialKind: "image" | "video",
  locale: StudioLocale,
  spendTokens: (amount: number) => boolean,
  refundTokens: (amount: number) => void
) {
  const [stage, setStage] = useState<"image" | "video" | "audio" | "chat">(initialKind);
  const mediaKind: "image" | "video" = stage === "video" ? "video" : "image";
  const models = useMemo(() => ALL_STUDIO_MODELS.filter((m) => m.output === mediaKind), [mediaKind]);

  const [selectedSlug, setSelectedSlug] = useState<string>(initialKind === "video" ? "seedance-2-5" : "seedream-5-pro");
  const activeModel: StudioModelDefinition = getModelBySlug(selectedSlug) ?? models[0];

  const [mode, setMode] = useState<VideoModeId>(activeModel.modes?.[0]?.id ?? "t2v");
  const [prompt, setPrompt] = useState<string>("");
  const [presetId, setPresetId] = useState<string>("cinematic-35mm");
  const [resolution, setResolution] = useState<string>(activeModel.resolutions[0] ?? "2K");
  const [aspectRatio, setAspectRatio] = useState<string>(activeModel.aspectRatios[0] ?? "1:1");
  const [duration, setDuration] = useState<number>(activeModel.durationRange?.defaultVal ?? 5);
  const [numImages, setNumImages] = useState<number>(1);
  const [layerDecomposition, setLayerDecomposition] = useState<boolean>(false);
  const [thinking, setThinking] = useState<boolean>(false);
  const [audio, setAudio] = useState<boolean>(activeModel.audioIncluded ?? false);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [maskDataUrl, setMaskDataUrl] = useState<string | undefined>(undefined);
  const [lineageLabel, setLineageLabel] = useState<string | undefined>(undefined);
  const [turns, setTurns] = useState<StudioGenerationTurn[]>([]);
  const [queueJobs, setQueueJobs] = useState<QueueJobItem[]>([]);
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setTurns(loadGenerationTurns());
  }, []);

  const selectModel = (slug: string) => {
    const next = getModelBySlug(slug);
    if (!next) return;
    setSelectedSlug(slug);
    setResolution(next.resolutions[0] ?? "1K");
    setAspectRatio(next.aspectRatios[0] ?? "1:1");
    if (next.modes?.[0]) setMode(next.modes[0].id);
    if (next.durationRange) setDuration(next.durationRange.defaultVal);
    setAudio(next.audioIncluded ?? false);
    setLayerDecomposition(false);
    setErrorMessage(null);
  };

  const switchStage = (nextStage: "image" | "video" | "audio" | "chat") => {
    setStage(nextStage);
    if (nextStage === "image" && activeModel.output !== "image") selectModel("seedream-5-pro");
    if (nextStage === "video" && activeModel.output !== "video") selectModel("seedance-2-5");
  };

  const estimatedTokens = useMemo(
    () =>
      calculateGenerationTokens(activeModel, {
        size: resolution, resolution, num_images: numImages,
        layer_decomposition: layerDecomposition, thinking, mode, duration, audio,
      }),
    [activeModel, resolution, numImages, layerDecomposition, thinking, mode, duration, audio]
  );

  const prevTokensRef = useRef<number>(estimatedTokens);
  const tokenDelta = estimatedTokens - prevTokensRef.current;
  useEffect(() => {
    prevTokensRef.current = estimatedTokens;
  }, [estimatedTokens]);

  const handleChainStage = (payload: PipelineChainPayload) => {
    const res = buildChainedStageState(payload);
    setStage(res.targetStage);
    if (res.targetStage === "video" || res.targetStage === "image") {
      selectModel(res.modelSlug);
      if (res.mode) setMode(res.mode);
      setReferenceImages(res.referenceImages);
      setLineageLabel(res.lineageLabel);
      setPrompt(res.prompt);
    }
  };

  const submitGeneration = async () => {
    setErrorMessage(null);
    if (queueJobs.filter((j) => j.status === "running").length >= 4) {
      setErrorMessage(locale === "th" ? "รันคิวพร้อมกันได้สูงสุด 4 งาน" : "Max 4 concurrent jobs allowed");
      return;
    }
    if (!prompt.trim()) {
      setErrorMessage(locale === "th" ? "กรุณาพิมพ์คำสั่ง Prompt ก่อนเริ่มสร้าง" : "Please enter a prompt");
      return;
    }
    if (!spendTokens(estimatedTokens)) {
      setErrorMessage(locale === "th" ? "Token ไม่เพียงพอ กรุณาเติม Token" : "Insufficient tokens");
      return;
    }

    const jobId = `job-${Date.now()}`;
    setQueueJobs((p) => [{ id: jobId, modelTitle: activeModel.title, prompt, tokensReserved: estimatedTokens, status: "running", createdAt: new Date().toISOString() }, ...p]);
    setIsGenerating(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelSlug: activeModel.slug, output: mediaKind, mode: mediaKind === "video" ? mode : undefined,
          prompt, aspectRatio, resolution, duration: mediaKind === "video" ? duration : undefined,
          numImages, layerDecomposition, thinking, audio, referenceImages, maskDataUrl, lineageLabel, simulateFailure,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.turn) {
        const settled = settleQueueJobRefund({ jobId, tokensReserved: estimatedTokens, status: "failed" });
        refundTokens(settled.refundedTokens);
        setQueueJobs((p) => p.map((j) => (j.id === jobId ? { ...j, status: "failed", refundedTokens: settled.refundedTokens } : j)));
        setErrorMessage(data.error ?? "Job failed — 100% Tokens Auto-Refunded");
        return;
      }
      setQueueJobs((p) => p.map((j) => (j.id === jobId ? { ...j, status: "succeeded" } : j)));
      setTurns((p) => {
        const updated = [data.turn as StudioGenerationTurn, ...p];
        saveGenerationTurns(updated);
        return updated;
      });
    } catch {
      refundTokens(estimatedTokens);
      setQueueJobs((p) => p.map((j) => (j.id === jobId ? { ...j, status: "failed", refundedTokens: estimatedTokens } : j)));
      setErrorMessage("Network failure — 100% Tokens Auto-Refunded");
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    stage, switchStage, models, activeModel, selectModel, mode, setMode, prompt, setPrompt, presetId, setPresetId,
    resolution, setResolution, aspectRatio, setAspectRatio, duration, setDuration, numImages, setNumImages,
    layerDecomposition, setLayerDecomposition, thinking, setThinking, audio, setAudio,
    referenceImages,
    handleAddReference: (url: string) => setReferenceImages((p) => (p.length >= activeModel.maxReferenceImages ? p : [...p, url])),
    handleRemoveReference: (idx: number) => setReferenceImages((p) => {
      const next = p.filter((_, i) => i !== idx);
      setPrompt((c) => syncPromptWithReferences(c, next.length));
      return next;
    }),
    maskDataUrl, setMaskDataUrl, lineageLabel, queueJobs, simulateFailure, setSimulateFailure,
    handleInsertTag: (tag: string) => setPrompt((c) => insertReferenceTag(c, tag)),
    handleRollIdea: () => setPrompt(rollPromptIdea(mediaKind, locale, prompt)),
    handleEnhancePrompt: () => setPrompt((c) => enhanceCreativePrompt(c, presetId)),
    handleChainStage, estimatedTokens, tokenDelta,
    turns: turns.filter((t) => t.output === mediaKind),
    isGenerating, errorMessage, submitGeneration,
    reuseTurn: (t: StudioGenerationTurn) => {
      selectModel(t.modelSlug);
      setPrompt(t.prompt);
      setReferenceImages(t.referenceImages);
    },
  };
}
