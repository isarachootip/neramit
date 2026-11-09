"use client";

import React from "react";
import { useAppPreferences } from "@/hooks/use-app-preferences";
import { useMediaStudio } from "@/hooks/use-media-studio";
import { ModelSelectorBar } from "./ModelSelectorBar";
import { ReferenceMediaSlots } from "./ReferenceMediaSlots";
import { RichPromptComposer } from "./RichPromptComposer";
import { StudioOutputFeed } from "./StudioOutputFeed";

export function MediaStudioWorkspace({ kind }: { kind: "image" | "video" }) {
  const { locale, t, spendTokens } = useAppPreferences();
  const studio = useMediaStudio(kind, locale, spendTokens);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
          {kind === "image"
            ? locale === "th"
              ? "Image Studio · สร้างและรีทัชภาพโฆษณาระดับ 4K"
              : "Image Studio · 4K Generation & 16-Layer Editing"
            : locale === "th"
            ? "Video Studio · สร้างวิดีโอโฆษณาพร้อมเสียงซิงค์อัตโนมัติ"
            : "Video Studio · Multi-Mode Cinema & Synchronized Audio"}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
          {locale === "th"
            ? studio.activeModel.descriptionTh
            : studio.activeModel.description}
        </p>
      </div>

      <ModelSelectorBar
        models={studio.models}
        activeModel={studio.activeModel}
        onSelectModel={studio.selectModel}
        mode={studio.mode}
        onSelectMode={studio.setMode}
        resolution={studio.resolution}
        onSelectResolution={studio.setResolution}
        aspectRatio={studio.aspectRatio}
        onSelectAspectRatio={studio.setAspectRatio}
        duration={studio.duration}
        onChangeDuration={studio.setDuration}
        numImages={studio.numImages}
        onChangeNumImages={studio.setNumImages}
        layerDecomposition={studio.layerDecomposition}
        onToggleLayers={studio.setLayerDecomposition}
        thinking={studio.thinking}
        onToggleThinking={studio.setThinking}
        audio={studio.audio}
        onToggleAudio={studio.setAudio}
        locale={locale}
      />

      <ReferenceMediaSlots
        referenceImages={studio.referenceImages}
        maxReferences={studio.activeModel.maxReferenceImages}
        supportsMask={studio.activeModel.supportsMask}
        maskDataUrl={studio.maskDataUrl}
        onAddReference={studio.handleAddReference}
        onRemoveReference={studio.handleRemoveReference}
        onInsertTag={studio.handleInsertTag}
        onToggleMask={studio.setMaskDataUrl}
        locale={locale}
      />

      <RichPromptComposer
        prompt={studio.prompt}
        onChangePrompt={studio.setPrompt}
        presetId={studio.presetId}
        onSelectPreset={studio.setPresetId}
        onRollIdea={studio.handleRollIdea}
        onEnhancePrompt={studio.handleEnhancePrompt}
        onSubmit={studio.submitGeneration}
        isGenerating={studio.isGenerating}
        estimatedTokens={studio.estimatedTokens}
        tokenDelta={studio.tokenDelta}
        maxChars={studio.activeModel.maxPromptChars}
        placeholder={
          kind === "image"
            ? t.studio.promptPlaceholderImage
            : t.studio.promptPlaceholderVideo
        }
        referenceCount={studio.referenceImages.length}
        onInsertTag={studio.handleInsertTag}
        errorMessage={studio.errorMessage}
        locale={locale}
      />

      <StudioOutputFeed
        turns={studio.turns}
        isGenerating={studio.isGenerating}
        onReuseTurn={studio.reuseTurn}
        locale={locale}
      />
    </div>
  );
}
