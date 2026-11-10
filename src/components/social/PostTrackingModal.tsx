"use client";

import React, { useState } from "react";
import {
  Activity, BarChart3, CheckCircle2, Clock, ExternalLink,
  Eye, Heart, MessageCircle, RefreshCw, Share2, X,
} from "lucide-react";
import { computeCampaignTotals, SOCIAL_CHANNELS, SocialPostRecord } from "@/domain/social-types";
import { StudioLocale } from "@/domain/studio-types";

interface PostTrackingModalProps {
  post: SocialPostRecord;
  onClose: () => void;
  onPostsUpdated: (posts: SocialPostRecord[]) => void;
  locale: StudioLocale;
}

export function PostTrackingModal({
  post,
  onClose,
  onPostsUpdated,
  locale,
}: PostTrackingModalProps) {
  const [syncing, setSyncing] = useState<boolean>(false);

  const totals = computeCampaignTotals([post]);
  const maxChannelViews = Math.max(
    1,
    ...post.results.map((r) => r.metrics?.views ?? 0)
  );

  const handleSyncSingle = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/social/posts/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = (await res.json()) as { posts?: SocialPostRecord[] };
      if (data.posts) onPostsUpdated(data.posts);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="neramit-glass flex max-h-[90vh] w-full max-w-3xl flex-col gap-4 overflow-y-auto rounded-3xl p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="neu-tint-primary grid size-10 place-items-center rounded-2xl">
              <BarChart3 className="size-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold">
                {locale === "th"
                  ? "เจาะลึกผลลัพธ์ & สถานะโพสต์รายช่องทาง (Live Post Tracker)"
                  : "Multi-Channel Post Delivery & Engagement Tracker"}
              </h3>
              <p className="line-clamp-1 text-xs text-[var(--muted-foreground)]">
                {post.brandName} · {post.topicIntro || "Social Campaign"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncSingle}
              disabled={syncing}
              className="neu-tint-primary flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold"
            >
              <RefreshCw className={`size-3.5 ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Syncing..." : locale === "th" ? "ดึงยอดล่าสุด" : "Sync Now"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="neu-raised grid size-8 place-items-center rounded-xl"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="neu-pressed rounded-2xl p-3">
            <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--muted-foreground)]">
              <Eye className="size-3.5 text-sky-400" />
              <span>Total Views</span>
            </div>
            <div className="text-lg font-extrabold tabular-nums">{totals.totalViews.toLocaleString()}</div>
          </div>
          <div className="neu-pressed rounded-2xl p-3">
            <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--muted-foreground)]">
              <Heart className="size-3.5 text-pink-400" />
              <span>Total Likes</span>
            </div>
            <div className="text-lg font-extrabold tabular-nums text-pink-300">{totals.totalLikes.toLocaleString()}</div>
          </div>
          <div className="neu-pressed rounded-2xl p-3">
            <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--muted-foreground)]">
              <MessageCircle className="size-3.5 text-violet-400" />
              <span>Comments & Shares</span>
            </div>
            <div className="text-lg font-extrabold tabular-nums text-violet-300">
              {(totals.totalComments + totals.totalShares).toLocaleString()}
            </div>
          </div>
          <div className="neu-pressed rounded-2xl p-3">
            <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--muted-foreground)]">
              <Activity className="size-3.5 text-emerald-400" />
              <span>Avg Engagement</span>
            </div>
            <div className="text-lg font-extrabold tabular-nums text-emerald-300">{totals.avgEngagementRate}%</div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {post.results.map((res) => {
            const meta = SOCIAL_CHANNELS.find((c) => c.id === res.channel);
            const m = res.metrics;
            const widthPct = m ? Math.max(6, Math.round((m.views / maxChannelViews) * 100)) : 0;

            return (
              <div key={res.channel} className="neu-raised flex flex-col gap-2 rounded-2xl p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: meta?.accentHex }} />
                    <span>{meta?.label ?? res.channel}</span>
                    <span className="neu-pressed rounded-full px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      {res.remoteState === "processing" ? (
                        <span className="inline-flex items-center gap-1 text-amber-300">
                          <Clock className="size-3" /> Video Processing
                        </span>
                      ) : res.status === "published" ? (
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="size-3" /> Live Verified ({res.modeUsed ?? "dry_run"})
                        </span>
                      ) : (
                        res.status
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    {m?.lastSyncedAt && (
                      <span className="text-[var(--muted-foreground)]">
                        Synced: {new Date(m.lastSyncedAt).toLocaleTimeString()}
                      </span>
                    )}
                    {res.externalPostUrl && (
                      <a
                        href={res.externalPostUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="neu-pressed inline-flex items-center gap-1 rounded-lg px-2 py-1 font-bold text-violet-300 hover:underline"
                      >
                        <span>Open Post</span>
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                </div>

                {m && (
                  <>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/40">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${widthPct}%`, backgroundColor: meta?.accentHex ?? "#8b5cf6" }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="inline-flex items-center gap-1"><Eye className="size-3.5 text-sky-400" /> {m.views.toLocaleString()} views</span>
                        <span className="inline-flex items-center gap-1"><Heart className="size-3.5 text-pink-400" /> {m.likes.toLocaleString()} likes</span>
                        <span className="inline-flex items-center gap-1"><MessageCircle className="size-3.5 text-violet-400" /> {m.comments.toLocaleString()} comments</span>
                        <span className="inline-flex items-center gap-1"><Share2 className="size-3.5 text-emerald-400" /> {m.shares.toLocaleString()} shares</span>
                      </div>
                      <span className="font-extrabold text-emerald-300">ER: {m.engagementRate}%</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
