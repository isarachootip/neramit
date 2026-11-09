"use client";

import React, { useEffect, useState } from "react";
import { Bot, Coins, MessageSquarePlus, Send, Sparkles, User } from "lucide-react";
import { ChatConversation, ChatTurnMessage } from "@/domain/studio-types";
import { useAppPreferences } from "@/hooks/use-app-preferences";
import { loadChatConversations, saveChatConversations } from "@/repositories/studio-storage";

const CHAT_MODELS = [
  { alias: "genwhy/glm-5-3-flash", title: "GLM 5.3 Flash (Fast Creative)" },
  { alias: "genwhy/seed-2-0-lite", title: "Seed 2.0 Lite (ByteDance Storyboard)" },
  { alias: "genwhy/gemini-omni-flash-1-1", title: "Gemini Omni Flash 1.1 (Multimodal)" },
];

export function ChatStudioView() {
  const { locale, spendTokens } = useAppPreferences();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<string>("chat-seed-1");
  const [modelAlias, setModelAlias] = useState<string>(CHAT_MODELS[0].alias);
  const [draft, setDraft] = useState<string>("");
  const [streamingText, setStreamingText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  useEffect(() => {
    const loaded = loadChatConversations();
    setConversations(loaded);
    if (loaded[0]) setActiveId(loaded[0].id);
  }, []);

  const activeConv = conversations.find((c) => c.id === activeId) ?? conversations[0];

  const handleNewChat = () => {
    const fresh: ChatConversation = {
      id: `chat-${Date.now()}`,
      title: locale === "th" ? "บทสนทนาแคมเปญใหม่" : "New Creative Session",
      modelAlias,
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    const next = [fresh, ...conversations];
    setConversations(next);
    saveChatConversations(next);
    setActiveId(fresh.id);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || isStreaming || !activeConv || !spendTokens(6)) return;

    const userPrompt = draft.trim();
    const userMsg: ChatTurnMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: userPrompt,
      createdAt: new Date().toISOString(),
    };

    setDraft("");
    setIsStreaming(true);

    const updatedWithUser = conversations.map((c) =>
      c.id === activeConv.id
        ? {
            ...c,
            title: c.messages.length === 0 ? userPrompt.slice(0, 36) : c.title,
            updatedAt: new Date().toISOString(),
            messages: [...c.messages, userMsg],
          }
        : c
    );
    setConversations(updatedWithUser);

    const replyFull =
      locale === "th"
        ? `สำหรับการสร้าง **"${userPrompt}"** แนะนำโครงสร้าง Prompt แบบผสมผสาน GenWhy × Mantra:\n\n- **Model**: ใช้ \`Seedream 5 Pro\` (สำหรับภาพนิ่งแยก 16 เลเยอร์) หรือ \`Seedance 2.5\` (สำหรับวิดีโอพร้อมเสียง)\n- **Rich Prompt**: \`"${userPrompt} @img-1 — shot on 35mm Kodak Vision3, studio rim light, 8K commercial clarity"\``
        : `Here is a production-ready creative direction for **"${userPrompt}"**:\n\n- **Recommended Model**: \`Seedance 2.5\` (Video) or \`Seedream 5 Pro\` (16-Layer Image)\n- **Rich Prompt**: \`"${userPrompt} @img-1 — 35mm anamorphic lens, soft volumetric key light, crisp commercial packshot"\``;

    for (let i = 1; i <= replyFull.length; i += 14) {
      setStreamingText(replyFull.slice(0, i));
      await new Promise((r) => setTimeout(r, 25));
    }

    const assistantMsg: ChatTurnMessage = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: replyFull,
      createdAt: new Date().toISOString(),
      modelAlias,
      tokensCharged: 6,
    };

    const finalConvs = updatedWithUser.map((c) =>
      c.id === activeConv.id
        ? { ...c, updatedAt: new Date().toISOString(), messages: [...c.messages, assistantMsg] }
        : c
    );
    setConversations(finalConvs);
    saveChatConversations(finalConvs);
    setStreamingText("");
    setIsStreaming(false);
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 px-4 py-6 lg:grid-cols-12">
      <aside className="neu-raised flex flex-col gap-3 rounded-3xl p-4 lg:col-span-4">
        <button type="button" onClick={handleNewChat} className="neu-tint-primary flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-extrabold">
          <MessageSquarePlus className="size-4" />
          <span>{locale === "th" ? "เริ่มแชตแคมเปญใหม่" : "New Creative Chat"}</span>
        </button>

        <div className="flex flex-col gap-1.5">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              type="button"
              onClick={() => setActiveId(conv.id)}
              className={`flex flex-col items-start gap-0.5 rounded-2xl p-3 text-left text-xs ${
                conv.id === activeConv?.id ? "neu-pressed font-bold" : "neu-flat"
              }`}
            >
              <span className="line-clamp-1">{conv.title}</span>
              <span className="text-[10px] text-[var(--muted-foreground)]">{conv.messages.length} messages</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="neu-raised flex min-h-[540px] flex-col justify-between gap-4 rounded-3xl p-4 sm:p-5 lg:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-violet-400" />
            <span className="text-sm font-extrabold">{activeConv?.title}</span>
          </div>
          <select value={modelAlias} onChange={(e) => setModelAlias(e.target.value)} className="neu-pressed rounded-xl px-3 py-1.5 text-xs font-semibold bg-[var(--surface)]">
            {CHAT_MODELS.map((m) => (
              <option key={m.alias} value={m.alias}>{m.title}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto py-2">
          {activeConv?.messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <span className="neu-tint-primary grid size-8 shrink-0 place-items-center rounded-xl">
                  <Bot className="size-4" />
                </span>
              )}
              <div className={`max-w-[82%] rounded-2xl p-3.5 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${msg.role === "user" ? "neu-tint-primary" : "neu-pressed"}`}>
                {msg.content}
                {msg.tokensCharged && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] opacity-75">
                    <Coins className="size-3 text-amber-400" />
                    <span>{msg.tokensCharged} Tokens</span>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <span className="neu-pressed grid size-8 shrink-0 place-items-center rounded-xl">
                  <User className="size-4" />
                </span>
              )}
            </div>
          ))}

          {isStreaming && (
            <div className="flex gap-2.5">
              <span className="neu-tint-primary grid size-8 shrink-0 place-items-center rounded-xl">
                <Bot className="size-4 animate-pulse" />
              </span>
              <div className="neu-pressed max-w-[82%] rounded-2xl p-3.5 text-xs sm:text-sm whitespace-pre-wrap">{streamingText}</div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={locale === "th" ? "ถามไอเดียโฆษณา สคริปต์วิดีโอ หรือให้ช่วยเขียน Prompt..." : "Ask for ad scripts, storyboard ideas, or prompt engineering..."}
            className="neu-pressed flex-1 rounded-2xl px-4 py-3 text-sm focus:outline-2 focus:outline-violet-500"
          />
          <button type="submit" disabled={!draft.trim() || isStreaming} className="neu-tint-primary grid size-11 place-items-center rounded-2xl disabled:opacity-40">
            <Send className="size-4" />
          </button>
        </form>
      </section>
    </div>
  );
}
