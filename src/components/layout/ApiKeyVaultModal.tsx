"use client";

import React, { useEffect, useState } from "react";
import { Check, Cpu, KeyRound, ShieldCheck, X } from "lucide-react";
import { ApiKeyVaultConfig } from "@/domain/neramit-vault-types";
import { StudioLocale } from "@/domain/studio-types";

interface ApiKeyVaultModalProps {
  open: boolean;
  onClose: () => void;
  vault: ApiKeyVaultConfig;
  onSave: (next: ApiKeyVaultConfig) => void;
  locale: StudioLocale;
}

export function ApiKeyVaultModal({
  open,
  onClose,
  vault,
  onSave,
  locale,
}: ApiKeyVaultModalProps) {
  const [draft, setDraft] = useState<ApiKeyVaultConfig>(vault);
  const [savedToast, setSavedToast] = useState<boolean>(false);

  useEffect(() => {
    if (open) setDraft(vault);
  }, [open, vault]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(draft);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 650);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="neramit-glass flex w-full max-w-lg flex-col gap-4 rounded-3xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="neu-tint-primary grid size-10 place-items-center rounded-2xl">
              <KeyRound className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold">Neramit Hybrid API Key Vault</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                {locale === "th"
                  ? "สลับโหมด Simulation หรือเชื่อมต่อ Gemini / OpenAI / Fal.ai API จริง"
                  : "Switch between Interactive Simulation and Live Provider API Keys"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="neu-raised grid size-8 place-items-center rounded-xl"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 rounded-2xl p-1.5 neu-pressed">
            {(["hybrid", "simulation"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDraft({ ...draft, engineMode: m })}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold ${
                  draft.engineMode === m
                    ? "neu-tint-primary"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                <Cpu className="size-3.5" />
                <span>
                  {m === "hybrid"
                    ? "Hybrid Mode (Live + Fallback)"
                    : "Pure Simulation Mode"}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold">
                Google Gemini API Key (Nano Banana / Gemini Omni)
              </label>
              <input
                type="password"
                value={draft.geminiApiKey}
                onChange={(e) => setDraft({ ...draft, geminiApiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="neu-pressed rounded-xl px-3.5 py-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold">
                OpenAI API Key (GPT Image 2.5 Flare / Sunburst)
              </label>
              <input
                type="password"
                value={draft.openaiApiKey}
                onChange={(e) => setDraft({ ...draft, openaiApiKey: e.target.value })}
                placeholder="sk-proj-..."
                className="neu-pressed rounded-xl px-3.5 py-2 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold">
                Fal.ai / ByteDance Ark Key (Seedream 5 / Seedance 2.5 / FLUX 3)
              </label>
              <input
                type="password"
                value={draft.falApiKey}
                onChange={(e) => setDraft({ ...draft, falApiKey: e.target.value })}
                placeholder="fal_key_..."
                className="neu-pressed rounded-xl px-3.5 py-2 text-xs"
              />
            </div>
          </div>

          <div className="neu-pressed flex items-center gap-2 rounded-2xl p-3 text-[11px] text-[var(--muted-foreground)]">
            <ShieldCheck className="size-4 shrink-0 text-emerald-400" />
            <span>
              {locale === "th"
                ? "คีย์ทั้งหมดถูกเก็บไว้ใน LocalStorage บนเครื่องของคุณเท่านั้น และหาก API ภายนอกล้มเหลว ระบบจะคืน Token อัตโนมัติ 100%"
                : "Keys are stored strictly in your browser's localStorage. Failed jobs trigger a 100% automatic token refund."}
            </span>
          </div>

          <button
            type="submit"
            className="neu-tint-primary flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-extrabold"
          >
            {savedToast ? (
              <>
                <Check className="size-4" />
                <span>Saved to Neramit Vault!</span>
              </>
            ) : (
              <span>{locale === "th" ? "บันทึกการตั้งค่า Engine" : "Save Engine Configuration"}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
