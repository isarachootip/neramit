"use client";

import React, { useState } from "react";
import {
  AlertTriangle, BarChart3, Calendar, CheckCircle2,
  ExternalLink, Eye, Heart, RefreshCw, Share2,
} from "lucide-react";
import { computeCampaignTotals, SOCIAL_CHANNELS, SocialPostRecord, SocialPostStatus } from "@/domain/social-types";
import { StudioLocale } from "@/domain/studio-types";
import { PostTrackingModal } from "./PostTrackingModal";

interface AutoPostGalleryViewProps {
  posts: SocialPostRecord[];
  onPostsUpdated: (next: SocialPostRecord[]) => void;
  onRetryPost: (postId: string) => void;
  retryingPostId: string | null;
  locale: StudioLocale;
}

export function AutoPostGalleryView({
  posts, onPostsUpdated, onRetryPost, retryingPostId, locale,
}: AutoPostGalleryViewProps) {
  const [filter, setFilter] = useState<"all" | SocialPostStatus>("all");
  const [syncingAll, setSyncingAll] = useState<boolean>(false);
  const [trackingPostId, setTrackingPostId] = useState<string | null>(null);

  const totalDeliveries = posts.reduce((acc, p) => acc + p.results.filter((r) => r.status === "published").length, 0);
  const kpi = computeCampaignTotals(posts);
  const visiblePosts = filter === "all" ? posts : posts.filter((p) => p.status === filter);
  const activeTrackedPost = posts.find((p) => p.id === trackingPostId) ?? null;

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const res = await fetch("/api/social/posts/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { posts?: SocialPostRecord[] };
      if (data.posts) onPostsUpdated(data.posts);
    } finally {
      setSyncingAll(false);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="neu-raised rounded-2xl p-4">
          <div className="text-2xl font-extrabold tabular-nums">{totalDeliveries}</div>
          <div className="text-[11px] font-bold uppercase text-[var(--muted-foreground)]">
            {locale === "th" ? "โพสต์สำเร็จรวม (9 ช่องทาง)" : "Published Deliveries"}
          </div>
        </div>
        <div className="neu-raised rounded-2xl p-4">
          <div className="text-2xl font-extrabold tabular-nums text-sky-400">{kpi.totalViews.toLocaleString()}</div>
          <div className="text-[11px] font-bold uppercase text-[var(--muted-foreground)]">
            {locale === "th" ? "ยอดการมองเห็นรวม (Total Views)" : "Total Views Across Channels"}
          </div>
        </div>
        <div className="neu-raised rounded-2xl p-4">
          <div className="text-2xl font-extrabold tabular-nums text-pink-400">{kpi.totalEngagements.toLocaleString()}</div>
          <div className="text-[11px] font-bold uppercase text-[var(--muted-foreground)]">
            {locale === "th" ? "ยอดมีส่วนร่วม (Likes+Comments+Shares)" : "Total Engagements"}
          </div>
        </div>
        <div className="neu-raised rounded-2xl p-4">
          <div className="text-2xl font-extrabold tabular-nums text-emerald-400">{kpi.avgEngagementRate}%</div>
          <div className="text-[11px] font-bold uppercase text-[var(--muted-foreground)]">
            {locale === "th" ? "อัตราส่วนร่วมเฉลี่ย (Avg ER)" : "Avg Engagement Rate"}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Share2 className="size-4 text-violet-400" />
          <h2 className="text-base font-extrabold">
            {locale === "th" ? "Auto-Post Gallery & ระบบติดตามผลลัพธ์รายช่องทาง" : "Multi-Channel Auto-Post Gallery & Live Tracker"}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSyncAll}
            disabled={syncingAll}
            className="neu-tint-primary flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-xs font-extrabold"
          >
            <RefreshCw className={`size-3.5 ${syncingAll ? "animate-spin" : ""}`} />
            <span>{syncingAll ? "Syncing 9 Channels..." : locale === "th" ? "ดึงผลล่าสุดทุกช่องทาง (Sync Metrics)" : "Sync All Metrics"}</span>
          </button>

          <div className="neu-pressed flex flex-wrap gap-1 rounded-2xl p-1">
            {(["all", "published", "scheduled", "partial_failure"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-xl px-3 py-1 text-xs font-bold capitalize ${filter === f ? "neu-tint-primary" : "text-[var(--muted-foreground)]"}`}
              >
                {f.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {visiblePosts.map((post) => {
          const hasFailure = post.status === "partial_failure" || post.status === "failed";
          const firstChannel = post.channels[0] ?? "x";
          const primaryCopy = post.variants[firstChannel]?.caption || post.topicIntro;
          const postKpi = computeCampaignTotals([post]);

          return (
            <article key={post.id} className="neramit-glass flex flex-col justify-between gap-3.5 rounded-3xl p-4 sm:p-5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="neu-pressed rounded-full px-3 py-1 text-xs font-extrabold text-violet-300">
                    {post.brandName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-sky-300">
                      👁 {postKpi.totalViews.toLocaleString()} · ❤️ {postKpi.totalLikes.toLocaleString()}
                    </span>
                    <span
                      className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        post.status === "published" ? "bg-emerald-500/15 text-emerald-300" : post.status === "scheduled" ? "bg-amber-500/15 text-amber-300" : "bg-red-500/15 text-red-300"
                      }`}
                    >
                      {post.status === "published" ? <CheckCircle2 className="size-3" /> : post.status === "scheduled" ? <Calendar className="size-3" /> : <AlertTriangle className="size-3" />}
                      <span>{post.status.replace("_", " ")}</span>
                    </span>
                  </div>
                </div>

                {post.mediaUrl && post.mediaKind !== "none" && (
                  <div className="neu-pressed h-44 overflow-hidden rounded-2xl bg-black/40">
                    {post.mediaKind === "video" ? (
                      <video src={post.mediaUrl} controls loop muted playsInline className="h-full w-full object-cover" />
                    ) : (
                      <img src={post.mediaUrl} alt={post.topicIntro} className="h-full w-full object-cover" />
                    )}
                  </div>
                )}

                <p className="line-clamp-2 text-xs sm:text-sm leading-relaxed">{primaryCopy}</p>
              </div>

              <div className="flex flex-col gap-2.5 border-t border-[var(--border)] pt-3">
                <div className="flex flex-wrap gap-1.5">
                  {post.results.map((res) => {
                    const meta = SOCIAL_CHANNELS.find((c) => c.id === res.channel);
                    return (
                      <span
                        key={res.channel}
                        title={res.errorMessage ?? res.modeUsed}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold ${
                          res.status === "published" ? "bg-emerald-500/15 text-emerald-300" : res.status === "failed" ? "bg-red-500/20 text-red-300" : "neu-pressed text-[var(--muted-foreground)]"
                        }`}
                      >
                        <span className="size-2 rounded-full" style={{ backgroundColor: meta?.accentHex }} />
                        <span>{meta?.label ?? res.channel}</span>
                        {res.metrics && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-sky-200">
                            <Eye className="size-2.5" />{res.metrics.views}
                            <Heart className="size-2.5 text-pink-300" />{res.metrics.likes}
                          </span>
                        )}
                        {res.externalPostUrl && (
                          <a href={res.externalPostUrl} target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100">
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </span>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTrackingPostId(post.id)}
                    className="neu-raised flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-extrabold text-violet-300"
                  >
                    <BarChart3 className="size-3.5" />
                    <span>{locale === "th" ? "เจาะลึกผลลัพธ์รายช่องทาง (Track Post)" : "Track Channel Metrics"}</span>
                  </button>
                  {hasFailure && (
                    <button
                      type="button"
                      onClick={() => onRetryPost(post.id)}
                      disabled={retryingPostId === post.id}
                      className="neu-tint-primary flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold"
                    >
                      <RefreshCw className={`size-3.5 ${retryingPostId === post.id ? "animate-spin" : ""}`} />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {activeTrackedPost && (
        <PostTrackingModal post={activeTrackedPost} onClose={() => setTrackingPostId(null)} onPostsUpdated={onPostsUpdated} locale={locale} />
      )}
    </section>
  );
}
