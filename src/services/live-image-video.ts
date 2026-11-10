import { ResolvedProvider } from "../domain/provider-router";

export interface LiveImageParams {
  provider: ResolvedProvider;
  prompt: string;
  aspectRatio: string;
  count: number;
}

export interface LiveVideoParams {
  provider: ResolvedProvider;
  prompt: string;
  aspectRatio: string;
  referenceImageUrl?: string;
}

interface GeminiInlinePart {
  inlineData?: { mimeType?: string; data?: string };
}

interface GeminiGenerateResponse {
  candidates?: Array<{ content?: { parts?: GeminiInlinePart[] } }>;
  error?: { message?: string };
}

interface ImagenPredictResponse {
  predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
  error?: { message?: string };
}

interface OpenAiImageResponse {
  data?: Array<{ url?: string; b64_json?: string }>;
  error?: { message?: string };
}

interface FalImageResponse {
  images?: Array<{ url?: string }>;
  detail?: string;
}

interface FalVideoResponse {
  video?: { url?: string };
  detail?: string;
}

async function callGeminiImage(params: LiveImageParams): Promise<string[]> {
  const keyParam = encodeURIComponent(params.provider.apiKey);
  const flashUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${keyParam}`;

  const res = await fetch(flashUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Generate a high-resolution image (${params.aspectRatio}): ${params.prompt}` }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (res.status === 404) {
    const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${keyParam}`;
    const imgRes = await fetch(imagenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: params.prompt }],
        parameters: { sampleCount: Math.min(4, params.count) },
      }),
      signal: AbortSignal.timeout(45000),
    });
    const imgJson = (await imgRes.json()) as ImagenPredictResponse;
    if (!imgRes.ok) {
      throw new Error(imgJson.error?.message ?? `Gemini Imagen HTTP ${imgRes.status}`);
    }
    const urls = (imgJson.predictions ?? [])
      .filter((p) => Boolean(p.bytesBase64Encoded))
      .map((p) => `data:${p.mimeType ?? "image/png"};base64,${p.bytesBase64Encoded}`);
    if (urls.length === 0) throw new Error("Gemini Imagen returned no image bytes");
    return urls;
  }

  const json = (await res.json()) as GeminiGenerateResponse;
  if (!res.ok) {
    throw new Error(json.error?.message ?? `Gemini Image API HTTP ${res.status}`);
  }

  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const images = parts
    .filter((p) => Boolean(p.inlineData?.data))
    .map((p) => `data:${p.inlineData?.mimeType ?? "image/png"};base64,${p.inlineData?.data}`);

  if (images.length === 0) {
    throw new Error("Gemini model returned text without an inline image");
  }
  return images;
}

async function callOpenAiImage(params: LiveImageParams): Promise<string[]> {
  const size =
    params.aspectRatio === "16:9" || params.aspectRatio === "21:9"
      ? "1792x1024"
      : params.aspectRatio === "9:16" || params.aspectRatio === "3:4"
      ? "1024x1792"
      : "1024x1024";

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.provider.apiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: params.prompt.slice(0, 4000),
      n: 1,
      size,
      response_format: "url",
    }),
    signal: AbortSignal.timeout(45000),
  });

  const json = (await res.json()) as OpenAiImageResponse;
  if (!res.ok) {
    throw new Error(json.error?.message ?? `OpenAI Image API HTTP ${res.status}`);
  }

  const urls = (json.data ?? []).map((d) => d.url ?? "").filter(Boolean);
  if (urls.length === 0) throw new Error("OpenAI returned an empty image list");
  return urls;
}

async function callFalImage(params: LiveImageParams): Promise<string[]> {
  const imageSize =
    params.aspectRatio === "16:9" || params.aspectRatio === "21:9"
      ? "landscape_16_9"
      : params.aspectRatio === "9:16"
      ? "portrait_16_9"
      : "square_hd";

  const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${params.provider.apiKey}`,
    },
    body: JSON.stringify({
      prompt: params.prompt,
      image_size: imageSize,
      num_images: Math.min(4, params.count),
    }),
    signal: AbortSignal.timeout(45000),
  });

  const json = (await res.json()) as FalImageResponse;
  if (!res.ok) {
    throw new Error(json.detail ?? `Fal.ai Image API HTTP ${res.status}`);
  }

  const urls = (json.images ?? []).map((img) => img.url ?? "").filter(Boolean);
  if (urls.length === 0) throw new Error("Fal.ai returned no generated images");
  return urls;
}

export async function generateLiveImage(params: LiveImageParams): Promise<string[]> {
  if (params.provider.provider === "gemini") return callGeminiImage(params);
  if (params.provider.provider === "openai") return callOpenAiImage(params);
  if (params.provider.provider === "fal") return callFalImage(params);
  throw new Error("Unsupported live image provider");
}

export async function generateLiveVideo(params: LiveVideoParams): Promise<string> {
  const hasPublicRef = Boolean(params.referenceImageUrl?.startsWith("https://"));
  const endpoint = hasPublicRef
    ? "https://fal.run/fal-ai/ltx-video/image-to-video"
    : "https://fal.run/fal-ai/ltx-video";

  const payload: Record<string, unknown> = hasPublicRef
    ? { prompt: params.prompt, image_url: params.referenceImageUrl }
    : { prompt: params.prompt, aspect_ratio: params.aspectRatio === "9:16" ? "9:16" : "16:9" };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${params.provider.apiKey}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(55000),
  });

  const json = (await res.json()) as FalVideoResponse;
  if (!res.ok || !json.video?.url) {
    throw new Error(json.detail ?? `Fal.ai Video API HTTP ${res.status}`);
  }
  return json.video.url;
}
