"use client";

import React, { useEffect, useState } from "react";
import { Coins, History, Layers, Mic, Search, Trash2 } from "lucide-react";
import { AudioStudioTurn, StudioGenerationTurn } from "@/domain/studio-types";
import { useAppPreferences } from "@/hooks/use-app-preferences";
import {
  loadAudioTurns,
  loadGenerationTurns,
  saveGenerationTurns,
} from "@/repositories/studio-storage";

export default function HistoryPage() {
  const { locale } = useAppPreferences();
  const [filter, setFilter] = useState<"all" | "image" | "video" | "audio">("all");
  const [query, setQuery] = useState<string>("");
  const [turns, setTurns] = useState<StudioGenerationTurn[]>([]);
  const [audioTurns, setAudioTurns] = useState<AudioStudioTurn[]>([]);

  useEffect(() => {
    setTurns(loadGenerationTurns());
    setAudioTurns(loadAudioTurns());
  }, []);

  const filteredTurns = turns.filter((item) => {
    if (filter === "image" && item.output !== "image") return false;
    if (filter === "video" && item.output !== "video") return false;
    if (filter === "audio") return false;
    if (
      query.trim() &&
      !item.prompt.toLowerCase().includes(query.toLowerCase()) &&
      !item.modelTitle.toLowerCase().includes(query.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleDeleteTurn = (id: string) => {
    const next = turns.filter((t) => t.id !== id);
    setTurns(next);
    saveGenerationTurns(next);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <History className="size-5 text-violet-400" />
          <h1 className="text-2xl font-extrabold">
            {locale === "th" ? "คลังผลงานทั้งหมด (Creation History)" : "Creation History"}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="neu-pressed flex items-center gap-2 rounded-2xl px-3 py-1.5">
            <Search className="size-3.5 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={locale === "th" ? "ค้นหา Prompt หรือโมเดล..." : "Search prompts..."}
              className="bg-transparent text-xs focus:outline-none"
            />
          </div>

          <div className="neu-pressed flex items-center gap-1 rounded-2xl p-1">
            {(["all", "image", "video", "audio"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`rounded-xl px-3 py-1 text-xs font-bold capitalize ${
                  filter === tab ? "neu-tint-primary" : "text-[var(--muted-foreground)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filter !== "audio" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredTurns.map((turn) => (
            <article
              key={turn.id}
              className="neu-raised flex flex-col justify-between gap-3 rounded-3xl p-4"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="neu-tint-primary rounded-full px-3 py-0.5 text-xs font-bold">
                    {turn.modelTitle}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="neu-pressed flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold">
                      <Coins className="size-3 text-amber-400" />
                      <span>{turn.tokensCharged}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTurn(turn.id)}
                      className="text-[var(--muted-foreground)] hover:text-red-400"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="neu-pressed h-56 overflow-hidden rounded-2xl bg-black/40">
                  {turn.output === "video" ? (
                    <video
                      src={turn.resultUrls[0]}
                      controls
                      loop
                      playsInline
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <img
                      src={turn.resultUrls[0]}
                      alt={turn.prompt}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <p className="text-xs leading-relaxed">{turn.prompt}</p>
              </div>

              {turn.layers && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-violet-400">
                  <Layers className="size-3.5" />
                  <span>Includes {turn.layers.length} Transparent Layers</span>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {(filter === "all" || filter === "audio") && audioTurns.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase text-[var(--muted-foreground)]">
            <Mic className="size-4 text-violet-400" />
            <span>Seed Audio 1.0 Clips</span>
          </h2>
          {audioTurns.map((aud) => (
            <div
              key={aud.id}
              className="neu-raised flex flex-col gap-2 rounded-3xl p-4"
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span>{aud.voiceName}</span>
                <span>{aud.tokensCharged} Tokens</span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">{aud.prompt}</p>
              <audio src={aud.audioUrl} controls className="h-9 w-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
