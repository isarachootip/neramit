import { mergeVaultWithServerEnv, resolveChatProvider } from "../domain/provider-router";
import {
  PlatformCopyVariantSchema,
  SOCIAL_CHANNELS,
  SocialCopyVariantsMap,
  SocialMediaKind,
} from "../domain/social-types";
import { StudioLocale } from "../domain/studio-types";

export interface CopywriterInput {
  topicIntro: string;
  mediaUrl?: string;
  mediaKind: SocialMediaKind;
  brandName: string;
  voiceTone: string;
  locale: StudioLocale;
  vault?: unknown;
}

interface GeminiJsonResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
}

interface OpenAiJsonResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

function buildFallbackVariants(input: CopywriterInput): SocialCopyVariantsMap {
  const core = input.topicIntro.trim() || `${input.brandName} คอลเลกชันใหม่ล่าสุด`;
  const tagBrand = `#${input.brandName.replace(/\s+/g, "")}`;
  if (input.locale === "en") {
    return {
      x: { caption: `${core.slice(0, 190)} ✨ Crafted for modern creators.`, hashtags: [tagBrand, "#NeramitAI"] },
      facebook: {
        caption: `Discover ${input.brandName}: ${core}\n\nDesigned with ${input.voiceTone} energy to elevate your everyday moments.`,
        hashtags: [tagBrand, "#NeramitAI", "#NewLaunch"],
        callToAction: "Message us or tap the link to explore!",
      },
      instagram: { caption: `Stop scrolling ✨ ${core} — drop a 🔥 if you love this vibe!`, hashtags: [tagBrand, "#Reels", "#Aesthetic", "#NeramitAI"] },
      youtube: { title: `${core.slice(0, 70)} | ${input.brandName} #Shorts`, caption: `${core}\n\nPowered by ${input.brandName}.`, hashtags: ["Shorts", input.brandName, "NeramitAI"] },
      tiktok: { caption: `Wait for the reveal 🔥 ${core}`, hashtags: ["#fyp", "#viral", tagBrand, "#NeramitAI"] },
      line: { caption: `✨ Exclusive for LINE friends! ${core}`, hashtags: [tagBrand], callToAction: "Reply to this chat to claim your offer" },
      linkedin: { caption: `Excited to share how ${input.brandName} is innovating with ${core}. Built with a ${input.voiceTone} approach.`, hashtags: [tagBrand, "#Innovation", "#NeramitAI"] },
      threads: { caption: `${core} — thoughts on this new drop? 👇✨`, hashtags: [tagBrand, "#NeramitAI"] },
      telegram: { caption: `🚀 [${input.brandName} Broadcast]\n${core}\nTap below for full media & early access.`, hashtags: [tagBrand, "#NeramitAI"] },
    };
  }
  return {
    x: { caption: `${core.slice(0, 190)} ✨ โทน ${input.voiceTone} ที่สายครีเอทีฟห้ามพลาด!`, hashtags: [tagBrand, "#NeramitAI"] },
    facebook: {
      caption: `✨ ${input.brandName} ขอแนะนำ: ${core}\n\nถ่ายทอดเอกลักษณ์สไตล์ ${input.voiceTone} ตอบโจทย์ทุกไลฟ์สไตล์ยุคใหม่อย่างลงตัว`,
      hashtags: [tagBrand, "#NeramitAI", "#เปิดตัวสินค้าใหม่"],
      callToAction: "ทักแชตหรือคลิกลิงก์หน้าโปรไฟล์เพื่อสั่งซื้อได้เลย!",
    },
    instagram: { caption: `หยุดดูช็อตนี้ก่อน! ✨ ${core} ใครชอบมู้ดนี้กดหัวใจไว้เลย 💜`, hashtags: [tagBrand, "#IGReels", "#ไอเดียถ่ายรูป", "#NeramitAI"] },
    youtube: { title: `${core.slice(0, 70)} | ${input.brandName} Shorts`, caption: `${core} — รับชมเบื้องหลังและดีเทลเต็มๆ จาก ${input.brandName}`, hashtags: ["Shorts", input.brandName, "NeramitAI"] },
    tiktok: { caption: `ดูให้จบ! 🔥 ${core} สวยจึ้งเกินต้านมาก ✨`, hashtags: ["#fyp", "#ขึ้นฟีดเถอะ", tagBrand, "#NeramitAI"] },
    line: { caption: `💚 สิทธิพิเศษเฉพาะเพื่อนใน LINE OA จาก ${input.brandName}: ${core}`, hashtags: [tagBrand], callToAction: "กดสั่งซื้อหรือทักแชตแอดมินรับโค้ดส่วนลดทันที!" },
    linkedin: { caption: `เบื้องหลังการยกระดับแบรนด์ ${input.brandName} ด้วยแนวคิด ${core} ในโทน ${input.voiceTone} เพื่อสร้างประสบการณ์ใหม่ให้ลูกค้ายุคดิจิทัล`, hashtags: [tagBrand, "#DigitalTransformation", "#NeramitAI"] },
    threads: { caption: `แวะมาป้ายยา ${core} ✨ เพื่อนๆ ชาว Threads ให้คะแนนลุคนี้เต็มสิบเท่าไหร่ดี? 👇`, hashtags: [tagBrand, "#NeramitAI"] },
    telegram: { caption: `📣 อัปเดตด่วนเข้าคอมมูนิตี้ ${input.brandName}!\n${core}\nดูรายละเอียดและไฟล์ต้นฉบับด้านบนได้เลย`, hashtags: [tagBrand, "#NeramitAI"] },
  };
}

