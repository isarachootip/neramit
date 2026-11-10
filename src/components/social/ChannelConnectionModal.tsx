"use client";

import React, { useState } from "react";
import { CheckCircle2, Compass, ExternalLink, KeyRound, ShieldAlert, Webhook, X } from "lucide-react";
import {
  AutoPostBridgeProvider,
  AutoPostRoutingMode,
  DiscoveredSocialTarget,
  PublicBrandProfile,
  SocialChannelId,
} from "@/domain/social-types";

interface ChannelModalProps {
  brand: PublicBrandProfile;
  editingChannel: SocialChannelId | null;
  editingBridge: boolean;
  onClose: () => void;
  onBrandsUpdated: (next: PublicBrandProfile[]) => void;
}

export function ChannelConnectionModal({
  brand,
  editingChannel,
  editingBridge,
  onClose,
  onBrandsUpdated,
}: ChannelModalProps) {
  const conn = editingChannel ? brand.channels[editingChannel] : undefined;
  const [handleInput, setHandleInput] = useState<string>(conn?.accountHandle ?? "");
  const [targetIdInput, setTargetIdInput] = useState<string>(conn?.externalTargetId ?? "");
  const [tokenInput, setTokenInput] = useState<string>("");
  const [refreshInput, setRefreshInput] = useState<string>("");
  const [dryRunInput, setDryRunInput] = useState<boolean>(conn?.dryRun ?? true);

  const [discovered, setDiscovered] = useState<DiscoveredSocialTarget[]>([]);
  const [discovering, setDiscovering] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const [bridgeEnabled, setBridgeEnabled] = useState<boolean>(brand.bridge.enabled);
  const [bridgeProvider, setBridgeProvider] = useState<AutoPostBridgeProvider>(brand.bridge.provider);
  const [bridgeUrl, setBridgeUrl] = useState<string>(brand.bridge.endpointUrl);
  const [bridgeKey, setBridgeKey] = useState<string>("");
  const [webhookSecret, setWebhookSecret] = useState<string>("");
  const [routingMode, setRoutingMode] = useState<AutoPostRoutingMode>(brand.bridge.routingMode);

  if (!editingChannel && !editingBridge) return null;

  const handleDiscoverTargets = async () => {
    if (!editingChannel) return;
    setDiscovering(true);
    try {
      const res = await fetch("/api/social/discover-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: brand.id, channel: editingChannel, accessToken: tokenInput || undefined }),
      });
      const data = (await res.json()) as { targets?: DiscoveredSocialTarget[] };
      if (data.targets) setDiscovered(data.targets);
    } finally {
      setDiscovering(false);
    }
  };

  const postBrandUpdate = async (payload: Record<string, unknown>) => {
    setSaving(true);
    const res = await fetch("/api/social/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { brands?: PublicBrandProfile[] };
    if (data.brands) onBrandsUpdated(data.brands);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      {editingChannel ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            postBrandUpdate({
              brandId: brand.id, channel: editingChannel, accountHandle: handleInput,
              externalTargetId: targetIdInput || undefined, accessToken: tokenInput || undefined,
              refreshToken: refreshInput || undefined, dryRun: dryRunInput,
            });
          }}
          className="neramit-glass flex w-full max-w-md flex-col gap-3.5 rounded-3xl p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-violet-400" />
              <h3 className="text-sm font-extrabold">Connect {editingChannel.toUpperCase()} · {brand.name}</h3>
            </div>
            <button type="button" onClick={onClose} className="neu-raised grid size-7 place-items-center rounded-lg"><X className="size-3.5" /></button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <a href={`/api/oauth/${editingChannel}?brandId=${encodeURIComponent(brand.id)}`} className="neu-tint-primary flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-extrabold">
              <ExternalLink className="size-3.5" />
              <span>OAuth 2.0 Login</span>
            </a>
            <button type="button" onClick={handleDiscoverTargets} disabled={discovering} className="neu-raised flex items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-extrabold text-violet-300">
              <Compass className="size-3.5" />
              <span>{discovering ? "Discovering..." : "Auto-Discover เพจ/ช่อง"}</span>
            </button>
          </div>

          {discovered.length > 0 && (
            <div className="neu-pressed flex flex-col gap-1.5 rounded-2xl p-2.5 text-xs">
              <span className="text-[11px] font-bold text-violet-300">คลิกเลือกบัญชี/เพจที่ตรวจพบ:</span>
              {discovered.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setHandleInput(t.handle);
                    setTargetIdInput(t.id);
                    if (t.accessToken) setTokenInput(t.accessToken);
                  }}
                  className="neu-raised flex items-center justify-between rounded-xl px-3 py-1.5 text-left font-semibold hover:text-violet-300"
                >
                  <span>{t.label}</span>
                  <span className="text-[10px] text-[var(--muted-foreground)]">{t.id}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 text-xs">
            <input value={handleInput} onChange={(e) => setHandleInput(e.target.value)} placeholder="Account Handle (e.g. @neramit_official)" className="neu-pressed rounded-xl px-3 py-2" />
            <input value={targetIdInput} onChange={(e) => setTargetIdInput(e.target.value)} placeholder="Target ID (Page ID / IG Business ID / LinkedIn URN / @TelegramChat)" className="neu-pressed rounded-xl px-3 py-2" />
            <input type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="Access Token / Bot Token (AES-256 Encrypted)" className="neu-pressed rounded-xl px-3 py-2" />
            {editingChannel === "youtube" && (
              <input type="password" value={refreshInput} onChange={(e) => setRefreshInput(e.target.value)} placeholder="Google OAuth Refresh Token (Optional)" className="neu-pressed rounded-xl px-3 py-2" />
            )}
            <label className="neu-pressed flex cursor-pointer items-center justify-between rounded-xl px-3 py-2">
              <span className="flex items-center gap-1.5 font-semibold">
                {dryRunInput ? <ShieldAlert className="size-3.5 text-amber-400" /> : <CheckCircle2 className="size-3.5 text-emerald-400" />}
                <span>Dry-Run Sandbox Mode (ทดสอบไม่ยิงขึ้นฟีดจริง)</span>
              </span>
              <input type="checkbox" checked={dryRunInput} onChange={(e) => setDryRunInput(e.target.checked)} className="accent-violet-500" />
            </label>
          </div>

          <button type="submit" disabled={saving} className="neu-tint-primary rounded-2xl py-2.5 text-xs font-extrabold">
            {saving ? "Encrypting & Saving..." : "Save Channel Connection"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            postBrandUpdate({
              brandId: brand.id,
              bridge: {
                enabled: bridgeEnabled, provider: bridgeProvider, endpointUrl: bridgeUrl,
                bridgeKey: bridgeKey || undefined, webhookSecret: webhookSecret || undefined, routingMode,
              },
            });
          }}
          className="neramit-glass flex w-full max-w-md flex-col gap-3.5 rounded-3xl p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="size-4 text-emerald-400" />
              <h3 className="text-sm font-extrabold">Hybrid Auto-Post Bridge (utopost) · {brand.name}</h3>
            </div>
            <button type="button" onClick={onClose} className="neu-raised grid size-7 place-items-center rounded-lg"><X className="size-3.5" /></button>
          </div>

          <div className="flex flex-col gap-2 text-xs">
            <label className="neu-pressed flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 font-bold">
              <span>เปิดใช้งาน Hybrid Auto-Post Bridge</span>
              <input type="checkbox" checked={bridgeEnabled} onChange={(e) => setBridgeEnabled(e.target.checked)} className="accent-emerald-500" />
            </label>
            <select value={bridgeProvider} onChange={(e) => setBridgeProvider(e.target.value as AutoPostBridgeProvider)} className="neu-pressed rounded-xl px-3 py-2 font-semibold">
              <option value="vibepost">VibePost Auto-Post System (vibepost.online)</option>
              <option value="webhook">n8n / Make.com / Custom Webhook Bridge</option>
              <option value="upload_post">Upload-Post / Unified Aggregator API</option>
            </select>
            <select value={routingMode} onChange={(e) => setRoutingMode(e.target.value as AutoPostRoutingMode)} className="neu-pressed rounded-xl px-3 py-2 font-semibold">
              <option value="bridge_fallback">Hybrid Fallback (ใช้ Direct API ก่อน ถ้าไม่มีให้ยิงผ่าน Bridge)</option>
              <option value="bridge_primary">Bridge Primary (ส่งทุกช่องทางผ่าน Auto-Post Bridge เป็นหลัก)</option>
              <option value="direct_only">Direct API Only (ใช้เฉพาะ Direct OAuth ในตัว Neramit)</option>
            </select>
            <input value={bridgeUrl} onChange={(e) => setBridgeUrl(e.target.value)} placeholder="Endpoint URL (e.g. https://vibepost.online/api/autopost)" className="neu-pressed rounded-xl px-3 py-2" />
            <input type="password" value={bridgeKey} onChange={(e) => setBridgeKey(e.target.value)} placeholder="Bridge API Key / Bearer Token (AES-256 Encrypted)" className="neu-pressed rounded-xl px-3 py-2" />
            <input type="password" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} placeholder="Inbound Webhook HMAC Secret (/api/social/webhook)" className="neu-pressed rounded-xl px-3 py-2" />
          </div>

          <button type="submit" disabled={saving} className="neu-tint-primary rounded-2xl py-2.5 text-xs font-extrabold">
            {saving ? "Saving Bridge..." : "Save Auto-Post Bridge Settings"}
          </button>
        </form>
      )}
    </div>
  );
}
