"use client";

import React, { useState } from "react";
import { CalendarClock, Check, Send } from "lucide-react";
import {
  PlatformCopyVariant,
  SOCIAL_CHANNELS,
  SocialChannelId,
  SocialCopyVariantsMap,
} from "@/domain/social-types";
import { StudioLocale } from "@/domain/studio-types";

interface PlatformVariantsEditorProps {
  selectedChannels: SocialChannelId[];
  onToggleChannel: (ch: SocialChannelId) => void;
  variants: SocialCopyVariantsMap;
  onChangeVariants: (next: SocialCopyVariantsMap) => void;
  scheduledAtLocal: string;
  onChangeSchedule: (val: string) => void;
  onPublish: () => void;
  isPublishing: boolean;
  feedback: { type: "ok" | "err"; text: string } | null;
  locale: StudioLocale;
}

export function PlatformVariantsEditor({
  selectedChannels,
  onToggleChannel,
  variants,
  onChangeVariants,
  scheduledAtLocal,
  onChangeSchedule,
  onPublish,
  isPublishing,
  feedback,
  locale,
}: PlatformVariantsEditorProps) {
  const [activeTab, setActiveTab] = useState<SocialChannelId>("x");

  const activeMeta = SOCIAL_CHANNELS.find((c) => c.id === activeTab) ?? SOCIAL_CHANNELS[0];
  const currentVariant: PlatformCopyVariant = variants[activeTab];

  const updateCurrent = (patch: Partial<PlatformCopyVariant>) => {
    onChangeVariants({
      ...variants,
      [activeTab]: { ...currentVariant, ...patch },
    });
  };

  return (
    <section className="neu-raised flex flex-col gap-4 rounded-3xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm sm:text-base font-extrabold">
          {locale === "th"
            ? "2. เลือกช่องทางโซเชียล & ปรับแต่งแคปชันรายแพลตฟอร์ม"
            : "2. Target Channels & Platform-Native Copy Editor"}
        </h2>
        <span className="neu-pressed rounded-full px-3 py-1 text-[11px] font-bold text-emerald-400">
          {locale === "th" ? "กดโพสต์ & ตั้งเวลา ฟรี 0 Tokens" : "Auto-Post & Schedule: 0 Tokens"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {SOCIAL_CHANNELS.map((ch) => {
          const checked = selectedChannels.includes(ch.id);
          const isEditing = activeTab === ch.id;
          return (
            <div
              key={ch.id}
              className={`flex items-center gap-1.5 rounded-2xl p-1 pr-3 text-xs font-bold transition-all ${
                isEditing ? "neu-pressed border border-violet-500/60" : "neu-flat"
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleChannel(ch.id)}
                className={`grid size-6 place-items-center rounded-xl ${
                  checked ? "neu-tint-primary" : "neu-pressed text-transparent"
                }`}
              >
                <Check className="size-3.5" />
              </button>
              <button type="button" onClick={() => setActiveTab(ch.id)} className="flex items-center gap-1.5 py-1">
                <span className="size-2 rounded-full" style={{ backgroundColor: ch.accentHex }} />
                <span>{ch.label}</span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="neu-pressed flex flex-col gap-3 rounded-2xl p-3.5">
        <div className="flex items-center justify-between text-xs font-bold">
          <span style={{ color: activeMeta.accentHex }}>Editing · {activeMeta.label}</span>
          <span className="tabular-nums text-[11px] text-[var(--muted-foreground)]">
            {currentVariant.caption.length} / {activeMeta.maxChars} chars
          </span>
        </div>

        {activeTab === "youtube" && (
          <input
            value={currentVariant.title ?? ""}
            onChange={(e) => updateCurrent({ title: e.target.value })}
            placeholder="YouTube Video / Shorts SEO Title (max 100 chars)"
            className="neu-raised rounded-xl px-3 py-2 text-xs font-semibold"
          />
        )}

        <textarea
          rows={3}
          value={currentVariant.caption}
          onChange={(e) => updateCurrent({ caption: e.target.value })}
          placeholder={`Write or edit ${activeMeta.label} caption...`}
          className="neu-raised w-full rounded-xl p-3 text-xs sm:text-sm leading-relaxed"
        />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            value={currentVariant.hashtags.join(" ")}
            onChange={(e) =>
              updateCurrent({
                hashtags: e.target.value
                  .split(/[\s,]+/)
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="#Hashtags (space separated)"
            className="neu-raised rounded-xl px-3 py-2 text-xs"
          />
          {activeTab === "facebook" && (
            <input
              value={currentVariant.callToAction ?? ""}
              onChange={(e) => updateCurrent({ callToAction: e.target.value })}
              placeholder="Call to Action (e.g. สั่งซื้อทักแชตเลย!)"
              className="neu-raised rounded-xl px-3 py-2 text-xs"
            />
          )}
        </div>
      </div>

      {feedback && (
        <p
          className={`rounded-2xl px-3.5 py-2.5 text-xs font-bold ${
            feedback.type === "ok" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-400"
          }`}
        >
          {feedback.text}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <label className="neu-pressed flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-semibold">
          <CalendarClock className="size-4 text-violet-400" />
          <span>{locale === "th" ? "ตั้งเวลาโพสต์ (เว้นว่าง = โพสต์ทันที):" : "Schedule (optional):"}</span>
          <input
            type="datetime-local"
            value={scheduledAtLocal}
            onChange={(e) => onChangeSchedule(e.target.value)}
            className="bg-transparent text-xs font-bold focus:outline-none"
          />
          {scheduledAtLocal && (
            <button type="button" onClick={() => onChangeSchedule("")} className="text-[10px] text-amber-400 underline">
              Clear
            </button>
          )}
        </label>

        <button
          type="button"
          onClick={onPublish}
          disabled={isPublishing || selectedChannels.length === 0}
          className="neu-tint-primary flex items-center gap-2 rounded-full px-6 py-3 text-xs font-extrabold disabled:opacity-40"
        >
          <Send className="size-4" />
          <span>
            {isPublishing
              ? "Dispatching..."
              : scheduledAtLocal
              ? locale === "th"
                ? `ตั้งเวลาโพสต์ (${selectedChannels.length} ช่องทาง)`
                : `Schedule (${selectedChannels.length} Channels)`
              : locale === "th"
              ? `Auto-Post ทันที (${selectedChannels.length} ช่องทาง)`
              : `Auto-Post Now (${selectedChannels.length} Channels)`}
          </span>
        </button>
      </div>
    </section>
  );
}
