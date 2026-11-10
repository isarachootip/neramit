import { StudioLocale } from "./studio-types";

export interface I18nStrings {
  nav: {
    home: string;
    omniStudio: string;
    imageStudio: string;
    videoStudio: string;
    audioStudio: string;
    chatStudio: string;
    socialStudio: string;
    templates: string;
    history: string;
    pricing: string;
    apiVault: string;
  };
  home: {
    greetingMorning: string;
    greetingAfternoon: string;
    greetingEvening: string;
    subtitle: string;
    makeImage: string;
    makeImageDesc: string;
    makeVideo: string;
    makeVideoDesc: string;
    makeAudio: string;
    makeAudioDesc: string;
    makeChat: string;
    makeChatDesc: string;
    trendingTemplates: string;
    recentCreations: string;
    viewAll: string;
  };
  studio: {
    promptPlaceholderImage: string;
    promptPlaceholderVideo: string;
    rollIdea: string;
    enhancePrompt: string;
    generate: string;
    generating: string;
    referenceImages: string;
    addReference: string;
    insertTagHint: string;
    separateLayers: string;
    thinkingMode: string;
    paintMask: string;
    generateAudio: string;
    reusePrompt: string;
    inspectLayers: string;
  };
}

export const I18N_DICTIONARY: Record<StudioLocale, I18nStrings> = {
  th: {
    nav: {
      home: "หน้าหลัก",
      omniStudio: "Omni-Studio",
      imageStudio: "สตูดิโอภาพ",
      videoStudio: "สตูดิโอวิดีโอ",
      audioStudio: "สตูดิโอเสียง",
      chatStudio: "ผู้กำกับ AI",
      socialStudio: "Auto-Post",
      templates: "เทมเพลตโฆษณา",
      history: "คลังผลงาน",
      pricing: "แพ็กเกจ Token",
      apiVault: "API Key Vault",
    },
    home: {
      greetingMorning: "สวัสดีตอนเช้า — วันนี้ต้องการให้ Neramit AI เนรมิตแคมเปญไหนครับ?",
      greetingAfternoon: "สวัสดีตอนบ่าย — เริ่มต้นเนรมิตสื่อโฆษณาชิ้นใหม่กันเลย",
      greetingEvening: "สวัสดีตอนค่ำ — เปลี่ยนไอเดียให้เป็นภาพ วิดีโอ และเสียงระดับมาสเตอร์พีซ",
      subtitle:
        "Neramit AI (เนรมิต AI) — แพลตฟอร์ม Unified Omni-Studio ที่ผสานความประณีตแบบ Tactile Neumorphism เข้ากับระบบ Pipeline Chaining, True @-Autocomplete Chip Editor, วาด Mask บนแคนวาสจริง และคิวงานพร้อมระบบคืน Token อัตโนมัติ",
      makeImage: "Image & 16-Layer Studio",
      makeImageDesc: "สร้างภาพ 4K แยก 16 เลเยอร์ใส (Seedream 5 Pro) และระบาย Mask แก้ไขเฉพาะจุดบน Canvas",
      makeVideo: "Video & Motion Pipeline",
      makeVideoDesc: "รับภาพจาก Image Studio มาทำ I2V / FLF / Motion Control ด้วย Seedance 2.5 และ FLUX 3",
      makeAudio: "Seed Audio & Voice Clone",
      makeAudioDesc: "พากย์เสียงโฆษณา โคลนเสียงด้วยชิป @Audio1 และซิงค์ซับไตเติล SRT อัตโนมัติ",
      makeChat: "AI Creative Director",
      makeChatDesc: "ผู้กำกับโฆษณา AI วางสคริปต์ สตอรี่บอร์ด และส่ง Prompt เข้า Omni-Studio ในคลิกเดียว",
      trendingTemplates: "เทมเพลตวิดีโอโฆษณาพร้อมใช้ (Hover เพื่อดูวิดีโอตัวอย่าง)",
      recentCreations: "ผลงานและสายพานการผลิตล่าสุด (Pipeline History)",
      viewAll: "ดูทั้งหมด",
    },
    studio: {
      promptPlaceholderImage:
        "บรรยายภาพ... พิมพ์ @ เพื่อเรียกเมนูเลือก @img-1, @video-1, @Audio1 หรือกดสุ่มไอเดีย",
      promptPlaceholderVideo:
        "บรรยายการเคลื่อนไหวกล้องและฉาก... พิมพ์ @ เพื่ออ้างอิงเฟรม @img-1 หรือคลิปต้นแบบ",
      rollIdea: "สุ่มไอเดีย",
      enhancePrompt: "AI อัปเกรด Prompt",
      generate: "เนรมิตผลงาน",
      generating: "กำลังประมวลผล...",
      referenceImages: "ถาดวัตถุดิบอ้างอิง (@img / Keyframes)",
      addReference: "เพิ่มรูปอ้างอิง",
      insertTagHint: "พิมพ์ @ ในช่องข้อความ หรือคลิกที่ชิปเพื่อแทรกและชี้ดูรูปพรีวิว",
      separateLayers: "แยก 16 เลเยอร์ใส",
      thinkingMode: "โหมดคิดวิเคราะห์ (Thinking)",
      paintMask: "วาด Mask บนรูป",
      generateAudio: "สร้างเสียงซิงค์อัตโนมัติ",
      reusePrompt: "ใช้ค่านี้ซ้ำ",
      inspectLayers: "ดูเลเยอร์ที่แยกไว้ (16 ชั้น)",
    },
  },
  en: {
    nav: {
      home: "Home",
      omniStudio: "Omni-Studio",
      imageStudio: "Image Studio",
      videoStudio: "Video Studio",
      audioStudio: "Audio Studio",
      chatStudio: "AI Director",
      socialStudio: "Auto-Post",
      templates: "Ad Templates",
      history: "History",
      pricing: "Token Plans",
      apiVault: "API Vault",
    },
    home: {
      greetingMorning: "Good morning — what will you create with Neramit AI today?",
      greetingAfternoon: "Good afternoon — launch your next multi-stage ad pipeline.",
      greetingEvening: "Good evening — craft 4K visuals, cinema video, and voice in one flow.",
      subtitle:
        "Neramit AI — Flagship Unified Omni-Studio combining Tactile Glass + Neumorphism, Image → Video → Audio Pipeline Chaining, True @-Autocomplete Chip Editor, HTML5 Mask Painter, and Hybrid API Key Vault.",
      makeImage: "Image & 16-Layer Studio",
      makeImageDesc: "Generate 4K visuals, decompose 16 transparent layers, and paint live HTML5 inpaint masks",
      makeVideo: "Video & Motion Pipeline",
      makeVideoDesc: "Chain generated images directly into Seedance 2.5, OmniHuman 2.0, FLUX 3, and Gemini 4K",
      makeAudio: "Seed Audio & Voice Clone",
      makeAudioDesc: "Synthesize commercial voiceovers, clone voices with @Audio1, and sync SRT subtitles",
      makeChat: "AI Creative Director",
      makeChatDesc: "Multi-model creative director for ad storyboards, visual critique, and prompt crafting",
      trendingTemplates: "Commercial Video Templates (Hover to preview)",
      recentCreations: "Recent Pipeline Creations",
      viewAll: "View all",
    },
    studio: {
      promptPlaceholderImage:
        "Describe your visual... Type @ to autocomplete @img-1, @video-1, @Audio1 or roll an idea",
      promptPlaceholderVideo:
        "Describe camera movement & action... Type @ to reference @img-1 keyframes",
      rollIdea: "Roll Idea",
      enhancePrompt: "AI Enhance",
      generate: "Generate",
      generating: "Rendering...",
      referenceImages: "Reference Asset Tray (@img / Keyframes)",
      addReference: "Add Reference",
      insertTagHint: "Type @ in the editor or hover any @img-N chip to preview its thumbnail",
      separateLayers: "Separate 16 layers",
      thinkingMode: "Thinking mode",
      paintMask: "Paint Canvas Mask",
      generateAudio: "Synchronized audio",
      reusePrompt: "Reuse settings",
      inspectLayers: "Inspect 16 Layers",
    },
  },
};
