import { pcm16Base64ToWavDataUrl, ResolvedProvider } from "../domain/provider-router";

export interface LiveAudioParams {
  provider: ResolvedProvider;
  script: string;
  voiceId: string;
  format: "mp3" | "wav" | "ogg_opus";
  speechRate: number;
}

interface GeminiAudioResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ inlineData?: { data?: string } }> };
  }>;
  error?: { message?: string };
}

export async function generateLiveSpeechAudio(params: LiveAudioParams): Promise<string> {
  if (params.provider.provider === "openai") {
    const voiceMap: Record<string, string> = {
      "th-female-nicha": "nova",
      "th-male-kavin": "onyx",
      "en-female-aria": "shimmer",
      "en-male-marcus": "echo",
    };
    const responseFormat =
      params.format === "wav" ? "wav" : params.format === "ogg_opus" ? "opus" : "mp3";
    const speed = Math.min(2.0, Math.max(0.5, 1 + params.speechRate / 100));

    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.provider.apiKey}`,
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: voiceMap[params.voiceId] ?? "nova",
        input: params.script,
        response_format: responseFormat,
        speed,
      }),
      signal: AbortSignal.timeout(35000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI TTS HTTP ${res.status}: ${errText.slice(0, 140)}`);
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const mime =
      responseFormat === "wav"
        ? "audio/wav"
        : responseFormat === "opus"
        ? "audio/ogg"
        : "audio/mpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  }

  if (params.provider.provider === "gemini") {
    const geminiVoiceMap: Record<string, string> = {
      "th-female-nicha": "Kore",
      "th-male-kavin": "Puck",
      "en-female-aria": "Aoede",
      "en-male-marcus": "Charon",
    };
    const keyParam = encodeURIComponent(params.provider.apiKey);
    const ttsBody = JSON.stringify({
      contents: [{ parts: [{ text: params.script }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: geminiVoiceMap[params.voiceId] ?? "Kore",
            },
          },
        },
      },
    });
    let res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-lite-tts:generateContent?key=${keyParam}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: ttsBody,
        signal: AbortSignal.timeout(30000),
      }
    );
    if (!res.ok) {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${keyParam}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: ttsBody,
          signal: AbortSignal.timeout(30000),
        }
      );
    }

    const json = (await res.json()) as GeminiAudioResponse;
    if (!res.ok) {
      throw new Error(json.error?.message ?? `Gemini TTS HTTP ${res.status}`);
    }
    const pcmBase64 = json.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!pcmBase64) throw new Error("Gemini TTS returned no inline audio bytes");
    return pcm16Base64ToWavDataUrl(pcmBase64, 24000);
  }

  throw new Error("Unsupported live audio provider");
}
