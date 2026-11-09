export type StudioLocale = "th" | "en";
export type StudioTheme = "dark" | "light";
export type MediaOutputKind = "image" | "video" | "audio" | "chat";

export type VendorName =
  | "bytedance"
  | "google"
  | "openai"
  | "xai"
  | "blackforestlabs"
  | "zhipu";

export type VideoModeId =
  | "t2v"
  | "i2v"
  | "flf"
  | "extend"
  | "edit"
  | "reference"
  | "avatar"
  | "avatar20"
  | "motion"
  | "upscale";

export interface ModelSelectOption {
  value: string;
  label: string;
}

export interface ModelFieldSchema {
  type: "textarea" | "select" | "slider" | "switch" | "images" | "video" | "audio" | "mask" | "number";
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  options?: ModelSelectOption[];
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
  required?: boolean;
}

export interface VideoModeDefinition {
  id: VideoModeId;
  label: string;
  labelTh: string;
  requiresFirstFrame?: boolean;
  requiresLastFrame?: boolean;
  requiresSourceVideo?: boolean;
  requiresAudio?: boolean;
  maxReferenceImages?: number;
}

export interface StudioModelDefinition {
  slug: string;
  name: string;
  kind: "Image" | "Video" | "Audio" | "Chat";
  output: MediaOutputKind;
  title: string;
  vendor: VendorName;
  tagline: string;
  taglineTh: string;
  description: string;
  descriptionTh: string;
  flag?: "hot" | "new";
  aspect: string;
  baseTokens: number;
  maxPromptChars: number;
  maxReferenceImages: number;
  resolutions: string[];
  aspectRatios: string[];
  supportsLayerDecomposition?: boolean;
  supportsThinking?: boolean;
  supportsMask?: boolean;
  supportsBatch?: boolean;
  supportsAudioToggle?: boolean;
  audioIncluded?: boolean;
  modes?: VideoModeDefinition[];
  durationRange?: { min: number; max: number; defaultVal: number };
}

export interface TemplateQuestion {
  key: string;
  label: string;
  choices: string[];
  allowOther: boolean;
}

export interface TemplateImageSlot {
  key: string;
  label: string;
  required: boolean;
}

export interface NeramitTemplate {
  slug: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  coverVideoUrl: string;
  questions: TemplateQuestion[];
  briefEnabled: boolean;
  imageSlots: TemplateImageSlot[];
  priceTokens: number;
  modelAlias: string;
  aspectRatios: string[];
}

export interface LayerItem {
  index: number;
  label: string;
  previewUrl: string;
  opacity: number;
}

export interface StudioGenerationTurn {
  id: string;
  createdAt: string;
  output: "image" | "video";
  modelSlug: string;
  modelTitle: string;
  vendor: VendorName;
  mode?: VideoModeId;
  prompt: string;
  aspectRatio: string;
  resolution: string;
  durationSeconds?: number;
  numImages: number;
  tokensCharged: number;
  status: "queued" | "running" | "succeeded" | "failed";
  referenceImages: string[];
  maskDataUrl?: string;
  resultUrls: string[];
  layers?: LayerItem[];
  lineageLabel?: string;
  providerUsed?: string;
}

export interface AudioSubtitleSentence {
  startMs: number;
  endMs: number;
  text: string;
}

export interface AudioStudioTurn {
  id: string;
  createdAt: string;
  mode: "describe" | "voice" | "clone" | "image";
  prompt: string;
  voiceId: string;
  voiceName: string;
  format: "mp3" | "wav" | "ogg_opus";
  seconds: number;
  tokensCharged: number;
  audioUrl: string;
  subtitles: AudioSubtitleSentence[];
}

export interface ChatTurnMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  modelAlias?: string;
  attachments?: string[];
  tokensCharged?: number;
}

export interface ChatConversation {
  id: string;
  title: string;
  modelAlias: string;
  updatedAt: string;
  messages: ChatTurnMessage[];
}

export interface PricingPackageItem {
  id: string;
  name: string;
  kind: "subscription" | "topup";
  billingInterval?: "month" | "year";
  priceThb: number;
  tokens: number;
  bonusTokens: number;
  badge: string;
  description: string;
  features: string[];
}
