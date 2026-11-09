import { StudioLocale } from "./studio-types";

export interface I18nStrings {
  nav: {
    home: string;
    imageStudio: string;
    videoStudio: string;
    audioStudio: string;
    chatStudio: string;
    templates: string;
    history: string;
    pricing: string;
    topUp: string;
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
      imageStudio: "สร้างรูปภาพ",
      videoStudio: "สร้างวิดีโอ",
      audioStudio: "สร้างเสียงพูด",
      chatStudio: "แชตสตูดิโอ",
      templates: "เทมเพลตโฆษณา",
      history: "คลังผลงาน",
      pricing: "แพ็กเกจ & ราคา",
      topUp: "เติม Token",
    },
    home: {
      greetingMorning: "สวัสดีตอนเช้า วันนี้ต้องการเนรมิตงานชิ้นไหนดีครับ?",
      greetingAfternoon: "สวัสดีตอนบ่าย เริ่มต้นสร้างสรรค์แคมเปญใหม่กันเลย",
      greetingEvening: "สวัสดีตอนค่ำ ให้ AI ช่วยเสกไอเดียของคุณให้เป็นจริง",
      subtitle:
        "GenWhy × Mantra AI Creative Suite — รวมโมเดลภาพ 4K วิดีโอโฆษณาพร้อมเสียง แยกเลเยอร์ใส 16 ชั้น และ Rich Prompt Editor (@img-1)",
      makeImage: "Make an Image",
      makeImageDesc: "Seedream 5 Pro, Nano Banana 2.1, GPT Image 2.5 Flare พร้อมวาด Mask และแยก 16 เลเยอร์",
      makeVideo: "Make a Video",
      makeVideoDesc: "Seedance 2.5, OmniHuman 2.0, FLUX 3, Gemini Omni 4K พร้อมเสียงประกอบอัตโนมัติ",
      makeAudio: "Make Speech (Seed Audio)",
      makeAudioDesc: "สร้างเสียงพากย์โฆษณาไทย/อังกฤษ โคลนเสียง @Audio1 พร้อมซับไตเติลซิงค์เวลา",
      makeChat: "Chat Studio",
      makeChatDesc: "ผู้ช่วยคิดสคริปต์โฆษณา วิเคราะห์ภาพสินค้า และวางสตอรี่บอร์ดแบบสตรีมมิ่ง",
      trendingTemplates: "เทมเพลตวิดีโอโฆษณายอดนิยม (Hover เพื่อดูตัวอย่าง)",
      recentCreations: "ผลงานล่าสุดของคุณ",
      viewAll: "ดูทั้งหมด",
    },
    studio: {
      promptPlaceholderImage:
        "บรรยายภาพที่ต้องการ... คลิกชิป @img-1 เพื่ออ้างอิงภาพสินค้า หรือกดปุ่มสุ่มไอเดีย",
      promptPlaceholderVideo:
        "บรรยายการเคลื่อนไหว มุมกล้อง และจังหวะของวิดีโอ... อ้างอิงภาพด้วย @img-1",
      rollIdea: "สุ่มไอเดีย Prompt",
      enhancePrompt: "อัปเกรด Prompt ด้วย AI",
      generate: "สร้างผลงาน",
      generating: "กำลังประมวลผล...",
      referenceImages: "ภาพอ้างอิง & เฟรมต้นแบบ",
      addReference: "เพิ่มภาพอ้างอิง",
      insertTagHint: "คลิกที่ป้าย @img-N เพื่อแทรกตำแหน่งอ้างอิงลงใน Prompt",
      separateLayers: "แยก 16 เลเยอร์พื้นหลังใส (Seedream 5 Pro)",
      thinkingMode: "โหมดคิดวิเคราะห์ก่อนวาด (Thinking)",
      paintMask: "ระบาย Mask จุดที่ต้องการแก้",
      generateAudio: "สร้างเสียงประกอบซิงค์อัตโนมัติ",
      reusePrompt: "ใช้ค่านี้ซ้ำ",
      inspectLayers: "ดูเลเยอร์ที่แยกไว้ (16 ชั้น)",
    },
  },
  en: {
    nav: {
      home: "Home",
      imageStudio: "Image Studio",
      videoStudio: "Video Studio",
      audioStudio: "Audio Studio",
      chatStudio: "Chat Studio",
      templates: "Ad Templates",
      history: "History",
      pricing: "Pricing",
      topUp: "Top Up",
    },
    home: {
      greetingMorning: "Good morning — what will you create today?",
      greetingAfternoon: "Good afternoon — ready for your next campaign?",
      greetingEvening: "Good evening — bring your creative vision to life.",
      subtitle:
        "GenWhy × Mantra AI Creative Suite — 20 frontier Image & Video models, 16-layer decomposition, and Rich @img Pill Composer.",
      makeImage: "Make an Image",
      makeImageDesc: "Seedream 5 Pro, Nano Banana 2.1, GPT Image 2.5 Flare with Mask painting & 16 layers",
      makeVideo: "Make a Video",
      makeVideoDesc: "Seedance 2.5, OmniHuman 2.0, FLUX 3, Gemini Omni 4K with synchronized native sound",
      makeAudio: "Make Speech (Seed Audio)",
      makeAudioDesc: "Generate studio voiceovers, clone voices with @Audio1 tags, and export SRT subtitles",
      makeChat: "Chat Studio",
      makeChatDesc: "Multi-model creative director for ad scripts, visual analysis, and storyboards",
      trendingTemplates: "Trending Commercial Video Templates (Hover to preview)",
      recentCreations: "Your Recent Creations",
      viewAll: "View all",
    },
    studio: {
      promptPlaceholderImage:
        "Describe your image... Click @img-1 chips to reference uploaded products or roll an idea",
      promptPlaceholderVideo:
        "Describe camera motion, subject action, and mood... Reference frames with @img-1",
      rollIdea: "Roll prompt idea",
      enhancePrompt: "AI Enhance",
      generate: "Generate",
      generating: "Rendering...",
      referenceImages: "Reference Images & Keyframes",
      addReference: "Add Reference",
      insertTagHint: "Click any @img-N badge to insert a reference pill into your prompt",
      separateLayers: "Separate 16 transparent layers",
      thinkingMode: "Thinking reasoning mode",
      paintMask: "Paint inpainting mask",
      generateAudio: "Generate synchronized audio",
      reusePrompt: "Reuse settings",
      inspectLayers: "Inspect 16 Layers",
    },
  },
};
