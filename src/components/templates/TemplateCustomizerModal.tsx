"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Sparkles, X } from "lucide-react";
import {
  GenWhyTemplate,
  StudioGenerationTurn,
  StudioLocale,
} from "@/domain/studio-types";
import {
  loadGenerationTurns,
  saveGenerationTurns,
} from "@/repositories/studio-storage";

interface TemplateCustomizerModalProps {
  template: GenWhyTemplate | null;
  onClose: () => void;
  spendTokens: (amount: number) => boolean;
  locale: StudioLocale;
}

const DEFAULT_SLOT_SAMPLE =
  "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop";

export function TemplateCustomizerModal({
  template,
  onClose,
  spendTokens,
  locale,
}: TemplateCustomizerModalProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [aspectRatio, setAspectRatio] = useState<string>("9:16");
  const [brief, setBrief] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);

  if (!template) return null;

  const handleRunTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRunning) return;
    if (!spendTokens(template.priceTokens)) return;

    setIsRunning(true);
    await new Promise((r) => setTimeout(r, 650));

    const summaryParts = Object.entries(answers).map(([k, v]) => `${k}: ${v}`);
    const turn: StudioGenerationTurn = {
      id: `tpl-${Date.now()}`,
      createdAt: new Date().toISOString(),
      output: "video",
      modelSlug: "seedance-2-5",
      modelTitle: `Template · ${template.name}`,
      vendor: "bytedance",
      mode: "i2v",
      prompt: `[${template.name}] ${summaryParts.join(" · ")} ${brief}`.trim(),
      aspectRatio,
      resolution: "1080p",
      durationSeconds: 7,
      numImages: 1,
      tokensCharged: template.priceTokens,
      status: "succeeded",
      referenceImages: [DEFAULT_SLOT_SAMPLE],
      resultUrls: [template.coverVideoUrl],
    };

    const existing = loadGenerationTurns();
    saveGenerationTurns([turn, ...existing]);
    setIsRunning(false);
    onClose();
    router.push("/history");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="neu-lifted flex max-h-[90vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto rounded-3xl p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="neu-tint-primary rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
              {template.modelAlias}
            </span>
            <h2 className="mt-1 text-lg sm:text-xl font-extrabold">{template.name}</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {template.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="neu-raised grid size-8 place-items-center rounded-xl"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="neu-pressed overflow-hidden rounded-2xl bg-black/50">
          <video
            src={template.coverVideoUrl}
            poster={template.thumbnailUrl}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="max-h-60 w-full object-contain"
          />
        </div>

        <form onSubmit={handleRunTemplate} className="flex flex-col gap-3.5">
          {template.questions.map((q) => {
            const currentVal = answers[q.key] ?? q.choices[0] ?? "";
            return (
              <div key={q.key} className="flex flex-col gap-1.5">
                <label className="text-xs font-bold">{q.label}</label>
                <div className="flex flex-wrap gap-1.5">
                  {q.choices.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [q.key]: choice }))
                      }
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold text-left ${
                        currentVal === choice ? "neu-tint-primary" : "neu-pressed"
                      }`}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {template.briefEnabled && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold">
                {locale === "th" ? "รายละเอียดเพิ่มเติม (Brief)" : "Creative Brief"}
              </label>
              <input
                type="text"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="ระบุจุดเด่นสินค้าหรือมู้ดโทนที่ต้องการ..."
                className="neu-pressed rounded-xl px-3 py-2 text-xs"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5">
              {template.aspectRatios.slice(0, 4).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={`rounded-xl px-2.5 py-1 text-xs font-bold ${
                    aspectRatio === ratio ? "neu-tint-primary" : "neu-pressed"
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={isRunning}
              className="neu-tint-primary flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-extrabold"
            >
              <Sparkles className="size-4" />
              <span>
                {isRunning
                  ? "Generating..."
                  : locale === "th"
                  ? `สร้างวิดีโอด้วยเทมเพลตนี้ (${template.priceTokens} Tokens)`
                  : `Generate Video (${template.priceTokens} Tokens)`}
              </span>
              <Coins className="size-3.5 text-amber-300" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
