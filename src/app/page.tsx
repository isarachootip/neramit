"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Coins, Film, Image as ImageIcon, LayoutTemplate, MessageSquare, Mic, Play, Sparkles } from "lucide-react";
import { GENWHY_TEMPLATES } from "@/domain/templates-data";
import { GenWhyTemplate, StudioGenerationTurn } from "@/domain/studio-types";
import { useAppPreferences } from "@/hooks/use-app-preferences";
import { loadGenerationTurns } from "@/repositories/studio-storage";
import { TemplateCustomizerModal } from "@/components/templates/TemplateCustomizerModal";

export default function HomePage() {
  const { t, locale, spendTokens } = useAppPreferences();
  const [recentTurns, setRecentTurns] = useState<StudioGenerationTurn[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<GenWhyTemplate | null>(null);
  const [greeting, setGreeting] = useState<string>(t.home.greetingAfternoon);

  useEffect(() => {
    setRecentTurns(loadGenerationTurns().slice(0, 4));
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t.home.greetingMorning);
    else if (hour < 18) setGreeting(t.home.greetingAfternoon);
    else setGreeting(t.home.greetingEvening);
  }, [t]);

  const studioCards = [
    { href: "/create/image", title: t.home.makeImage, desc: t.home.makeImageDesc, badge: "9 Models · 4K · 16 Layers", icon: ImageIcon },
    { href: "/create/video", title: t.home.makeVideo, desc: t.home.makeVideoDesc, badge: "11 Models · Seedance 2.5 · FLUX 3", icon: Film },
    { href: "/create/audio", title: t.home.makeAudio, desc: t.home.makeAudioDesc, badge: "Seed Audio 1.0 · @Audio1 Clone", icon: Mic },
    { href: "/create/chat", title: t.home.makeChat, desc: t.home.makeChatDesc, badge: "GLM 5.3 · Gemini Omni", icon: MessageSquare },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8">
      <section className="neu-raised neu-mesh-card neu-grain flex flex-col items-start justify-between gap-4 rounded-3xl p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold neu-pressed">
          <Sparkles className="size-3.5 text-violet-400" />
          <span>GenWhy.app Neumorphic Studio × Mantra.ad Rich @img Composer</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">{greeting}</h1>
        <p className="max-w-3xl text-xs sm:text-sm leading-relaxed text-[var(--muted-foreground)]">{t.home.subtitle}</p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {studioCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="neu-raised neu-grain group flex flex-col justify-between gap-4 rounded-3xl p-5 transition-all hover:-translate-y-0.5"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="neu-tint-primary grid size-11 place-items-center rounded-2xl">
                    <Icon className="size-5" />
                  </span>
                  <span className="neu-pressed rounded-full px-2.5 py-0.5 text-[10px] font-bold">{card.badge}</span>
                </div>
                <h2 className="text-base font-extrabold">{card.title}</h2>
                <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">{card.desc}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-violet-400 group-hover:translate-x-1 transition-transform">
                <span>{locale === "th" ? "เปิดสตูดิโอ" : "Launch Studio"}</span>
                <ArrowRight className="size-3.5" />
              </div>
            </Link>
          );
        })}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="size-4 text-violet-400" />
            <h2 className="text-base sm:text-lg font-extrabold">{t.home.trendingTemplates}</h2>
          </div>
          <Link href="/templates" className="neu-flat flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold">
            <span>{t.home.viewAll}</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GENWHY_TEMPLATES.slice(0, 4).map((tpl) => (
            <article
              key={tpl.slug}
              onClick={() => setActiveTemplate(tpl)}
              className="neu-raised group cursor-pointer overflow-hidden rounded-3xl p-3 flex flex-col gap-3 transition-all hover:-translate-y-0.5"
            >
              <div className="neu-pressed relative h-48 overflow-hidden rounded-2xl bg-black/40">
                <video
                  src={tpl.coverVideoUrl}
                  poster={tpl.thumbnailUrl}
                  muted
                  loop
                  playsInline
                  onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                  onMouseLeave={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                  }}
                  className="h-full w-full object-cover"
                />
                <span className="neu-raised absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                  <Coins className="size-3 text-amber-400" />
                  <span>{tpl.priceTokens}</span>
                </span>
                <span className="neu-tint-primary absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold">
                  <Play className="size-3" />
                  <span>Customize</span>
                </span>
              </div>
              <div className="px-1">
                <h3 className="truncate text-sm font-extrabold">{tpl.name}</h3>
                <p className="line-clamp-2 text-xs text-[var(--muted-foreground)]">{tpl.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold">{t.home.recentCreations}</h2>
          <Link href="/history" className="neu-flat flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold">
            <span>{t.home.viewAll}</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {recentTurns.map((turn) => (
            <div key={turn.id} className="neu-raised flex items-center gap-3.5 rounded-3xl p-3.5">
              <div className="neu-pressed size-20 shrink-0 overflow-hidden rounded-2xl">
                {turn.output === "video" ? (
                  <video src={turn.resultUrls[0]} muted loop autoPlay playsInline className="h-full w-full object-cover" />
                ) : (
                  <img src={turn.resultUrls[0]} alt={turn.prompt} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xs font-extrabold text-violet-400">{turn.modelTitle} · {turn.resolution}</span>
                <p className="line-clamp-2 text-xs text-[var(--muted-foreground)]">{turn.prompt}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <TemplateCustomizerModal template={activeTemplate} onClose={() => setActiveTemplate(null)} spendTokens={spendTokens} locale={locale} />
    </div>
  );
}
