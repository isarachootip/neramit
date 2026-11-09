"use client";

import React from "react";
import { Brain, Layers, Volume2 } from "lucide-react";
import { StudioLocale, StudioModelDefinition, VideoModeId } from "@/domain/studio-types";

interface ModelSelectorBarProps {
  models: StudioModelDefinition[];
  activeModel: StudioModelDefinition;
  onSelectModel: (slug: string) => void;
  mode: VideoModeId;
  onSelectMode: (mode: VideoModeId) => void;
  resolution: string;
  onSelectResolution: (res: string) => void;
  aspectRatio: string;
  onSelectAspectRatio: (ratio: string) => void;
  duration: number;
  onChangeDuration: (sec: number) => void;
  numImages: number;
  onChangeNumImages: (num: number) => void;
  layerDecomposition: boolean;
  onToggleLayers: (val: boolean) => void;
  thinking: boolean;
  onToggleThinking: (val: boolean) => void;
  audio: boolean;
  onToggleAudio: (val: boolean) => void;
  locale: StudioLocale;
}

export function ModelSelectorBar({
  models,
  activeModel,
  onSelectModel,
  mode,
  onSelectMode,
  resolution,
  onSelectResolution,
  aspectRatio,
  onSelectAspectRatio,
  duration,
  onChangeDuration,
  numImages,
  onChangeNumImages,
  layerDecomposition,
  onToggleLayers,
  thinking,
  onToggleThinking,
  audio,
  onToggleAudio,
  locale,
}: ModelSelectorBarProps) {
  return (
    <section className="neu-raised neu-grain flex flex-col gap-4 rounded-3xl p-4 sm:p-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            {locale === "th" ? "เลือกโมเดล AI (GenWhy Catalogue)" : "Select AI Model"}
          </span>
          <span className="neu-pressed rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase">
            {activeModel.vendor} · Base {activeModel.baseTokens} Tokens
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
          {models.map((m) => {
            const isSelected = m.slug === activeModel.slug;
            return (
              <button
                key={m.slug}
                type="button"
                onClick={() => onSelectModel(m.slug)}
                className={`flex shrink-0 flex-col items-start gap-1 rounded-2xl p-3 text-left transition-all min-w-[185px] max-w-[220px] ${
                  isSelected ? "neu-pressed border-2 border-[var(--primary)]" : "neu-flat hover:opacity-95"
                }`}
              >
                <div className="flex w-full items-center justify-between gap-1.5">
                  <span className="truncate text-xs font-bold">{m.title}</span>
                  {m.flag && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[9px] font-extrabold uppercase ${
                        m.flag === "hot" ? "bg-amber-500/20 text-amber-400" : "bg-violet-500/20 text-violet-300"
                      }`}
                    >
                      {m.flag}
                    </span>
                  )}
                </div>
                <p className="line-clamp-2 text-[11px] leading-snug text-[var(--muted-foreground)]">
                  {locale === "th" ? m.taglineTh : m.tagline}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {activeModel.modes && activeModel.modes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl p-1.5 neu-pressed">
          {activeModel.modes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMode(m.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === m.id ? "neu-tint-primary" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {locale === "th" ? m.labelTh : m.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-[var(--muted-foreground)]">
            {locale === "th" ? "ความละเอียด (Resolution)" : "Resolution"}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {activeModel.resolutions.map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => onSelectResolution(res)}
                className={`rounded-xl px-2.5 py-1 text-xs font-bold ${resolution === res ? "neu-tint-primary" : "neu-pressed"}`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-[var(--muted-foreground)]">
            {locale === "th" ? "สัดส่วนภาพ (Aspect Ratio)" : "Aspect Ratio"}
          </label>
          <div className="flex flex-wrap gap-1">
            {activeModel.aspectRatios.slice(0, 6).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => onSelectAspectRatio(ratio)}
                className={`rounded-xl px-2 py-1 text-xs font-semibold ${aspectRatio === ratio ? "neu-tint-primary" : "neu-pressed"}`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {activeModel.output === "video" && activeModel.durationRange ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-[var(--muted-foreground)]">{locale === "th" ? "ความยาววิดีโอ" : "Duration"}</span>
              <span className="tabular-nums font-bold">{duration}s</span>
            </div>
            <input type="range" min={activeModel.durationRange.min} max={activeModel.durationRange.max} value={duration} onChange={(e) => onChangeDuration(Number(e.target.value))} className="accent-violet-500" />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-[var(--muted-foreground)]">{locale === "th" ? "จำนวนภาพ (Batch)" : "Image Count"}</span>
              <span className="tabular-nums font-bold">{numImages}</span>
            </div>
            <input type="range" min={1} max={4} value={numImages} onChange={(e) => onChangeNumImages(Number(e.target.value))} className="accent-violet-500" />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {activeModel.supportsLayerDecomposition && (
            <button type="button" onClick={() => onToggleLayers(!layerDecomposition)} className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold ${layerDecomposition ? "neu-tint-primary" : "neu-pressed"}`}>
              <Layers className="size-3.5" />
              <span>16 Layers</span>
            </button>
          )}
          {activeModel.supportsThinking && (
            <button type="button" onClick={() => onToggleThinking(!thinking)} className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold ${thinking ? "neu-tint-primary" : "neu-pressed"}`}>
              <Brain className="size-3.5" />
              <span>Thinking</span>
            </button>
          )}
          {activeModel.supportsAudioToggle && (
            <button type="button" onClick={() => onToggleAudio(!audio)} className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold ${audio ? "neu-tint-primary" : "neu-pressed"}`}>
              <Volume2 className="size-3.5" />
              <span>Audio (2x)</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
