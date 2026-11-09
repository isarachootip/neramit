"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ALL_STUDIO_MODELS, getModelBySlug } from "../domain/models-video-data";
import { enhanceCreativePrompt, insertReferenceTag, rollPromptIdea, syncPromptWithReferences } from "../domain/rich-prompt-engine";
import { StudioGenerationTurn, StudioLocale, StudioModelDefinition, VideoModeId } from "../domain/studio-types";
import { calculateGenerationTokens } from "../domain/token-pricing";
import { loadGenerationTurns, saveGenerationTurns } from "../repositories/studio-storage";

export function useMediaStudio(
  initialKind: "image" | "video",
  locale: StudioLocale,
  spendTokens: (amount: number) => boolean
) {
  const models = useMemo(() => ALL_STUDIO_MODELS.filter((m) => m.output === initialKind), [initialKind]);
  const [selectedSlug, setSelectedSlug] = useState<string>(models[0]?.slug ?? "seedream-5-lite");
  const activeModel: StudioModelDefinition = getModelBySlug(selectedSlug) ?? models[0];

  const [mode, setMode] = useState<VideoModeId>(activeModel.modes?.[0]?.id ?? "t2v");
  const [prompt, setPrompt] = useState<string>("");
  const [presetId, setPresetId] = useState<string>("cinematic-35mm");
  const [resolution, setResolution] = useState<string>(activeModel.resolutions[0] ?? "2K");
  const [aspectRatio, setAspectRatio] = useState<string>(activeModel.aspectRatios[0] ?? "1:1");
  const [duration, setDuration] = useState<number>(activeModel.durationRange?.defaultVal ?? 5);
  const [numImages, setNumImages] = useState<number>(1);
  const [sequential, setSequential] = useState<boolean>(false);
  const [layerDecomposition, setLayerDecomposition] = useState<boolean>(false);
  const [thinking, setThinking] = useState<boolean>(false);
  const [audio, setAudio] = useState<boolean>(activeModel.audioIncluded ?? false);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [maskDataUrl, setMaskDataUrl] = useState<string | undefined>(undefined);
  const [turns, setTurns] = useState<StudioGenerationTurn[]>([]);
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

  const estimatedTokens = useMemo(
    () =>
      calculateGenerationTokens(activeModel, {
        size: resolution,
        resolution,
        num_images: numImages,
        sequential,
        max_images: numImages,
        layer_decomposition: layerDecomposition,
        thinking,
        mode,
        duration,
        audio,
      }),
    [activeModel, resolution, numImages, sequential, layerDecomposition, thinking, mode, duration, audio]
  );

  const prevTokensRef = useRef<number>(estimatedTokens);
  const tokenDelta = estimatedTokens - prevTokensRef.current;
  useEffect(() => {
    prevTokensRef.current = estimatedTokens;
  }, [estimatedTokens]);

  const handleAddReference = (url: string) => {
    setReferenceImages((prev) => (prev.length >= activeModel.maxReferenceImages ? prev : [...prev, url]));
  };

  const handleRemoveReference = (index: number) => {
    setReferenceImages((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      setPrompt((curr) => syncPromptWithReferences(curr, next.length));
      return next;
    });
  };

  const submitGeneration = async () => {
    setErrorMessage(null);
    if (!prompt.trim()) {
      setErrorMessage(locale === "th" ? "กรุณาพิมพ์คำสั่ง Prompt ก่อนเริ่มสร้าง" : "Please enter a prompt");
      return;
    }
    if (initialKind === "video") {
      const mDef = activeModel.modes?.find((m) => m.id === mode);
      if (mDef?.requiresFirstFrame && referenceImages.length < 1) {
        setErrorMessage(locale === "th" ? "โหมดนี้ต้องใส่ภาพเฟรมเริ่มต้นอย่างน้อย 1 ภาพ" : "Requires at least 1 reference image");
        return;
      }
      if (mDef?.requiresLastFrame && referenceImages.length < 2) {
        setErrorMessage(locale === "th" ? "โหมด FLF ต้องใส่ภาพเฟรมแรกและเฟรมสุดท้ายครบ 2 ภาพ" : "FLF mode requires 2 reference images");
        return;
      }
    }
    if (!spendTokens(estimatedTokens)) {
      setErrorMessage(locale === "th" ? "Token ไม่เพียงพอ กรุณาเติม Token" : "Insufficient tokens");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelSlug: activeModel.slug,
          output: initialKind,
          mode: initialKind === "video" ? mode : undefined,
          prompt,
          aspectRatio,
          resolution,
          duration: initialKind === "video" ? duration : undefined,
          numImages,
          sequential,
          layerDecomposition,
          thinking,
          audio,
          referenceImages,
          maskDataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.turn) {
        setErrorMessage(data.error ?? "Generation failed");
        return;
      }
      setTurns((prev) => {
        const updated = [data.turn as StudioGenerationTurn, ...prev];
        saveGenerationTurns(updated);
        return updated;
      });
    } catch {
      setErrorMessage("Network error while generating media");
    } finally {
      setIsGenerating(false);
    }
  };

  const reuseTurn = (turn: StudioGenerationTurn) => {
    selectModel(turn.modelSlug);
    setPrompt(turn.prompt);
    setAspectRatio(turn.aspectRatio);
    setResolution(turn.resolution);
    if (turn.mode) setMode(turn.mode);
    if (turn.durationSeconds) setDuration(turn.durationSeconds);
    setReferenceImages(turn.referenceImages);
  };

  return {
    models, activeModel, selectModel, mode, setMode, prompt, setPrompt, presetId, setPresetId,
    resolution, setResolution, aspectRatio, setAspectRatio, duration, setDuration, numImages, setNumImages,
    sequential, setSequential, layerDecomposition, setLayerDecomposition, thinking, setThinking, audio, setAudio,
    referenceImages, handleAddReference, handleRemoveReference, maskDataUrl, setMaskDataUrl,
    handleInsertTag: (tag: string) => setPrompt((c) => insertReferenceTag(c, tag)),
    handleRollIdea: () => setPrompt(rollPromptIdea(initialKind, locale, prompt)),
    handleEnhancePrompt: () => setPrompt((c) => enhanceCreativePrompt(c, presetId)),
    estimatedTokens, tokenDelta, turns: turns.filter((t) => t.output === initialKind),
    isGenerating, errorMessage, submitGeneration, reuseTurn,
  };
}
