"use client";

import React, { useEffect, useState } from "react";
import { Coins, Mic, Sparkles, Subtitles, Volume2 } from "lucide-react";
import { insertReferenceTag } from "@/domain/rich-prompt-engine";
import { AudioStudioTurn } from "@/domain/studio-types";
import { estimateAudioScriptTokens } from "@/domain/token-pricing";
import { useAppPreferences } from "@/hooks/use-app-preferences";
import { loadAudioTurns, saveAudioTurns } from "@/repositories/studio-storage";

const VOICES = [
  { id: "th-female-nicha", name: "ณิชา (Nicha · Thai Commercial)" },
  { id: "th-male-kavin", name: "กวิน (Kavin · Warm Narrator)" },
  { id: "en-female-aria", name: "Aria (English Studio HD)" },
  { id: "en-male-marcus", name: "Marcus (Cinematic Trailer)" },
];

export function AudioStudioView() {
  const { locale, spendTokens, topUpTokens, apiVault } = useAppPreferences();
  const [mode, setMode] = useState<"describe" | "voice" | "clone" | "image">("voice");
  const [voiceId, setVoiceId] = useState<string>(VOICES[0].id);
  const [format, setFormat] = useState<"mp3" | "wav" | "ogg_opus">("mp3");
  const [speechRate, setSpeechRate] = useState<number>(0);
  const [pitchRate, setPitchRate] = useState<number>(0);
  const [script, setScript] = useState<string>("");
  const [turns, setTurns] = useState<AudioStudioTurn[]>([]);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setTurns(loadAudioTurns());
  }, []);

  const estimate = estimateAudioScriptTokens(script);
  const selectedVoice = VOICES.find((v) => v.id === voiceId) ?? VOICES[0];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!script.trim() || isBusy || !spendTokens(estimate.tokens)) return;

    setIsBusy(true);
    try {
      const res = await fetch("/api/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          prompt: script,
          voiceId: selectedVoice.id,
          voiceName: selectedVoice.name,
          format,
          speechRate,
          pitchRate,
          subtitles: true,
          vault: apiVault,
        }),
      });
      const data = (await res.json()) as { turn?: AudioStudioTurn; error?: string };
      if (!res.ok || !data.turn) {
        topUpTokens(estimate.tokens);
        setErrorMsg(data.error ?? "TTS synthesis error — Tokens Auto-Refunded");
        return;
      }

      const next = [data.turn, ...turns];
      setTurns(next);
      saveAudioTurns(next);
      setScript("");
    } catch {
      topUpTokens(estimate.tokens);
      setErrorMsg("Network error — Tokens Auto-Refunded");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6">
      <div className="flex items-center gap-2.5">
        <span className="neu-tint-primary grid size-10 place-items-center rounded-2xl">
          <Mic className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-extrabold">Seed Audio 1.0 & Neural TTS Studio</h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            {locale === "th"
              ? "สร้างเสียงพากย์โฆษณาด้วย Gemini / OpenAI Neural TTS โคลนโทนเสียง @Audio1 และซิงค์ซับไตเติล SRT"
              : "Synthesize studio voiceovers via Gemini / OpenAI Neural TTS, @Audio1 tags, and SRT subtitles"}
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="neu-raised neu-grain flex flex-col gap-4 rounded-3xl p-5">
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl p-1.5 sm:grid-cols-4 neu-pressed">
          {(["voice", "describe", "clone", "image"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-xl py-2 text-xs font-bold capitalize ${
                mode === m ? "neu-tint-primary" : "text-[var(--muted-foreground)]"
              }`}
            >
              {m === "voice" ? "Voice Library" : m === "describe" ? "Describe Voice" : m === "clone" ? "Clone (@Audio1)" : "Mood From Image"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--muted-foreground)]">Voice Actor</label>
            <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)} className="neu-pressed rounded-xl px-3 py-2 text-xs font-semibold bg-[var(--surface)]">
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--muted-foreground)]">Speech Rate ({speechRate}%)</label>
            <input type="range" min={-50} max={100} value={speechRate} onChange={(e) => setSpeechRate(Number(e.target.value))} className="accent-violet-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--muted-foreground)]">Pitch ({pitchRate}) · {format.toUpperCase()}</label>
            <div className="flex items-center gap-2">
              <input type="range" min={-12} max={12} value={pitchRate} onChange={(e) => setPitchRate(Number(e.target.value))} className="w-full accent-violet-500" />
              <button type="button" onClick={() => setFormat(format === "mp3" ? "wav" : format === "wav" ? "ogg_opus" : "mp3")} className="neu-pressed rounded-lg px-2 py-1 text-[10px] font-bold uppercase">
                {format}
              </button>
            </div>
          </div>
        </div>

        {mode === "clone" && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl p-2.5 neu-pressed">
            <span className="text-xs font-semibold text-[var(--muted-foreground)]">Insert Reference Voice Tag:</span>
            {["@Audio1", "@Audio2", "@Audio3"].map((tag) => (
              <button key={tag} type="button" onClick={() => setScript((s) => insertReferenceTag(s, tag))} className="neu-tint-primary rounded-lg px-2.5 py-1 text-xs font-bold">
                +{tag}
              </button>
            ))}
          </div>
        )}

        <textarea
          rows={3}
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder={locale === "th" ? "พิมพ์บทพูดโฆษณา หรือใส่ป้าย @Audio1 เพื่อให้พูดตามโทนเสียงต้นแบบ..." : "Type your voiceover script or insert @Audio1 tags..."}
          className="neu-pressed w-full rounded-2xl p-3.5 text-sm focus:outline-2 focus:outline-violet-500"
        />

        {errorMsg && <p className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-400">{errorMsg}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-[var(--muted-foreground)] tabular-nums">~{estimate.seconds}s · Est. {estimate.tokens} Tokens</span>
          <button type="submit" disabled={!script.trim() || isBusy} className="neu-tint-primary flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-extrabold disabled:opacity-40">
            <Sparkles className="size-4" />
            <span>{isBusy ? "Synthesizing..." : "Generate Speech"}</span>
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-3">
        {turns.map((turn) => (
          <article key={turn.id} className="neu-raised flex flex-col gap-3 rounded-3xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Volume2 className="size-4 text-violet-400" />
                <span className="text-xs font-bold">{turn.voiceName}</span>
                <span className="neu-pressed rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">{turn.format} · {turn.seconds}s</span>
              </div>
              <span className="neu-pressed flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold">
                <Coins className="size-3 text-amber-400" />
                <span>{turn.tokensCharged}</span>
              </span>
            </div>
            <p className="text-sm">{turn.prompt}</p>
            <audio src={turn.audioUrl} controls className="h-9 w-full" />
            {turn.subtitles.length > 0 && (
              <div className="neu-pressed flex flex-col gap-1.5 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-violet-400">
                  <Subtitles className="size-3.5" />
                  <span>Synchronized Subtitles (SRT)</span>
                </div>
                {turn.subtitles.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-[10px] text-[var(--muted-foreground)]">00:0{Math.floor(s.startMs / 1000)}.0</span>
                    <span>{s.text}</span>
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
