"use client";

import React from "react";
import { Coins, Dices, GitBranch, Sparkles, Wand2 } from "lucide-react";
import {
  applyAtMentionSelection,
  detectAtMentionQuery,
} from "@/domain/neramit-vault-types";
import {
  extractReferenceTags,
  PROMPT_STYLE_PRESETS,
} from "@/domain/rich-prompt-engine";
import { StudioLocale } from "@/domain/studio-types";
import { AtMentionPopover } from "./AtMentionPopover";

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
  referenceImages: string[];
  lineageLabel?: string;
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
  referenceImages,
  lineageLabel,
  errorMessage,
  locale,
}: RichPromptComposerProps) {
  const activeTags = extractReferenceTags(prompt);
  const mentionQuery = detectAtMentionQuery(prompt);

  const handleSelectMention = (tag: string) => {
    onChangePrompt(applyAtMentionSelection(prompt, tag));
  };

  const handleRemoveTagFromPrompt = (tag: string) => {
    const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const next = prompt.replace(new RegExp(escaped, "g"), "").replace(/\s{2,}/g, " ").trim();
    onChangePrompt(next);
  };

  return (
    <div className="neramit-glass neu-grain flex flex-col gap-3 rounded-3xl p-4 sm:p-5">
      {lineageLabel && (
        <div className="flex items-center gap-2 rounded-2xl bg-violet-500/15 px-3 py-1.5 text-xs font-bold text-violet-300">
          <GitBranch className="size-3.5" />
          <span>Pipeline Active: {lineageLabel}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            {locale === "th" ? "พรีเซ็ตโฆษณา:" : "Ad Presets:"}
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
            className="neu-flat flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold"
          >
            <Dices className="size-3.5 text-violet-400" />
            <span>{locale === "th" ? "สุ่มไอเดีย" : "Roll Idea"}</span>
          </button>
          <button
            type="button"
            onClick={onEnhancePrompt}
            className="neu-flat flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold"
          >
            <Wand2 className="size-3.5 text-amber-400" />
            <span>{locale === "th" ? "AI อัปเกรด Prompt" : "AI Enhance"}</span>
          </button>
        </div>
      </div>

      <AtMentionPopover
        query={mentionQuery}
        referenceImages={referenceImages}
        activeTags={activeTags}
        onSelectMention={handleSelectMention}
        onRemoveTagFromPrompt={handleRemoveTagFromPrompt}
        locale={locale}
      />

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
        <div className="rounded-xl bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-300">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <span className="tabular-nums text-xs text-[var(--muted-foreground)]">
          {prompt.length.toLocaleString()} / {maxChars.toLocaleString()} chars ·{" "}
          <span className="hidden sm:inline">Type @ to mention assets · Ctrl+Enter to Run</span>
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
                ? "เนรมิตผลงาน"
                : "Generate"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
