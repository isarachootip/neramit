"use client";

import React, { useRef } from "react";
import { Brush, ImagePlus, Plus, Sparkles, Trash2 } from "lucide-react";
import { StudioLocale } from "@/domain/studio-types";

interface ReferenceMediaSlotsProps {
  referenceImages: string[];
  maxReferences: number;
  supportsMask?: boolean;
  maskDataUrl?: string;
  onAddReference: (url: string) => void;
  onRemoveReference: (index: number) => void;
  onInsertTag: (tag: string) => void;
  onToggleMask: (maskUrl: string | undefined) => void;
  locale: StudioLocale;
}

const SAMPLE_REFERENCE_PRESETS = [
  {
    label: "Perfume Hero",
    url: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&auto=format&fit=crop",
  },
  {
    label: "Sneaker Packshot",
    url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop",
  },
  {
    label: "Fashion Model",
    url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop",
  },
];

export function ReferenceMediaSlots({
  referenceImages,
  maxReferences,
  supportsMask,
  maskDataUrl,
  onAddReference,
  onRemoveReference,
  onInsertTag,
  onToggleMask,
  locale,
}: ReferenceMediaSlotsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onAddReference(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="neu-flat flex flex-col gap-3 rounded-3xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ImagePlus className="size-4 text-violet-400" />
          <span className="text-xs font-bold">
            {locale === "th"
              ? `ภาพอ้างอิง & เฟรมต้นแบบ (${referenceImages.length}/${maxReferences})`
              : `Reference Images & Keyframes (${referenceImages.length}/${maxReferences})`}
          </span>
          <span className="hidden sm:inline text-[11px] text-[var(--muted-foreground)]">
            — {locale === "th" ? "คลิกป้าย @img-N เพื่อแทรกลงใน Prompt" : "Click @img-N pill to insert into prompt"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {SAMPLE_REFERENCE_PRESETS.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => onAddReference(sample.url)}
              disabled={referenceImages.length >= maxReferences}
              className="neu-raised flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-transform active:scale-95 disabled:opacity-40"
            >
              <Sparkles className="size-3 text-violet-400" />
              <span>+{sample.label}</span>
            </button>
          ))}

          {supportsMask && referenceImages.length > 0 && (
            <button
              type="button"
              onClick={() =>
                onToggleMask(maskDataUrl ? undefined : "mask://center-region-active")
              }
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all ${
                maskDataUrl ? "neu-tint-primary" : "neu-pressed"
              }`}
            >
              <Brush className="size-3" />
              <span>{maskDataUrl ? "Mask Active" : "Paint Mask"}</span>
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
      />

      <div className="flex flex-wrap items-center gap-2.5">
        {referenceImages.map((imgUrl, idx) => {
          const tag = `@img-${idx + 1}`;
          return (
            <div
              key={`${imgUrl}-${idx}`}
              className="neu-pressed group relative flex items-center gap-2 rounded-2xl p-1.5 pr-2.5"
            >
              <img
                src={imgUrl}
                alt={tag}
                className="size-12 rounded-xl object-cover"
              />
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => onInsertTag(tag)}
                  className="neu-tint-primary rounded-lg px-2 py-0.5 text-[11px] font-extrabold tracking-wide transition-transform active:scale-95"
                >
                  {tag}
                </button>
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  {idx === 0 ? "First Frame / Ref 1" : idx === 1 ? "Last Frame / Ref 2" : `Ref ${idx + 1}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveReference(idx)}
                className="ml-1 rounded-lg p-1 text-[var(--muted-foreground)] hover:text-red-400"
                aria-label={`Remove ${tag}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          );
        })}

        {referenceImages.length < maxReferences && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="neu-pressed flex h-16 items-center gap-2 rounded-2xl border border-dashed border-[var(--border-control)] px-4 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            <Plus className="size-4" />
            <span>{locale === "th" ? "อัปโหลดรูปอ้างอิง" : "Upload Reference"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