function normalizeParsedVariants(raw: unknown, fallback: SocialCopyVariantsMap): SocialCopyVariantsMap {
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;
  const result = { ...fallback };
  for (const meta of SOCIAL_CHANNELS) {
    const parsed = PlatformCopyVariantSchema.safeParse(obj[meta.id]);
    if (parsed.success) result[meta.id] = parsed.data;
  }
  return result;
}

export async function generateMultimodalSocialCopy(
  input: CopywriterInput
): Promise<{ variants: SocialCopyVariantsMap; providerUsed: string }> {
  const fallback = buildFallbackVariants(input);
  const vault = mergeVaultWithServerEnv(input.vault);
  const resolved = resolveChatProvider("neramit/gemini-omni-flash-1-1", vault);

  if (resolved.provider === "simulation") {
    await new Promise((r) => setTimeout(r, 380));
    return { variants: fallback, providerUsed: "Simulation · Neramit 9-Channel Copywriter" };
  }

  const promptText =
    `Brand: "${input.brandName}" (Tone: ${input.voiceTone}). Locale: ${input.locale}.\n` +
    `Topic/Intro: "${input.topicIntro || "Analyze the attached visual asset and write high-converting social posts"}".\n` +
    `Return ONLY valid JSON with keys "x", "facebook", "instagram", "youtube", "tiktok", "line", "linkedin", "threads", "telegram". ` +
    `Each key maps to { "title"?: string, "caption": string, "hashtags": string[], "callToAction"?: string }.`;

  if (resolved.provider === "gemini") {
    const parts: Array<Record<string, unknown>> = [{ text: promptText }];
    if (input.mediaKind === "image" && input.mediaUrl?.startsWith("data:image/")) {
      const m = input.mediaUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (m) parts.unshift({ inlineData: { mimeType: m[1], data: m[2] } });
    }
    const keyParam = encodeURIComponent(resolved.apiKey);
    let res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keyParam}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: "application/json" } }),
        signal: AbortSignal.timeout(35000),
      }
    );
    if (res.status === 404) {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keyParam}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: "application/json" } }),
          signal: AbortSignal.timeout(35000),
        }
      );
    }
    const json = (await res.json()) as GeminiJsonResponse;
    if (!res.ok) throw new Error(json.error?.message ?? `Gemini Copywriter HTTP ${res.status}`);
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    return { variants: normalizeParsedVariants(JSON.parse(rawText), fallback), providerUsed: "Live · Gemini Multimodal Vision (9 Channels)" };
  }

  const userContent: Array<Record<string, unknown>> = [{ type: "text", text: promptText }];
  if (input.mediaKind === "image" && input.mediaUrl && (input.mediaUrl.startsWith("https://") || input.mediaUrl.startsWith("data:image/"))) {
    userContent.push({ type: "image_url", image_url: { url: input.mediaUrl } });
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${resolved.apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: userContent }],
    }),
    signal: AbortSignal.timeout(35000),
  });
  const json = (await res.json()) as OpenAiJsonResponse;
  if (!res.ok) throw new Error(json.error?.message ?? `OpenAI Copywriter HTTP ${res.status}`);
  const rawText = json.choices?.[0]?.message?.content ?? "{}";
  return { variants: normalizeParsedVariants(JSON.parse(rawText), fallback), providerUsed: "Live · OpenAI Vision Copywriter (9 Channels)" };
}
