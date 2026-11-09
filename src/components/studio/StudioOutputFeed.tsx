"use client";

import React, { useState } from "react";
import { Coins, Download, Layers, RotateCcw, Sparkles } from "lucide-react";
import { StudioGenerationTurn, StudioLocale } from "@/domain/studio-types";

interface StudioOutputFeedProps {
  turns: StudioGenerationTurn[];
  isGenerating: boolean;
  onReuseTurn: (turn: StudioGenerationTurn) => void;
  locale: StudioLocale;
}

export function StudioOutputFeed({
  turns,
  isGenerating,
  onReuseTurn,
  locale,
}: StudioOutputFeedProps) {
  const [expandedLayerTurnId, setExpandedLayerTurnId] = useState<string | null>(
    "seed-turn-1"
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
          {locale === "th" ? "ไทม์ไลน์ผลลัพธ์ (Studio Feed)" : "Studio Output Feed"}
        </h2>
        <span className="text-xs text-[var(--muted-foreground)]">
          {turns.length} {locale === "th" ? "รายการ" : "turns"}
        </span>
      </div>

      {isGenerating && (
        <div className="neu-raised neu-shimmer flex h-56 flex-col items-center justify-center gap-2 rounded-3xl p-6 text-center">
          <Sparkles className="size-7 animate-spin text-violet-400" />
          <p className="text-sm font-bold">
            {locale === "th"
              ? "กำลังประมวลผลด้วย AI Cluster..."
              : "Rendering on GenWhy GPU Cluster..."}
          </p>
        </div>
      )}

      {turns.map((turn) => {
        const showLayers = expandedLayerTurnId === turn.id;
        return (
          <article
            key={turn.id}
            className="neu-raised neu-grain flex flex-col gap-4 rounded-3xl p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="neu-tint-primary rounded-full px-3 py-1 text-xs font-bold">
                  {turn.modelTitle}
                </span>
                {turn.mode && (
                  <span className="neu-pressed rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase">
                    {turn.mode}
                  </span>
                )}
                <span className="neu-pressed rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                  {turn.resolution} · {turn.aspectRatio}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="neu-pressed flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold">
                  <Coins className="size-3 text-amber-400" />
                  <span>{turn.tokensCharged}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onReuseTurn(turn)}
                  className="neu-flat flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition-transform active:scale-95"
                >
                  <RotateCcw className="size-3.5" />
                  <span>{locale === "th" ? "ใช้ซ้ำ" : "Reuse"}</span>
                </button>
              </div>
            </div>

            <p className="neu-pressed rounded-2xl p-3 text-xs sm:text-sm leading-relaxed">
              {turn.prompt}
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {turn.resultUrls.map((url, idx) =>
                turn.output === "video" ? (
                  <div
                    key={`${turn.id}-vid-${idx}`}
                    className="neu-pressed relative overflow-hidden rounded-2xl bg-black/40"
                  >
                    <video
                      src={url}
                      controls
                      loop
                      playsInline
                      className="max-h-[420px] w-full object-contain"
                    />
                  </div>
                ) : (
                  <div
                    key={`${turn.id}-img-${idx}`}
                    className="neu-pressed group relative overflow-hidden rounded-2xl"
                  >
                    <img
                      src={url}
                      alt={turn.prompt}
                      className="max-h-[420px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="neu-raised absolute bottom-3 right-3 flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold opacity-90"
                    >
                      <Download className="size-3.5" />
                      <span>HD</span>
                    </a>
                  </div>
                )
              )}
            </div>

            {turn.layers && turn.layers.length > 0 && (
              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedLayerTurnId(showLayers ? null : turn.id)
                  }
                  className="neu-flat flex w-fit items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-violet-400"
                >
                  <Layers className="size-3.5" />
                  <span>
                    {locale === "th"
                      ? `แยกเลเยอร์พื้นหลังใส (${turn.layers.length} ชั้น - Seedream 5 Pro)`
                      : `Inspect Decomposed Transparent Layers (${turn.layers.length})`}
                  </span>
                </button>

                {showLayers && (
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {turn.layers.map((layer) => (
                      <div
                        key={layer.index}
                        className="neu-pressed flex flex-col gap-1.5 rounded-2xl p-2"
                      >
                        <img
                          src={layer.previewUrl}
                          alt={layer.label}
                          className="h-24 w-full rounded-xl object-cover"
                        />
                        <span className="truncate text-[11px] font-bold">
                          #{layer.index} {layer.label}
                        </span>
                        <span className="text-[10px] text-[var(--muted-foreground)]">
                          Alpha PNG · Opacity {layer.opacity}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
