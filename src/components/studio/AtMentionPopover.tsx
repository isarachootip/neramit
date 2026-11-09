"use client";

import React, { useState } from "react";
import { AtSign, Film, Image as ImageIcon, Mic, X } from "lucide-react";
import { AtMentionOption } from "@/domain/neramit-vault-types";
import { StudioLocale } from "@/domain/studio-types";

interface AtMentionPopoverProps {
  query: string | null;
  referenceImages: string[];
  activeTags: string[];
  onSelectMention: (tag: string) => void;
  onRemoveTagFromPrompt: (tag: string) => void;
  locale: StudioLocale;
}

export function AtMentionPopover({
  query,
  referenceImages,
  activeTags,
  onSelectMention,
  onRemoveTagFromPrompt,
  locale,
}: AtMentionPopoverProps) {
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  const options: AtMentionOption[] = [
    ...Array.from({ length: Math.max(referenceImages.length, 2) }).map((_, idx) => ({
      tag: `@img-${idx + 1}`,
      kind: "image" as const,
      label:
        idx < referenceImages.length
          ? `Uploaded Keyframe #${idx + 1}`
          : `Image Slot #${idx + 1}`,
      previewUrl:
        referenceImages[idx] ??
        "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&auto=format&fit=crop",
    })),
    {
      tag: "@video-1",
      kind: "video",
      label: "Motion / Reference Clip #1",
    },
    {
      tag: "@Audio1",
      kind: "audio",
      label: "Voice Clone / Audio Track #1",
    },
  ];

  const filtered =
    query === null
      ? []
      : options.filter((o) =>
          o.tag.toLowerCase().includes(query.toLowerCase()) ||
          o.label.toLowerCase().includes(query.toLowerCase())
        );

  return (
    <div className="relative flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl px-3 py-2 neu-pressed">
        <span className="flex items-center gap-1 text-[11px] font-bold text-violet-400">
          <AtSign className="size-3.5" />
          <span>{locale === "th" ? "ชิปตัวแปร (@Mentions):" : "@Mention Chips:"}</span>
        </span>

        {options.map((opt) => {
          const isUsed = activeTags.includes(opt.tag);
          return (
            <div
              key={opt.tag}
              className="relative"
              onMouseEnter={() => setHoveredTag(opt.tag)}
              onMouseLeave={() => setHoveredTag(null)}
            >
              <div
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-extrabold transition-all ${
                  isUsed
                    ? "neu-tint-primary"
                    : "neu-flat text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectMention(opt.tag)}
                  className="flex items-center gap-1"
                >
                  {opt.kind === "image" ? (
                    <ImageIcon className="size-3" />
                  ) : opt.kind === "video" ? (
                    <Film className="size-3" />
                  ) : (
                    <Mic className="size-3" />
                  )}
                  <span>{opt.tag}</span>
                </button>
                {isUsed && (
                  <button
                    type="button"
                    onClick={() => onRemoveTagFromPrompt(opt.tag)}
                    aria-label={`Remove ${opt.tag}`}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-black/25"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              {hoveredTag === opt.tag && opt.previewUrl && (
                <div className="neramit-glass absolute bottom-full left-0 z-30 mb-2 flex w-44 flex-col gap-1.5 rounded-2xl p-2 shadow-2xl">
                  <img
                    src={opt.previewUrl}
                    alt={opt.tag}
                    className="h-24 w-full rounded-xl object-cover"
                  />
                  <span className="truncate text-[10px] font-bold">{opt.label}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {query !== null && filtered.length > 0 && (
        <div className="neramit-glass absolute top-full left-0 z-40 mt-1 flex w-72 flex-col gap-1 rounded-2xl p-2 shadow-2xl">
          <span className="px-2 py-1 text-[10px] font-bold uppercase text-[var(--muted-foreground)]">
            {locale === "th" ? "เลือกตัวแปรอ้างอิง (@Autocomplete)" : "Select @ Reference"}
          </span>
          {filtered.map((item) => (
            <button
              key={item.tag}
              type="button"
              onClick={() => onSelectMention(item.tag)}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-semibold hover:bg-violet-500/20"
            >
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={item.tag}
                  className="size-8 rounded-lg object-cover"
                />
              ) : (
                <span className="neu-pressed grid size-8 place-items-center rounded-lg">
                  <AtSign className="size-3.5 text-violet-400" />
                </span>
              )}
              <div className="flex flex-col">
                <span className="font-extrabold text-violet-300">{item.tag}</span>
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  {item.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
