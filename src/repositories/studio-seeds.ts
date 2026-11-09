import { ApiKeyVaultConfig } from "../domain/neramit-vault-types";
import {
  AudioStudioTurn,
  ChatConversation,
  StudioGenerationTurn,
} from "../domain/studio-types";

export const DEFAULT_VAULT: ApiKeyVaultConfig = {
  engineMode: "hybrid",
  geminiApiKey: "",
  openaiApiKey: "",
  falApiKey: "",
};

export const DEFAULT_GENERATION_TURNS: StudioGenerationTurn[] = [
  {
    id: "seed-turn-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    output: "image",
    modelSlug: "seedream-5-pro",
    modelTitle: "Seedream 5 Pro",
    vendor: "bytedance",
    prompt:
      "ขวดน้ำหอมคริสตัลวางบนหินอ่อนสีดำเปียกน้ำ @img-1 แสงแดดยามเช้าส่องผ่านม่านหมอก — shot on 35mm Kodak Vision3 film",
    aspectRatio: "1:1",
    resolution: "2K",
    numImages: 1,
    tokensCharged: 127,
    status: "succeeded",
    lineageLabel: "Origin · Seedream 5 Pro (16-Layer Stack)",
    providerUsed: "Neramit Hybrid Engine",
    referenceImages: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop",
    ],
    resultUrls: [
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1000&auto=format&fit=crop",
    ],
    layers: [
      { index: 1, label: "Background Obsidian Studio", previewUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400", opacity: 100 },
      { index: 2, label: "Crystal Perfume Flacon (Hero)", previewUrl: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400", opacity: 100 },
      { index: 3, label: "Gold Atomizer Cap", previewUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400", opacity: 100 },
      { index: 4, label: "Volumetric Mist & Rim Glow", previewUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400", opacity: 85 },
    ],
  },
  {
    id: "seed-turn-2",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    output: "video",
    modelSlug: "seedance-2-5",
    modelTitle: "Seedance 2.5",
    vendor: "bytedance",
    mode: "i2v",
    prompt:
      "วิดีโอแฟชั่น 10 วินาที ช็อตเดียวไม่ตัด นางแบบหมุนตัวเปลี่ยนสีชุดและสีสินค้าพร้อมกัน @img-1 สไตล์การ์ดสวอตช์สี",
    aspectRatio: "9:16",
    resolution: "1080p",
    durationSeconds: 7,
    numImages: 1,
    tokensCharged: 150,
    status: "succeeded",
    lineageLabel: "Chained from Seedream 5 Pro (#2 Hero Layer) → Seedance 2.5 (I2V)",
    providerUsed: "Neramit Hybrid Engine",
    referenceImages: ["/media/templates/swatch-snap-cover.webp"],
    resultUrls: ["/media/templates/swatch-snap-video.mp4"],
  },
];

export const DEFAULT_AUDIO_TURNS: AudioStudioTurn[] = [
  {
    id: "audio-seed-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    mode: "voice",
    prompt: "สัมผัสความหอมเหนือระดับกับคอลเลกชันใหม่จาก Neramit AI Studio วันนี้ทุกสาขา",
    voiceId: "th-female-nicha",
    voiceName: "ณิชา (Nicha · Thai Commercial)",
    format: "mp3",
    seconds: 6.4,
    tokensCharged: 35,
    audioUrl: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
    subtitles: [
      { startMs: 0, endMs: 2200, text: "สัมผัสความหอมเหนือระดับ" },
      { startMs: 2200, endMs: 4600, text: "กับคอลเลกชันใหม่จาก Neramit AI Studio" },
      { startMs: 4600, endMs: 6400, text: "วันนี้ทุกสาขา" },
    ],
  },
];

export const DEFAULT_CHATS: ChatConversation[] = [
  {
    id: "chat-seed-1",
    title: "วางสคริปต์โฆษณาน้ำอัดลม 7-Day OOTD",
    modelAlias: "neramit/glm-5-3-flash",
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    messages: [
      {
        id: "m-1",
        role: "user",
        content: "ช่วยคิดสคริปต์วิดีโอโฆษณา 7 วินาที สไตล์น้ำอัดลมเกาหลีสดใสสำหรับแบรนด์ SparkPop หน่อยครับ",
        createdAt: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
      },
      {
        id: "m-2",
        role: "assistant",
        content:
          "นี่คือสตอรี่บอร์ด 7 วินาทีสำหรับ **SparkPop** บน **Neramit AI Omni-Studio**:\n\n1. **Image Stage (`Seedream 5 Pro`)**: เจนภาพกระป๋อง `@img-1` แบบแยก 16 เลเยอร์ใส\n2. **Video Stage (`Seedance 2.5`)**: กดปุ่ม *Chain to Video (I2V)* เพื่อหมุนกล้องรอบกระป๋องพร้อมฟองโซดา\n3. **Audio Stage (`Seed Audio 1.0`)**: กด *Add Voiceover* พากย์สโลแกน *\"ซ่าทุกวัน สดชื่นทุกสไตล์!\"*",
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        modelAlias: "neramit/glm-5-3-flash",
        tokensCharged: 8,
      },
    ],
  },
];
