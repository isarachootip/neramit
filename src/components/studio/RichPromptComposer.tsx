"use client";

import React from "react";
import { Coins, Dices, Sparkles, Wand2 } from "lucide-react";
import {
  extractReferenceTags,
  PROMPT_STYLE_PRESETS,
} from "@/domain/rich-prompt-engine";
import { StudioLocale } from "@/domain/studio-types";

interface RichPromptComposerProps {
  prompt: string;
  onChangePrompt: (val: string) => void;
  presetId: string;
  onSelectPreset: (id: string) => void;
  onRollIdea: () => void;
  onEnhancePrompt: () => void;
  onSubmit: () => void;
  isGenerating: boolean;
  estimatedTokens: number;
  tokenDelta: number;
  maxChars: number;
  placeholder: string;
  referenceCount: number;
  onInsertTag: (tag: string) => void;
  errorMessage: string | null;
  locale: StudioLocale;
}

export function RichPromptComposer({
  prompt,
  onChangePrompt,
  presetId,
  onSelectPreset,
  onRollIdea,
  onEnhancePrompt,
  onSubmit,
  isGenerating,
  estimatedTokens,
  tokenDelta,
  maxChars,
  placeholder,
  referenceCount,
  onInsertTag,
  errorMessage,
  locale,
}: RichPromptComposerProps) {
  const activeTags = extractReferenceTags(prompt);

  return (
    <div className="neu-raised neu-grain flex flex-col gap-3 rounded-3xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            {locale === "th" ? "สไตล์ภาพ (Mantra Presets):" : "Style Presets:"}
          </span>
          {PROMPT_STYLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset.id)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                presetId === preset.id ? "neu-tint-primary" : "neu-pressed"
              }`}
            >
              {locale === "th" ? preset.labelTh : preset.labelEn}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onRollIdea}
            className="neu-flat flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-transform active:scale-95"
          >
            <Dices className="size-3.5 text-violet-400" />
            <span>{locale === "th" ? "สุ่มไอเดีย" : "Roll Idea"}</span>
          </button>
          <button
            type="button"
            onClick={onEnhancePrompt}
            className="neu-flat flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-transform active:scale-95"
          >
            <Wand2 className="size-3.5 text-amber-400" />
            <span>{locale === "th" ? "AI อัปเกรด Prompt" : "AI Enhance"}</span>
          </button>
        </div>
      </div>

      {(activeTags.length > 0 || referenceCount > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl px-3 py-2 neu-pressed">
          <span className="text-[11px] font-semibold text-[var(--muted-foreground)]">
            {locale === "th" ? "ตัวแปรอ้างอิงใน Prompt:" : "Active Reference Pills:"}
          </span>
          {Array.from({ length: Math.max(referenceCount, 2) }).map((_, i) => {
            const tag = `@img-${i + 1}`;
            const isUsed = activeTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onInsertTag(tag)}
                className={`rounded-lg px-2 py-0.5 text-xs font-bold transition-all ${
                  isUsed
                    ? "neu-tint-primary"
                    : "neu-flat text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {tag} {isUsed ? "✓" : "+"}
              </button>
            );
          })}
        </div>
      )}

      <textarea
        rows={3}
        value={prompt}
        onChange={(e) => onChangePrompt(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            if (!isGenerating) onSubmit();
          }
        }}
        className="neu-pressed w-full resize-none rounded-2xl p-3.5 text-sm leading-relaxed focus:outline-2 focus:outline-violet-500"
      />

      {errorMessage && (
        <div className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-400">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <span className="tabular-nums text-xs text-[var(--muted-foreground)]">
          {prompt.length.toLocaleString()} / {maxChars.toLocaleString()} chars ·{" "}
          <span className="hidden sm:inline">Ctrl+Enter to Generate</span>
        </span>

        <div className="flex items-center gap-3">
          <div className="neu-pressed flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold">
            <Coins className="size-3.5 text-amber-400" />
            <span className="tabular-nums">{estimatedTokens} Tokens</span>
            {tokenDelta !== 0 && (
              <span
                className={`text-[10px] font-extrabold ${
                  tokenDelta > 0 ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                ({tokenDelta > 0 ? `+${tokenDelta}` : tokenDelta})
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={onSubmit}
            className="neu-tint-primary flex items-center gap-2 rounded-full px-6 py-2.5 text-xs sm:text-sm font-extrabold tracking-wide transition-transform active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="size-4" />
            <span>
              {isGenerating
                ? locale === "th"
                  ? "กำลังเนรมิต..."
                  : "Rendering..."
                : locale === "th"
                ? "สร้างผลงาน"
                : "Generate"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
