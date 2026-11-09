"use client";

import React, { useState } from "react";
import { Coins, LayoutTemplate, Play } from "lucide-react";
import { GENWHY_TEMPLATES } from "@/domain/templates-data";
import { GenWhyTemplate } from "@/domain/studio-types";
import { useAppPreferences } from "@/hooks/use-app-preferences";
import { TemplateCustomizerModal } from "@/components/templates/TemplateCustomizerModal";

export default function TemplatesPage() {
  const { locale, spendTokens } = useAppPreferences();
  const [selectedTemplate, setSelectedTemplate] =
    useState<GenWhyTemplate | null>(null);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="size-5 text-violet-400" />
          <h1 className="text-2xl font-extrabold tracking-tight">
            {locale === "th"
              ? "คลังเทมเพลตวิดีโอโฆษณาสำเร็จรูป (GenWhy Ad Templates)"
              : "Commercial Video Ad Templates"}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
          {locale === "th"
            ? "เลือกเทมเพลตโฆษณา 7 วินาที–10 วินาที ตอบคำถามสั้นๆ อัปโหลดรูปสินค้า แล้วให้ Seedance 2.5 เรนเดอร์ทันที"
            : "Pick a viral commercial template, customize product & brand slots, and render in one click"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {GENWHY_TEMPLATES.map((tpl) => (
          <article
            key={tpl.slug}
            onClick={() => setSelectedTemplate(tpl)}
            className="neu-raised neu-grain group cursor-pointer flex flex-col justify-between gap-4 rounded-3xl p-4 transition-all hover:-translate-y-1"
          >
            <div className="flex flex-col gap-3">
              <div className="neu-pressed relative h-56 overflow-hidden rounded-2xl bg-black/50">
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
                <span className="neu-raised absolute top-3 right-3 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold">
                  <Coins className="size-3.5 text-amber-400" />
                  <span>{tpl.priceTokens} Tokens</span>
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase text-violet-400">
                  {tpl.modelAlias} · {tpl.imageSlots.length} Product Slots
                </span>
                <h2 className="text-base font-extrabold">{tpl.name}</h2>
                <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                  {tpl.description}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="neu-tint-primary flex w-full items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-extrabold"
            >
              <Play className="size-3.5" />
              <span>
                {locale === "th" ? "ปรับแต่งและสร้างวิดีโอ" : "Customize & Render"}
              </span>
            </button>
          </article>
        ))}
      </div>

      <TemplateCustomizerModal
        template={selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        spendTokens={spendTokens}
        locale={locale}
      />
    </div>
  );
}
