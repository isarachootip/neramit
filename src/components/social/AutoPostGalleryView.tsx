"use client";

import React, { useState } from "react";
import { AlertTriangle, Calendar, CheckCircle2, ExternalLink, RefreshCw, Share2 } from "lucide-react";
import { SOCIAL_CHANNELS, SocialPostRecord, SocialPostStatus } from "@/domain/social-types";
import { StudioLocale } from "@/domain/studio-types";

interface AutoPostGalleryViewProps {
  posts: SocialPostRecord[];
  onRetryPost: (postId: string) => void;
  retryingPostId: string | null;
  locale: StudioLocale;
}

export function AutoPostGalleryView({
  posts,
  onRetryPost,
  retryingPostId,
  locale,
}: AutoPostGalleryViewProps) {
  const [filter, setFilter] = useState<"all" | SocialPostStatus>("all");

  const totalDeliveries = posts.reduce(
    (acc, p) => acc + p.results.filter((r) => r.status === "published").length,
    0
  );
  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;
  const visiblePosts = filter === "all" ? posts : posts.filter((p) => p.status === filter);

  return (
    <section className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="neu-raised rounded-2xl p-4">
          <div className="text-2xl font-extrabold tabular-nums">{posts.length}</div>
          <div className="text-[11px] font-bold uppercase text-[var(--muted-foreground)]">
            {locale === "th" ? "แคมเปญโพสต์ทั้งหมด" : "Total Campaigns"}
          </div>
        </div>
        <div className="neu-raised rounded-2xl p-4">
          <div className="text-2xl font-extrabold tabular-nums text-emerald-400">{totalDeliveries}</div>
          <div className="text-[11px] font-bold uppercase text-[var(--muted-foreground)]">
            {locale === "th" ? "การส่งออกสำเร็จรวม" : "Successful Deliveries"}
          </div>
        </div>
        <div className="neu-raised rounded-2xl p-4">
          <div className="text-2xl font-extrabold tabular-nums text-violet-400">{SOCIAL_CHANNELS.length}</div>
          <div className="text-[11px] font-bold uppercase text-[var(--muted-foreground)]">
            {locale === "th" ? "แพลตฟอร์ม Direct API" : "Direct Platforms"}
          </div>
        </div>
        <div className="neu-raised rounded-2xl p-4">
          <div className="text-2xl font-extrabold tabular-nums text-amber-400">{scheduledCount}</div>
          <div className="text-[11px] font-bold uppercase text-[var(--muted-foreground)]">
            {locale === "th" ? "คิวตั้งเวลาล่วงหน้า" : "Scheduled Queue"}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Share2 className="size-4 text-violet-400" />
          <h2 className="text-base font-extrabold">
            {locale === "th" ? "Auto-Post Gallery & ตารางคิวโพสต์ทุกช่องทาง" : "Multi-Channel Auto-Post Gallery & Calendar"}
          </h2>
        </div>

        <div className="neu-pressed flex flex-wrap gap-1 rounded-2xl p-1">
          {(["all", "published", "scheduled", "partial_failure"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-xl px-3 py-1 text-xs font-bold capitalize ${
                filter === f ? "neu-tint-primary" : "text-[var(--muted-foreground)]"
              }`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {visiblePosts.map((post) => {
          const hasFailure = post.status === "partial_failure" || post.status === "failed";
          const firstChannel = post.channels[0] ?? "x";
          const primaryCopy = post.variants[firstChannel]?.caption || post.topicIntro;

          return (
            <article key={post.id} className="neramit-glass flex flex-col justify-between gap-3.5 rounded-3xl p-4 sm:p-5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="neu-pressed rounded-full px-3 py-1 text-xs font-extrabold text-violet-300">
                    {post.brandName}
                  </span>
                  <span
                    className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      post.status === "published"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : post.status === "scheduled"
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-red-500/15 text-red-300"
                    }`}
                  >
                    {post.status === "published" ? <CheckCircle2 className="size-3" /> : post.status === "scheduled" ? <Calendar className="size-3" /> : <AlertTriangle className="size-3" />}
                    <span>{post.status.replace("_", " ")}</span>
                  </span>
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

                <p className="line-clamp-3 text-xs sm:text-sm leading-relaxed">{primaryCopy}</p>

                {post.scheduledAt && post.status === "scheduled" && (
                  <p className="text-[11px] font-semibold text-amber-300">
                    ⏰ Scheduled: {new Date(post.scheduledAt).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-3">
                <div className="flex flex-wrap gap-1.5">
                  {post.results.map((res) => {
                    const meta = SOCIAL_CHANNELS.find((c) => c.id === res.channel);
                    return (
                      <span
                        key={res.channel}
                        title={res.errorMessage ?? res.modeUsed}
                        className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold ${
                          res.status === "published"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : res.status === "failed"
                            ? "bg-red-500/20 text-red-300"
                            : "neu-pressed text-[var(--muted-foreground)]"
                        }`}
                      >
                        <span className="size-2 rounded-full" style={{ backgroundColor: meta?.accentHex }} />
                        <span>{meta?.label ?? res.channel}</span>
                        {res.externalPostUrl && (
                          <a href={res.externalPostUrl} target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100">
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </span>
                    );
                  })}
                </div>

                {hasFailure && (
                  <button
                    type="button"
                    onClick={() => onRetryPost(post.id)}
                    disabled={retryingPostId === post.id}
                    className="neu-tint-primary flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-extrabold"
                  >
                    <RefreshCw className={`size-3.5 ${retryingPostId === post.id ? "animate-spin" : ""}`} />
                    <span>{locale === "th" ? "ลองส่งใหม่เฉพาะช่องทางที่ล้มเหลว (Retry Failed)" : "Retry Failed Channels"}</span>
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
