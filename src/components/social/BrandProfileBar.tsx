"use client";

import React, { useState } from "react";
import { Building2, Plus, Webhook } from "lucide-react";
import { PublicBrandProfile, SOCIAL_CHANNELS, SocialChannelId } from "@/domain/social-types";
import { StudioLocale } from "@/domain/studio-types";
import { ChannelConnectionModal } from "./ChannelConnectionModal";

interface BrandProfileBarProps {
  brands: PublicBrandProfile[];
  activeBrand: PublicBrandProfile | undefined;
  onSelectBrand: (id: string) => void;
  onBrandsUpdated: (next: PublicBrandProfile[], activeId?: string) => void;
  locale: StudioLocale;
}

export function BrandProfileBar({
  brands,
  activeBrand,
  onSelectBrand,
  onBrandsUpdated,
  locale,
}: BrandProfileBarProps) {
  const [editingChannel, setEditingChannel] = useState<SocialChannelId | null>(null);
  const [editingBridge, setEditingBridge] = useState<boolean>(false);
  const [addingBrand, setAddingBrand] = useState<boolean>(false);
  const [newBrandName, setNewBrandName] = useState<string>("");
  const [newBrandTone, setNewBrandTone] = useState<string>("Modern Commercial & Friendly");

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    const id = `brand-${Date.now()}`;
    const res = await fetch("/api/social/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId: id, brandName: newBrandName.trim(), voiceTone: newBrandTone }),
    });
    const data = (await res.json()) as { brands?: PublicBrandProfile[] };
    if (data.brands) onBrandsUpdated(data.brands, id);
    setNewBrandName("");
    setAddingBrand(false);
  };

  return (
    <section className="neramit-glass flex flex-col gap-3.5 rounded-3xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Building2 className="size-4 text-violet-400" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--muted-foreground)]">
            {locale === "th" ? "โปรไฟล์แบรนด์ (Brand Profiles):" : "Brand Profiles:"}
          </span>
          {brands.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelectBrand(b.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                b.id === activeBrand?.id ? "neu-tint-primary" : "neu-flat"
              }`}
            >
              {b.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAddingBrand(!addingBrand)}
            className="neu-pressed flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-violet-400"
          >
            <Plus className="size-3.5" />
            <span>{locale === "th" ? "เพิ่มแบรนด์" : "New Brand"}</span>
          </button>
        </div>

        {activeBrand && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingChannel(null);
                setEditingBridge(true);
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition-all ${
                activeBrand.bridge?.enabled
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "neu-raised text-violet-300"
              }`}
            >
              <Webhook className="size-3.5" />
              <span>
                {activeBrand.bridge?.enabled
                  ? `Bridge: ${activeBrand.bridge.provider.toUpperCase()} (${activeBrand.bridge.routingMode})`
                  : locale === "th"
                  ? "⚡ ตั้งค่า Auto-Post Bridge (VibePost / Webhook)"
                  : "⚡ Configure Auto-Post Bridge"}
              </span>
            </button>
          </div>
        )}
      </div>

      {addingBrand && (
        <form onSubmit={handleCreateBrand} className="neu-pressed flex flex-wrap items-center gap-2 rounded-2xl p-3">
          <input value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} placeholder="Brand Name (e.g. Aurora Cafe)" className="neu-raised rounded-xl px-3 py-1.5 text-xs" />
          <input value={newBrandTone} onChange={(e) => setNewBrandTone(e.target.value)} placeholder="Brand Voice Tone" className="neu-raised flex-1 rounded-xl px-3 py-1.5 text-xs" />
          <button type="submit" className="neu-tint-primary rounded-xl px-4 py-1.5 text-xs font-bold">Save Brand</button>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {SOCIAL_CHANNELS.map((ch) => {
          const conn = activeBrand?.channels[ch.id];
          const isLive = Boolean(conn && !conn.dryRun && conn.maskedToken);
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => {
                setEditingBridge(false);
                setEditingChannel(ch.id);
              }}
              className="neu-raised flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold transition-transform active:scale-95"
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: ch.accentHex }} />
              <span>{ch.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${isLive ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                {isLive ? "Live API" : activeBrand?.bridge?.enabled ? "Bridge" : "Dry-Run"}
              </span>
            </button>
          );
        })}
      </div>

      {activeBrand && (editingChannel || editingBridge) && (
        <ChannelConnectionModal
          key={`${editingChannel ?? "bridge"}-${activeBrand.id}`}
          brand={activeBrand}
          editingChannel={editingChannel}
          editingBridge={editingBridge}
          onClose={() => {
            setEditingChannel(null);
            setEditingBridge(false);
          }}
          onBrandsUpdated={(next) => onBrandsUpdated(next)}
        />
      )}
    </section>
  );
}
