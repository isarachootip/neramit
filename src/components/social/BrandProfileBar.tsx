"use client";

import React, { useState } from "react";
import { Building2, CheckCircle2, ExternalLink, KeyRound, Plus, ShieldAlert, X } from "lucide-react";
import { PublicBrandProfile, SOCIAL_CHANNELS, SocialChannelId } from "@/domain/social-types";
import { StudioLocale } from "@/domain/studio-types";

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
  const [addingBrand, setAddingBrand] = useState<boolean>(false);
  const [newBrandName, setNewBrandName] = useState<string>("");
  const [newBrandTone, setNewBrandTone] = useState<string>("Modern Commercial & Friendly");

  const [handleInput, setHandleInput] = useState<string>("");
  const [targetIdInput, setTargetIdInput] = useState<string>("");
  const [tokenInput, setTokenInput] = useState<string>("");
  const [refreshInput, setRefreshInput] = useState<string>("");
  const [dryRunInput, setDryRunInput] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const openChannelModal = (ch: SocialChannelId) => {
    const conn = activeBrand?.channels[ch];
    setEditingChannel(ch);
    setHandleInput(conn?.accountHandle ?? "");
    setTargetIdInput(conn?.externalTargetId ?? "");
    setTokenInput("");
    setRefreshInput("");
    setDryRunInput(conn?.dryRun ?? true);
  };

  const handleSaveChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBrand || !editingChannel) return;
    setSaving(true);
    const res = await fetch("/api/social/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId: activeBrand.id,
        channel: editingChannel,
        accountHandle: handleInput,
        externalTargetId: targetIdInput || undefined,
        accessToken: tokenInput || undefined,
        refreshToken: refreshInput || undefined,
        dryRun: dryRunInput,
      }),
    });
    const data = (await res.json()) as { brands?: PublicBrandProfile[] };
    if (data.brands) onBrandsUpdated(data.brands);
    setSaving(false);
    setEditingChannel(null);
  };

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
          <span className="text-[11px] text-[var(--muted-foreground)]">
            Tone: <strong className="text-[var(--foreground)]">{activeBrand.voiceTone}</strong>
          </span>
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
              onClick={() => openChannelModal(ch.id)}
              className="neu-raised flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold transition-transform active:scale-95"
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: ch.accentHex }} />
              <span>{ch.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${isLive ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                {isLive ? "Live API" : "Dry-Run"}
              </span>
            </button>
          );
        })}
      </div>

      {editingChannel && activeBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <form onSubmit={handleSaveChannel} className="neramit-glass flex w-full max-w-md flex-col gap-3.5 rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-violet-400" />
                <h3 className="text-sm font-extrabold">Connect {editingChannel.toUpperCase()} · {activeBrand.name}</h3>
              </div>
              <button type="button" onClick={() => setEditingChannel(null)} className="neu-raised grid size-7 place-items-center rounded-lg"><X className="size-3.5" /></button>
            </div>

            <a
              href={`/api/oauth/${editingChannel}?brandId=${encodeURIComponent(activeBrand.id)}`}
              className="neu-tint-primary flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-extrabold"
            >
              <ExternalLink className="size-3.5" />
              <span>Connect via OAuth 2.0 Redirect</span>
            </a>

            <div className="flex flex-col gap-2 text-xs">
              <input value={handleInput} onChange={(e) => setHandleInput(e.target.value)} placeholder="Account Handle (e.g. @neramit_official)" className="neu-pressed rounded-xl px-3 py-2" />
              {(editingChannel === "facebook" || editingChannel === "instagram") && (
                <input value={targetIdInput} onChange={(e) => setTargetIdInput(e.target.value)} placeholder="Page ID or IG Business User ID" className="neu-pressed rounded-xl px-3 py-2" />
              )}
              <input type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="Direct Access Token / Bearer Token (AES-256 Encrypted)" className="neu-pressed rounded-xl px-3 py-2" />
              {editingChannel === "youtube" && (
                <input type="password" value={refreshInput} onChange={(e) => setRefreshInput(e.target.value)} placeholder="Google OAuth Refresh Token (Optional)" className="neu-pressed rounded-xl px-3 py-2" />
              )}
              <label className="neu-pressed flex cursor-pointer items-center justify-between rounded-xl px-3 py-2">
                <span className="flex items-center gap-1.5 font-semibold">
                  {dryRunInput ? <ShieldAlert className="size-3.5 text-amber-400" /> : <CheckCircle2 className="size-3.5 text-emerald-400" />}
                  <span>Dry-Run Sandbox Mode (ทดสอบไม่ยิงขึ้นหน้าฟีดจริง)</span>
                </span>
                <input type="checkbox" checked={dryRunInput} onChange={(e) => setDryRunInput(e.target.checked)} className="accent-violet-500" />
              </label>
            </div>

            <button type="submit" disabled={saving} className="neu-tint-primary rounded-2xl py-2.5 text-xs font-extrabold">
              {saving ? "Encrypting & Saving..." : "Save Channel Connection"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
