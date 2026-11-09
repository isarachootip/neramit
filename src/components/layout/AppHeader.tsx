"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coins,
  Film,
  Globe,
  History,
  Home,
  Image as ImageIcon,
  LayoutTemplate,
  MessageSquare,
  Mic,
  Moon,
  Plus,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import { useAppPreferences } from "@/hooks/use-app-preferences";

export function AppHeader() {
  const pathname = usePathname();
  const {
    theme,
    toggleTheme,
    locale,
    setLocale,
    t,
    tokenBalance,
    payWithTeam,
    setPayWithTeam,
    topUpTokens,
  } = useAppPreferences();

  const navItems = [
    { href: "/", label: t.nav.home, icon: Home },
    { href: "/create/image", label: t.nav.imageStudio, icon: ImageIcon },
    { href: "/create/video", label: t.nav.videoStudio, icon: Film },
    { href: "/create/audio", label: t.nav.audioStudio, icon: Mic },
    { href: "/create/chat", label: t.nav.chatStudio, icon: MessageSquare },
    { href: "/templates", label: t.nav.templates, icon: LayoutTemplate },
    { href: "/history", label: t.nav.history, icon: History },
    { href: "/pricing", label: t.nav.pricing, icon: Coins },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--sheet)]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="neu-raised flex items-center gap-2.5 rounded-2xl px-3.5 py-2 font-bold tracking-tight transition-transform active:scale-95"
          >
            <span className="neu-tint-primary grid size-7 place-items-center rounded-xl text-xs font-extrabold">
              <Sparkles className="size-4" />
            </span>
            <span className="text-sm sm:text-base">
              GenWhy <span className="text-xs font-medium opacity-70">× Mantra</span>
            </span>
          </Link>

          <nav className="hidden xl:flex items-center gap-1 rounded-2xl p-1 neu-pressed">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? "neu-raised text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPayWithTeam(!payWithTeam)}
            title="Toggle Personal / Team Wallet"
            className={`hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              payWithTeam ? "neu-tint-team" : "neu-flat text-[var(--muted-foreground)]"
            }`}
          >
            <Users className="size-3.5" />
            <span>{payWithTeam ? "Team Wallet" : "Personal"}</span>
          </button>

          <div className="neu-pressed flex items-center gap-2 rounded-full py-1 pl-3 pr-1.5 text-xs font-bold">
            <Coins className="size-3.5 text-amber-400" />
            <span className="tabular-nums tracking-tight">
              {tokenBalance.toLocaleString()}
            </span>
            <span className="hidden sm:inline text-[10px] font-medium text-[var(--muted-foreground)]">
              Tokens
            </span>
            <button
              type="button"
              onClick={() => topUpTokens(500)}
              title="Instant +500 Mock Tokens"
              className="neu-tint-primary flex items-center gap-0.5 rounded-full px-2 py-1 text-[10px] font-bold transition-transform active:scale-95"
            >
              <Plus className="size-3" />
              <span>500</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setLocale(locale === "th" ? "en" : "th")}
            className="neu-raised flex h-8 items-center gap-1 rounded-xl px-2.5 text-xs font-bold uppercase transition-transform active:scale-95"
            aria-label="Switch language"
          >
            <Globe className="size-3.5" />
            <span>{locale}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="neu-raised grid size-8 place-items-center rounded-xl transition-transform active:scale-95"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="size-4 text-amber-400" />
            ) : (
              <Moon className="size-4 text-indigo-600" />
            )}
          </button>
        </div>
      </div>

      <div className="flex xl:hidden items-center gap-1.5 overflow-x-auto px-4 py-2 no-scrollbar border-t border-[var(--border)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold ${
                active
                  ? "neu-tint-primary"
                  : "neu-flat text-[var(--muted-foreground)]"
              }`}
            >
              <Icon className="size-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
