import { ApiKeyVaultConfig } from "../domain/neramit-vault-types";
import {
  AudioStudioTurn,
  ChatConversation,
  StudioGenerationTurn,
  StudioLocale,
  StudioTheme,
} from "../domain/studio-types";
import {
  DEFAULT_AUDIO_TURNS,
  DEFAULT_CHATS,
  DEFAULT_GENERATION_TURNS,
  DEFAULT_VAULT,
} from "./studio-seeds";

const KEYS = {
  UI: "neramit.ui.v1",
  WALLET: "neramit.wallet.v1",
  VAULT: "neramit.vault.v2",
  TURNS: "neramit.turns.v2",
  AUDIO: "neramit.audio.v2",
  CHATS: "neramit.chats.v2",
};

export interface StoredUiPreferences {
  theme: StudioTheme;
  locale: StudioLocale;
  payWithTeam: boolean;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadUiPreferences(): StoredUiPreferences {
  if (!isBrowser()) return { theme: "dark", locale: "th", payWithTeam: false };
  try {
    const raw = window.localStorage.getItem(KEYS.UI);
    return raw
      ? (JSON.parse(raw) as StoredUiPreferences)
      : { theme: "dark", locale: "th", payWithTeam: false };
  } catch {
    return { theme: "dark", locale: "th", payWithTeam: false };
  }
}

export function saveUiPreferences(prefs: StoredUiPreferences): void {
  if (isBrowser()) window.localStorage.setItem(KEYS.UI, JSON.stringify(prefs));
}

export function loadWalletBalance(): number {
  if (!isBrowser()) return 2500;
  const parsed = Number.parseInt(window.localStorage.getItem(KEYS.WALLET) ?? "", 10);
  return Number.isFinite(parsed) ? parsed : 2500;
}

export function saveWalletBalance(tokens: number): void {
  if (isBrowser()) {
    window.localStorage.setItem(KEYS.WALLET, String(Math.max(0, Math.round(tokens))));
  }
}

export function loadApiKeyVault(): ApiKeyVaultConfig {
  if (!isBrowser()) return DEFAULT_VAULT;
  try {
    const raw = window.localStorage.getItem(KEYS.VAULT);
    return raw ? { ...DEFAULT_VAULT, ...(JSON.parse(raw) as ApiKeyVaultConfig) } : DEFAULT_VAULT;
  } catch {
    return DEFAULT_VAULT;
  }
}

export function saveApiKeyVault(vault: ApiKeyVaultConfig): void {
  if (isBrowser()) window.localStorage.setItem(KEYS.VAULT, JSON.stringify(vault));
}

export function loadGenerationTurns(): StudioGenerationTurn[] {
  if (!isBrowser()) return DEFAULT_GENERATION_TURNS;
  try {
    const raw = window.localStorage.getItem(KEYS.TURNS);
    return raw ? (JSON.parse(raw) as StudioGenerationTurn[]) : DEFAULT_GENERATION_TURNS;
  } catch {
    return DEFAULT_GENERATION_TURNS;
  }
}

function safeSetItem(key: string, value: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage quota overflow when large base64 data URLs are generated
  }
}

export function saveGenerationTurns(turns: StudioGenerationTurn[]): void {
  safeSetItem(KEYS.TURNS, JSON.stringify(turns.slice(0, 15)));
}

export function loadAudioTurns(): AudioStudioTurn[] {
  if (!isBrowser()) return DEFAULT_AUDIO_TURNS;
  try {
    const raw = window.localStorage.getItem(KEYS.AUDIO);
    return raw ? (JSON.parse(raw) as AudioStudioTurn[]) : DEFAULT_AUDIO_TURNS;
  } catch {
    return DEFAULT_AUDIO_TURNS;
  }
}

export function saveAudioTurns(turns: AudioStudioTurn[]): void {
  safeSetItem(KEYS.AUDIO, JSON.stringify(turns.slice(0, 15)));
}

export function loadChatConversations(): ChatConversation[] {
  if (!isBrowser()) return DEFAULT_CHATS;
  try {
    const raw = window.localStorage.getItem(KEYS.CHATS);
    return raw ? (JSON.parse(raw) as ChatConversation[]) : DEFAULT_CHATS;
  } catch {
    return DEFAULT_CHATS;
  }
}

export function saveChatConversations(items: ChatConversation[]): void {
  safeSetItem(KEYS.CHATS, JSON.stringify(items.slice(0, 20)));
}
