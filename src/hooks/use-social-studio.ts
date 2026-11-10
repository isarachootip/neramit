"use client";

import { useCallback, useEffect, useState } from "react";
import {
  checkChannelMediaCompatibility,
  createEmptyCopyVariants,
  PublicBrandProfile,
  SocialChannelId,
  SocialCopyVariantsMap,
  SocialMediaKind,
  SocialPostRecord,
} from "../domain/social-types";
import {
  fetchSocialDashboardData,
  requestMultimodalSocialCopy,
  requestShortVideoConversion,
  submitSocialPostRequest,
} from "../services/social-client-api";
import { useAppPreferences } from "./use-app-preferences";

export function useSocialStudio(initialMedia?: { url: string; kind: "image" | "video"; prompt?: string }) {
  const { locale, spendTokens, topUpTokens, apiVault } = useAppPreferences();
  const [brands, setBrands] = useState<PublicBrandProfile[]>([]);
  const [activeBrandId, setActiveBrandId] = useState<string>("brand-neramit");
  const [posts, setPosts] = useState<SocialPostRecord[]>([]);

  const [topicIntro, setTopicIntro] = useState<string>(initialMedia?.prompt ?? "");
  const [mediaKind, setMediaKind] = useState<SocialMediaKind>(initialMedia?.kind ?? "none");
  const [mediaUrl, setMediaUrl] = useState<string>(initialMedia?.url ?? "");
  const [selectedChannels, setSelectedChannels] = useState<SocialChannelId[]>([
    "x",
    "facebook",
    "instagram",
    "line",
    "threads",
  ]);
  const [variants, setVariants] = useState<SocialCopyVariantsMap>(() => createEmptyCopyVariants(""));
  const [scheduledAtLocal, setScheduledAtLocal] = useState<string>("");

  const [isGeneratingCopy, setIsGeneratingCopy] = useState<boolean>(false);
  const [isConvertingVideo, setIsConvertingVideo] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [retryingPostId, setRetryingPostId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const refreshData = useCallback(async () => {
    const data = await fetchSocialDashboardData();
    if (data.brands.length > 0) setBrands(data.brands);
    setPosts(data.posts);
  }, []);

  useEffect(() => {
    refreshData().catch(() => {});
  }, [refreshData]);

  useEffect(() => {
    if (initialMedia?.url) {
      setMediaUrl(initialMedia.url);
      setMediaKind(initialMedia.kind);
      if (initialMedia.prompt) setTopicIntro(initialMedia.prompt);
      if (initialMedia.kind === "video") {
        setSelectedChannels(["x", "facebook", "instagram", "youtube", "tiktok", "line", "threads"]);
      }
    }
  }, [initialMedia]);

  const activeBrand = brands.find((b) => b.id === activeBrandId) ?? brands[0];
  const compatibility = checkChannelMediaCompatibility(selectedChannels, mediaKind);

  const toggleChannel = (ch: SocialChannelId) => {
    setSelectedChannels((p) => (p.includes(ch) ? p.filter((c) => c !== ch) : [...p, ch]));
  };

  const handleGenerateCopy = async () => {
    setFeedback(null);
    if (!topicIntro.trim() && !mediaUrl) {
      setFeedback({ type: "err", text: locale === "th" ? "กรุณาใส่คำนำหรืออัปโหลดรูปก่อนสร้างแคปชัน" : "Add an image or intro topic first" });
      return;
    }
    if (!spendTokens(18)) return;
    setIsGeneratingCopy(true);
    try {
      const res = await requestMultimodalSocialCopy({
        topicIntro, mediaUrl: mediaUrl || undefined, mediaKind,
        brandName: activeBrand?.name ?? "Neramit", voiceTone: activeBrand?.voiceTone ?? "Modern Commercial",
        locale, vault: apiVault,
      });
      if (!res.ok || !res.variants) {
        topUpTokens(18);
        setFeedback({ type: "err", text: res.error ?? "Copywriting failed — 18 Tokens Refunded" });
        return;
      }
      setVariants(res.variants);
      setFeedback({ type: "ok", text: `${res.providerUsed ?? "AI"} · สร้างแคปชันครบทั้ง 9 แพลตฟอร์มแล้ว!` });
    } catch {
      topUpTokens(18);
      setFeedback({ type: "err", text: "Network error — 18 Tokens Refunded" });
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const handleAutoConvertVideo = async () => {
    setFeedback(null);
    if (!spendTokens(90)) return;
    setIsConvertingVideo(true);
    try {
      const res = await requestShortVideoConversion({ topicIntro, mediaUrl, vault: apiVault });
      if (!res.ok || !res.videoUrl) {
        topUpTokens(90);
        setFeedback({ type: "err", text: res.error ?? "Video conversion failed — 90 Tokens Refunded" });
        return;
      }
      setMediaUrl(res.videoUrl);
      setMediaKind("video");
      setFeedback({ type: "ok", text: locale === "th" ? "แปลงเป็นวิดีโอสั้น 9:16 พร้อมโพสต์ลง TikTok & YouTube แล้ว!" : "Converted to 9:16 Short Video!" });
    } catch {
      topUpTokens(90);
      setFeedback({ type: "err", text: "Video conversion error — 90 Tokens Refunded" });
    } finally {
      setIsConvertingVideo(false);
    }
  };

  const handlePublish = async () => {
    setFeedback(null);
    if (selectedChannels.length === 0) return;
    setIsPublishing(true);
    try {
      const hasAnyCopy = Object.values(variants).some((v) => v.caption.trim().length > 0);
      const fallbackText = topicIntro || "New update from Neramit AI";
      const effectiveVariants: SocialCopyVariantsMap = hasAnyCopy
        ? variants
        : createEmptyCopyVariants(fallbackText);

      const res = await submitSocialPostRequest({
        brandId: activeBrand?.id ?? "brand-neramit", topicIntro, mediaKind, mediaUrl: mediaUrl || undefined,
        channels: selectedChannels, variants: effectiveVariants,
        scheduledAt: scheduledAtLocal ? new Date(scheduledAtLocal).toISOString() : undefined,
      });
      if (!res.ok || !res.post) {
        setFeedback({ type: "err", text: res.error ?? "Failed to submit post" });
        return;
      }
      setPosts((prev) => [res.post!, ...prev]);
      setFeedback({
        type: res.post.status === "failed" ? "err" : "ok",
        text: res.post.status === "scheduled"
          ? "ตั้งเวลาโพสต์ล่วงหน้าลงตารางเรียบร้อย (0 Tokens)!"
          : res.post.status === "partial_failure"
          ? "โพสต์สำเร็จบางช่องทาง (Partial Failure) — กดปุ่ม Retry เฉพาะช่องทางที่พังด้านล่างได้เลย"
          : "Auto-Post สำเร็จครบทุกช่องทางที่เลือก (0 Tokens)!",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRetryChannel = async (postId: string) => {
    setRetryingPostId(postId);
    try {
      const res = await fetch("/api/social/posts/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = (await res.json()) as { post?: SocialPostRecord };
      if (res.ok && data.post) setPosts((p) => p.map((item) => (item.id === postId ? data.post! : item)));
    } finally {
      setRetryingPostId(null);
    }
  };

  return {
    locale, brands, setBrands, activeBrand, activeBrandId, setActiveBrandId, posts, setPosts,
    topicIntro, setTopicIntro, mediaKind, setMediaKind, mediaUrl, setMediaUrl,
    selectedChannels, toggleChannel, variants, setVariants, scheduledAtLocal, setScheduledAtLocal,
    compatibility, isGeneratingCopy, isConvertingVideo, isPublishing, retryingPostId, feedback,
    handleGenerateCopy, handleAutoConvertVideo, handlePublish, handleRetryChannel,
  };
}
