"use client";

import React, { useState } from "react";
import { Coins, Download, Film, GitBranch, Layers, Mic, RotateCcw, Sparkles } from "lucide-react";
import { PipelineChainPayload } from "@/domain/neramit-vault-types";
import { StudioGenerationTurn, StudioLocale } from "@/domain/studio-types";

interface StudioOutputFeedProps {
  turns: StudioGenerationTurn[];
  isGenerating: boolean;
  onReuseTurn: (turn: StudioGenerationTurn) => void;
  onChainStage: (payload: PipelineChainPayload) => void;
  locale: StudioLocale;
}

export function StudioOutputFeed({
  turns,
  isGenerating,
  onReuseTurn,
  onChainStage,
  locale,
}: StudioOutputFeedProps) {
  const [expandedLayerTurnId, setExpandedLayerTurnId] = useState<string | null>("seed-turn-1");

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
          {locale === "th" ? "สายพานผลลัพธ์ (Neramit Pipeline Feed)" : "Neramit Pipeline Output Feed"}
        </h2>
        <span className="text-xs text-[var(--muted-foreground)]">
          {turns.length} {locale === "th" ? "รายการ" : "turns"}
        </span>
      </div>

      {isGenerating && (
        <div className="neu-raised neu-shimmer flex h-52 flex-col items-center justify-center gap-2 rounded-3xl p-6 text-center">
          <Sparkles className="size-7 animate-spin text-violet-400" />
          <p className="text-sm font-bold">
            {locale === "th" ? "กำลังประมวลผลบน Neramit Hybrid Cluster..." : "Rendering on Neramit Hybrid Cluster..."}
          </p>
        </div>
      )}

      {turns.map((turn) => {
        const showLayers = expandedLayerTurnId === turn.id;
        return (
          <article key={turn.id} className="neramit-glass neu-grain flex flex-col gap-4 rounded-3xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="neu-tint-primary rounded-full px-3 py-1 text-xs font-bold">{turn.modelTitle}</span>
                {turn.mode && (
                  <span className="neu-pressed rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase">{turn.mode}</span>
                )}
                {turn.providerUsed && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      turn.providerUsed.startsWith("Live")
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "neu-pressed text-[var(--muted-foreground)]"
                    }`}
                  >
                    {turn.providerUsed}
                  </span>
                )}
                {turn.lineageLabel && (
                  <span className="flex items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[11px] font-bold text-violet-300">
                    <GitBranch className="size-3" />
                    <span>{turn.lineageLabel}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="neu-pressed flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold">
                  <Coins className="size-3 text-amber-400" />
                  <span>{turn.tokensCharged}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onReuseTurn(turn)}
                  className="neu-flat flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold"
                >
                  <RotateCcw className="size-3.5" />
                  <span>{locale === "th" ? "ใช้ซ้ำ" : "Reuse"}</span>
                </button>
              </div>
            </div>

            <p className="neu-pressed rounded-2xl p-3 text-xs sm:text-sm leading-relaxed">{turn.prompt}</p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {turn.resultUrls.map((url, idx) =>
                turn.output === "video" ? (
                  <div key={`${turn.id}-vid-${idx}`} className="neu-pressed relative overflow-hidden rounded-2xl bg-black/40">
                    <video src={url} controls loop playsInline className="max-h-[400px] w-full object-contain" />
                  </div>
                ) : (
                  <div key={`${turn.id}-img-${idx}`} className="neu-pressed group relative overflow-hidden rounded-2xl">
                    <img src={url} alt={turn.prompt} className="max-h-[400px] w-full object-cover" />
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="neu-raised absolute bottom-3 right-3 flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                    >
                      <Download className="size-3.5" />
                      <span>HD</span>
                    </a>
                  </div>
                )
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {turn.output === "image" && (
                <button
                  type="button"
                  onClick={() =>
                    onChainStage({
                      sourceTurnId: turn.id,
                      sourceModelTitle: turn.modelTitle,
                      mediaUrl: turn.resultUrls[0],
                      targetStage: "video",
                    })
                  }
                  className="neu-tint-primary flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold"
                >
                  <Film className="size-3.5" />
                  <span>{locale === "th" ? "ส่งภาพนี้ไปสร้างวิดีโอ I2V (@img-1)" : "Chain to Video I2V (@img-1)"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  onChainStage({
                    sourceTurnId: turn.id,
                    sourceModelTitle: turn.modelTitle,
                    mediaUrl: turn.resultUrls[0],
                    targetStage: "audio",
                  })
                }
                className="neu-flat flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold"
              >
                <Mic className="size-3.5 text-violet-400" />
                <span>{locale === "th" ? "ส่งไปพากย์เสียงโฆษณา" : "Chain to Voiceover"}</span>
              </button>

              {turn.layers && turn.layers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setExpandedLayerTurnId(showLayers ? null : turn.id)}
                  className="neu-flat flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-violet-400"
                >
                  <Layers className="size-3.5" />
                  <span>{turn.layers.length} Transparent Layers</span>
                </button>
              )}
            </div>

            {showLayers && turn.layers && (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {turn.layers.map((layer) => (
                  <div key={layer.index} className="neu-pressed flex flex-col gap-1.5 rounded-2xl p-2">
                    <img src={layer.previewUrl} alt={layer.label} className="h-24 w-full rounded-xl object-cover" />
                    <span className="truncate text-[11px] font-bold">#{layer.index} {layer.label}</span>
                    <button
                      type="button"
                      onClick={() =>
                        onChainStage({
                          sourceTurnId: turn.id,
                          sourceModelTitle: turn.modelTitle,
                          mediaUrl: layer.previewUrl,
                          targetStage: "video",
                          layerLabel: layer.label,
                        })
                      }
                      className="neu-flat rounded-lg py-1 text-[10px] font-extrabold text-violet-300"
                    >
                      Animate Layer → I2V
                    </button>
                  </div>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
