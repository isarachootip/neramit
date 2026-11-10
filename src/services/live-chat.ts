import { ResolvedProvider } from "../domain/provider-router";
import { StudioLocale } from "../domain/studio-types";

export interface DirectorChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface LiveChatParams {
  provider: ResolvedProvider;
  messages: DirectorChatHistoryItem[];
  locale: StudioLocale;
}

interface GeminiTextPart {
  text?: string;
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: GeminiTextPart[] } }>;
  error?: { message?: string };
}

interface OpenAiChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

const DIRECTOR_SYSTEM_PROMPT =
  "You are Neramit AI Creative Director (ผู้กำกับโฆษณาอัจฉริยะของ Neramit AI Omni-Studio). " +
  "Help users craft commercial ad scripts, storyboards, and production-ready prompts using @img-1, @video-1, and @Audio1 reference tags, " +
  "recommending Seedream 5 Pro (16-layer image), Seedance 2.5 (video with synced audio), and Seed Audio 1.0. Keep answers structured, concise, and inspiring.";

async function callGeminiChat(params: LiveChatParams): Promise<string> {
  const keyParam = encodeURIComponent(params.provider.apiKey);
  const contents = params.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: DIRECTOR_SYSTEM_PROMPT }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 900 },
  });

  let res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${keyParam}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(25000),
    }
  );

  if (!res.ok) {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keyParam}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(25000),
      }
    );
  }

  const json = (await res.json()) as GeminiResponse;
  if (!res.ok) {
    throw new Error(json.error?.message ?? `Gemini Chat API HTTP ${res.status}`);
  }

  const text = (json.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}

async function callOpenAiChat(params: LiveChatParams): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.provider.apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: DIRECTOR_SYSTEM_PROMPT },
        ...params.messages,
      ],
      temperature: 0.7,
      max_tokens: 900,
    }),
    signal: AbortSignal.timeout(35000),
  });

  const json = (await res.json()) as OpenAiChatResponse;
  if (!res.ok) {
    throw new Error(json.error?.message ?? `OpenAI Chat API HTTP ${res.status}`);
  }

  const text = json.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("OpenAI returned an empty chat completion");
  return text;
}

export async function generateLiveDirectorChat(params: LiveChatParams): Promise<string> {
  if (params.provider.provider === "gemini") return callGeminiChat(params);
  if (params.provider.provider === "openai") return callOpenAiChat(params);
  throw new Error("Unsupported live chat provider");
}
