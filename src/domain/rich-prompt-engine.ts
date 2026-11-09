import { StudioLocale } from "./studio-types";

export interface PromptPresetOption {
  id: string;
  labelEn: string;
  labelTh: string;
  directive: string;
}

export const PROMPT_STYLE_PRESETS: PromptPresetOption[] = [
  {
    id: "cinematic-35mm",
    labelEn: "35mm Cinema",
    labelTh: "ฟิล์ม 35mm ซีเนมาติก",
    directive: "shot on 35mm Kodak Vision3 film, shallow depth of field, warm rim lighting, subtle halation",
  },
  {
    id: "studio-product",
    labelEn: "Luxury Packshot",
    labelTh: "สตูดิโอสินค้าพรีเมียม",
    directive: "commercial studio packshot, softbox key light, crisp reflections on wet obsidian surface, 8K clarity",
  },
  {
    id: "korean-soda",
    labelEn: "K-Pop Soda Ad",
    labelTh: "โฆษณาสดใสสไตล์เกาหลี",
    directive: "pastel daylight, high-speed water droplets, vibrant pop color grading, crisp commercial look",
  },
  {
    id: "cyber-neon",
    labelEn: "Bangkok Neon Noir",
    labelTh: "นีออนไซเบอร์พังก์",
    directive: "anamorphic lens flare, rain-slicked neon reflections, teal and magenta volumetric fog",
  },
  {
    id: "editorial-fashion",
    labelEn: "Vogue Editorial",
    labelTh: "แฟชั่นรันเวย์ไฮเอนด์",
    directive: "high-fashion editorial photography, medium format Hasselblad, dramatic chiaroscuro studio lighting",
  },
];

const IMAGE_PROMPT_IDEAS: Record<StudioLocale, string[]> = {
  th: [
    "ขวดน้ำหอมคริสตัลวางบนหินอ่อนสีดำเปียกน้ำ แสงแดดยามเช้าส่องผ่านม่านหมอก ชัดลึกระดับโฆษณา 35mm",
    "กาแฟลาเต้อาร์ตลายทิวลิปในแก้วเซรามิกทำมือ วางบนโต๊ะไม้โอ๊คข้างหน้าต่างที่มีแสงแดดอุ่นๆ",
    "รองเท้าสนีกเกอร์สีเงินเมทัลลิกกำลังลอยตัวกลางอากาศ รายล้อมด้วยละอองน้ำและแสงนีออนสีม่วง-ฟ้า",
    "นางแบบสวมชุดสูทผ้าไหมสีเขียวมรกต ยืนโพสต์ท่ากลางโถงพิพิธภัณฑ์โมเดิร์น แสงธรรมชาติส่องเฉียง",
  ],
  en: [
    "A sculpted crystal perfume bottle on wet obsidian stone, golden morning light rays, 35mm commercial macro",
    "A ceramic cup of matcha latte with intricate microfoam on a sunlit travertine table, Kodak Portra 400",
    "Futuristic silver runner sneaker suspended mid-air with kinetic water splashes and violet studio rim light",
    "Editorial fashion portrait in an emerald silk trench coat inside a brutalist concrete gallery, soft skylight",
  ],
};

const VIDEO_PROMPT_IDEAS: Record<StudioLocale, string[]> = {
  th: [
    "กล้องแพนช้าๆ รอบขวดเซรั่มสีทองท่ามกลางหยดน้ำลอยตัวในอากาศ แสงแฟลร์นุ่มนวลระดับโฆษณาทีวี",
    "นางแบบแฟชั่นหมุนตัวกลางสี่แยกชิบูย่ายามค่ำคืน ชุดเปลี่ยนสีตามจังหวะไฟนีออน ช็อตเดียวไม่ตัด",
    "เรือกระดาษล่องไปตามถนนหลังฝนตกที่สะท้อนแสงไฟนีออน กล้องเคลื่อนตัวตามระดับผิวน้ำอย่างนุ่มนวล",
    "ช็อตโคลสอัพเทน้ำอัดลมลงในแก้วน้ำแข็ง ฟองโซดาแตกตัวสดชื่นพร้อมแสงแดดฤดูร้อนส่องกระทบ",
  ],
  en: [
    "Slow orbital dolly shot around a golden serum bottle as water droplets float in zero gravity, warm lens flare",
    "Single-take fashion spin in a rain-slicked neon alley, outfit morphing colors seamlessly at 24fps",
    "A paper boat drifting down a rain-flooded street reflecting city lights, low-angle tracking shot",
    "High-speed macro pour of sparkling citrus soda over crystal ice cubes in bright summer sunlight",
  ],
};

const TAG_REGEX = /@(?:img-\d+|Image\d+|video-\d+|audio-\d+|Audio\d+)/g;

export function extractReferenceTags(prompt: string): string[] {
  const matches = prompt.match(TAG_REGEX);
  if (!matches) return [];
  return Array.from(new Set(matches));
}

export function insertReferenceTag(prompt: string, tag: string): string {
  const trimmed = prompt.trimEnd();
  if (!trimmed) {
    return `${tag} `;
  }
  return `${trimmed} ${tag} `;
}

export function syncPromptWithReferences(prompt: string, activeImageCount: number): string {
  return prompt
    .replace(/@(?:img-|Image)(\d+)/g, (fullMatch, numStr: string) => {
      const idx = Number.parseInt(numStr, 10);
      return idx >= 1 && idx <= activeImageCount ? fullMatch : "";
    })
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function enhanceCreativePrompt(prompt: string, presetId?: string): string {
  const base = prompt.trim();
  const preset =
    PROMPT_STYLE_PRESETS.find((p) => p.id === presetId) ?? PROMPT_STYLE_PRESETS[0];

  if (!base) {
    return preset.directive;
  }
  if (base.toLowerCase().includes(preset.directive.slice(0, 18).toLowerCase())) {
    return base;
  }
  return `${base} — ${preset.directive}`;
}

export function rollPromptIdea(
  kind: "image" | "video",
  locale: StudioLocale,
  currentPrompt?: string
): string {
  const pool = kind === "video" ? VIDEO_PROMPT_IDEAS[locale] : IMAGE_PROMPT_IDEAS[locale];
  const candidates = pool.filter((item) => item !== currentPrompt);
  const list = candidates.length > 0 ? candidates : pool;
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex] ?? pool[0];
}
