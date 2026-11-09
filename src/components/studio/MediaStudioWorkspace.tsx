"use client";

import React from "react";
import { Film, Image as ImageIcon, MessageSquare, Mic, Sparkles } from "lucide-react";
import { useAppPreferences } from "@/hooks/use-app-preferences";
import { useMediaStudio } from "@/hooks/use-media-studio";
import { AudioStudioView } from "@/components/audio/AudioStudioView";
import { ChatStudioView } from "@/components/chat/ChatStudioView";
import { ModelSelectorBar } from "./ModelSelectorBar";
import { PipelineQueueBar } from "./PipelineQueueBar";
import { ReferenceMediaSlots } from "./ReferenceMediaSlots";
import { RichPromptComposer } from "./RichPromptComposer";
import { StudioOutputFeed } from "./StudioOutputFeed";

export function MediaStudioWorkspace({ kind }: { kind: "image" | "video" }) {
  const { locale, t, spendTokens, topUpTokens } = useAppPreferences();
  const studio = useMediaStudio(kind, locale, spendTokens, topUpTokens);

  const omniTabs = [
    { id: "image" as const, label: "1. Image & 16-Layer", icon: ImageIcon },
    { id: "video" as const, label: "2. Video & Motion (I2V)", icon: Film },
    { id: "audio" as const, label: "3. Seed Audio (@Audio1)", icon: Mic },
    { id: "chat" as const, label: "4. AI Creative Director", icon: MessageSquare },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6">
      <div className="neramit-glass flex flex-wrap items-center justify-between gap-3 rounded-3xl p-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="neu-tint-primary grid size-9 place-items-center rounded-2xl">
            <Sparkles className="size-4" />
          </span>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight">
              Neramit AI · Unified Omni-Studio Pipeline
            </h1>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              {locale === "th"
                ? "สลับโหมด Image ⇄ Video ⇄ Audio ⇄ Chat ได้ในหน้าเดียว พร้อมส่งต่องานข้ามสเตจ (@img-1)"
                : "Switch stages seamlessly and chain Image/Layers → Video I2V → Voiceover"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl p-1 neu-pressed">
          {omniTabs.map((tab) => {
            const Icon = tab.icon;
            const active = studio.stage === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => studio.switchStage(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all ${
                  active
                    ? "neu-tint-primary"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {studio.stage === "audio" ? (
        <AudioStudioView />
      ) : studio.stage === "chat" ? (
        <ChatStudioView />
      ) : (
        <>
          <PipelineQueueBar
            jobs={studio.queueJobs}
            simulateFailure={studio.simulateFailure}
            onToggleSimulateFailure={studio.setSimulateFailure}
            locale={locale}
          />

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
              studio.stage === "image"
                ? t.studio.promptPlaceholderImage
                : t.studio.promptPlaceholderVideo
            }
            referenceImages={studio.referenceImages}
            lineageLabel={studio.lineageLabel}
            errorMessage={studio.errorMessage}
            locale={locale}
          />

          <StudioOutputFeed
            turns={studio.turns}
            isGenerating={studio.isGenerating}
            onReuseTurn={studio.reuseTurn}
            onChainStage={studio.handleChainStage}
            locale={locale}
          />
        </>
      )}
    </div>
  );
}
