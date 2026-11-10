import { NextResponse } from "next/server";
import { z } from "zod";
import {
  mergeVaultWithServerEnv,
  resolveChatProvider,
} from "@/domain/provider-router";
import { generateLiveDirectorChat } from "@/services/live-chat";

const ChatApiRequestSchema = z.object({
  modelAlias: z.string().min(1).default("neramit/glm-5-3-flash"),
  locale: z.enum(["th", "en"]).default("th"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(8000),
      })
    )
    .min(1)
    .max(30),
  vault: z.unknown().optional(),
});

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as unknown;
    const parsed = ChatApiRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid chat request", refunded: true },
        { status: 400 }
      );
    }

    const { modelAlias, locale, messages, vault: rawVault } = parsed.data;
    const vault = mergeVaultWithServerEnv(rawVault);
    const resolved = resolveChatProvider(modelAlias, vault);

    if (resolved.provider !== "simulation") {
      try {
        const reply = await generateLiveDirectorChat({
          provider: resolved,
          messages,
          locale,
        });
        return NextResponse.json({ reply, providerUsed: resolved.label });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Live chat API error";
        return NextResponse.json(
          { error: `${resolved.label} Error: ${msg} — Tokens Refunded`, refunded: true },
          { status: 502 }
        );
      }
    }

    const lastPrompt = messages[messages.length - 1]?.content ?? "";
    await new Promise((r) => setTimeout(r, 350));

    const reply =
      locale === "th"
        ? `สำหรับการสร้าง **"${lastPrompt}"** แนะนำโครงสร้างแคมเปญบน **Neramit AI Omni-Studio**:\n\n- **Stage 1 · Image (\`Seedream 5 Pro\`)**: เจนภาพสินค้าหลักพร้อมเปิด \`16 Layers\` เพื่อแยกพื้นหลังใส\n- **Stage 2 · Video (\`Seedance 2.5\`)**: กดปุ่ม *Chain to Video I2V* ส่ง \`@img-1\` มาสร้างช็อตหมุนกล้อง 7 วินาที\n- **Rich Prompt**: \`"${lastPrompt} @img-1 — shot on 35mm Kodak Vision3, studio rim light, 8K commercial clarity"\`\n\n*(หมายเหตุ: ขณะนี้ทำงานในโหมด Simulation — ใส่คีย์ Gemini หรือ OpenAI ในปุ่ม API Vault เพื่อคุยกับ AI จริงได้ทันที)*`
        : `Here is a **Neramit AI** creative storyboard for **"${lastPrompt}"**:\n\n- **Stage 1 · Image (\`Seedream 5 Pro\`)**: Generate your hero packshot with \`16 Transparent Layers\`\n- **Stage 2 · Video (\`Seedance 2.5\`)**: Click *Chain to Video I2V* using \`@img-1\`\n- **Rich Prompt**: \`"${lastPrompt} @img-1 — 35mm anamorphic lens, soft volumetric key light, crisp commercial packshot"\`\n\n*(Simulation Mode — add a Gemini or OpenAI key in API Vault for live LLM responses)*`;

    return NextResponse.json({ reply, providerUsed: resolved.label });
  } catch {
    return NextResponse.json(
      { error: "Failed to process chat message", refunded: true },
      { status: 500 }
    );
  }
}
