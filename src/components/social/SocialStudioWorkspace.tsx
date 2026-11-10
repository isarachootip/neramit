"use client";

import React from "react";
import { Share2 } from "lucide-react";
import { useSocialStudio } from "@/hooks/use-social-studio";
import { AutoPostGalleryView } from "./AutoPostGalleryView";
import { BrandProfileBar } from "./BrandProfileBar";
import { PlatformVariantsEditor } from "./PlatformVariantsEditor";
import { SocialContentComposer } from "./SocialContentComposer";

export interface SocialStudioWorkspaceProps {
  initialMedia?: { url: string; kind: "image" | "video"; prompt?: string };
}

export function SocialStudioWorkspace({ initialMedia }: SocialStudioWorkspaceProps) {
  const s = useSocialStudio(initialMedia);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6">
      <div className="flex items-center gap-2.5">
        <span className="neu-tint-primary grid size-10 place-items-center rounded-2xl">
          <Share2 className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-extrabold">Neramit Social Content & Multi-Channel Auto-Post</h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            {s.locale === "th"
              ? "วิเคราะห์รูปภาพ + คำนำ เขียนแคปชันแยกตามแพลตฟอร์ม และยิง Auto-Post / ตั้งเวลาไปยัง X, Facebook, Instagram, YouTube, TikTok"
              : "Generate platform-native social copy from images & topics and auto-publish to X, FB, IG, YouTube, and TikTok"}
          </p>
        </div>
      </div>

      <BrandProfileBar
        brands={s.brands}
        activeBrand={s.activeBrand}
        onSelectBrand={s.setActiveBrandId}
        onBrandsUpdated={(next, newId) => {
          s.setBrands(next);
          if (newId) s.setActiveBrandId(newId);
        }}
        locale={s.locale}
      />

      <SocialContentComposer
        topicIntro={s.topicIntro}
        onChangeTopic={s.setTopicIntro}
        mediaKind={s.mediaKind}
        mediaUrl={s.mediaUrl}
        onChangeMedia={(kind, url) => {
          s.setMediaKind(kind);
          s.setMediaUrl(url);
        }}
        requiresVideoChannels={s.compatibility.requiresVideoConversion}
        onGenerateCopy={s.handleGenerateCopy}
        isGeneratingCopy={s.isGeneratingCopy}
        onAutoConvertVideo={s.handleAutoConvertVideo}
        isConvertingVideo={s.isConvertingVideo}
        locale={s.locale}
      />

      <PlatformVariantsEditor
        selectedChannels={s.selectedChannels}
        onToggleChannel={s.toggleChannel}
        variants={s.variants}
        onChangeVariants={s.setVariants}
        scheduledAtLocal={s.scheduledAtLocal}
        onChangeSchedule={s.setScheduledAtLocal}
        onPublish={s.handlePublish}
        isPublishing={s.isPublishing}
        feedback={s.feedback}
        locale={s.locale}
      />

      <AutoPostGalleryView
        posts={s.posts}
        onPostsUpdated={s.setPosts}
        onRetryPost={s.handleRetryChannel}
        retryingPostId={s.retryingPostId}
        locale={s.locale}
      />
    </div>
  );
}
