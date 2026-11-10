"use client";

import React, { useRef } from "react";
import { Coins, Film, ImagePlus, Sparkles, Trash2, Video } from "lucide-react";
import { SocialChannelId, SocialMediaKind } from "@/domain/social-types";
import { StudioLocale } from "@/domain/studio-types";

interface SocialContentComposerProps {
  topicIntro: string;
  onChangeTopic: (val: string) => void;
  mediaKind: SocialMediaKind;
  mediaUrl: string;
  onChangeMedia: (kind: SocialMediaKind, url: string) => void;
  requiresVideoChannels: SocialChannelId[];
  onGenerateCopy: () => void;
  isGeneratingCopy: boolean;
  onAutoConvertVideo: () => void;
  isConvertingVideo: boolean;
  locale: StudioLocale;
}

const SAMPLE_PRODUCT_IMG =
  "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1000&auto=format&fit=crop";

export function SocialContentComposer({
  topicIntro,
  onChangeTopic,
  mediaKind,
  mediaUrl,
  onChangeMedia,
  requiresVideoChannels,
  onGenerateCopy,
  isGeneratingCopy,
  onAutoConvertVideo,
  isConvertingVideo,
  locale,
}: SocialContentComposerProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVid = file.type.startsWith("video/");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChangeMedia(isVid ? "video" : "image", reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="neu-raised neu-grain flex flex-col gap-4 rounded-3xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold">
            {locale === "th"
              ? "1. สร้างคอนเทนต์จากรูปภาพ (AI Vision) หรือคำนำ (Topic / Hook)"
              : "1. Multimodal Content Generator (Image Vision + Topic Intro)"}
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            {locale === "th"
              ? "อัปโหลดรูปสินค้าหรือส่งต่อจากสตูดิโอ แล้วให้ AI วิเคราะห์ภาพพร้อมเขียนแคปชันแยกตามจริตทั้ง 5 แพลตฟอร์ม"
              : "Attach an image/video or type an intro topic to generate 5 platform-native captions"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm" onChange={handleUploadFile} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()} className="neu-flat flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold">
            <ImagePlus className="size-3.5 text-violet-400" />
            <span>{locale === "th" ? "อัปโหลดรูป / วิดีโอ" : "Upload Media"}</span>
          </button>
          {!mediaUrl && (
            <button type="button" onClick={() => onChangeMedia("image", SAMPLE_PRODUCT_IMG)} className="neu-pressed rounded-xl px-3 py-2 text-xs font-semibold text-violet-300">
              {locale === "th" ? "+ รูปตัวอย่าง" : "+ Sample Image"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {mediaUrl && (
          <div className="neu-pressed relative overflow-hidden rounded-2xl bg-black/40 md:col-span-4">
            {mediaKind === "video" ? (
              <video src={mediaUrl} controls loop muted playsInline className="h-44 w-full object-cover" />
            ) : (
              <img src={mediaUrl} alt="Social asset" className="h-44 w-full object-cover" />
            )}
            <span className="neu-tint-primary absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
              {mediaKind === "video" ? <Video className="size-3" /> : <ImagePlus className="size-3" />}
              <span>{mediaKind}</span>
            </span>
            <button
              type="button"
              onClick={() => onChangeMedia("none", "")}
              className="neu-raised absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-lg text-red-400"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}

        <div className={`flex flex-col justify-between gap-3 ${mediaUrl ? "md:col-span-8" : "md:col-span-12"}`}>
          <textarea
            rows={3}
            value={topicIntro}
            onChange={(e) => onChangeTopic(e.target.value)}
            placeholder={
              locale === "th"
                ? "พิมพ์คำนำ / จุดเด่นสินค้า / โปรโมชัน เช่น 'เปิดตัวน้ำหอมคริสตัลกลิ่นใหม่ หอมติดทน 12 ชม. ลด 20% วันนี้วันเดียว'..."
                : "Enter your topic intro, product USP, or campaign hook..."
            }
            className="neu-pressed w-full rounded-2xl p-3.5 text-sm focus:outline-2 focus:outline-violet-500"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            {requiresVideoChannels.length > 0 ? (
              <button
                type="button"
                onClick={onAutoConvertVideo}
                disabled={isConvertingVideo}
                className="flex items-center gap-2 rounded-2xl bg-amber-500/20 border border-amber-400/40 px-3.5 py-2 text-xs font-extrabold text-amber-300 transition-transform active:scale-95"
              >
                <Film className="size-4" />
                <span>
                  {isConvertingVideo
                    ? "Converting to 9:16 Video..."
                    : locale === "th"
                    ? `แปลงรูป/คำนำเป็นคลิปสั้น 9:16 สำหรับ ${requiresVideoChannels.join(", ").toUpperCase()} (90 Tokens)`
                    : `Auto-Convert to 9:16 Video for ${requiresVideoChannels.join(", ").toUpperCase()} (90 Tokens)`}
                </span>
              </button>
            ) : (
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {locale === "th" ? "AI จะปรับความยาวแคปชันและ Hashtags ตามแต่ละช่องทางให้อัตโนมัติ" : "AI automatically tailors length, hooks, and hashtags per channel"}
              </span>
            )}

            <button
              type="button"
              onClick={onGenerateCopy}
              disabled={isGeneratingCopy}
              className="neu-tint-primary flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold disabled:opacity-40"
            >
              <Sparkles className="size-4" />
              <span>
                {isGeneratingCopy
                  ? "Analyzing & Writing..."
                  : locale === "th"
                  ? "AI วิเคราะห์รูป & เขียนแคปชัน 5 ช่องทาง"
                  : "Generate 5-Channel Copy"}
              </span>
              <span className="flex items-center gap-0.5 rounded-full bg-black/25 px-2 py-0.5 text-[10px]">
                <Coins className="size-3 text-amber-300" />
                <span>18</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
