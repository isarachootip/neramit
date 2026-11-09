"use client";

import React, { useState } from "react";
import { Check, Coins, Sparkles } from "lucide-react";
import { NERAMIT_PRICING_PACKAGES } from "@/domain/templates-data";
import { useAppPreferences } from "@/hooks/use-app-preferences";

export default function PricingPage() {
  const { locale, tokenBalance, topUpTokens } = useAppPreferences();
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [recentPurchasedId, setRecentPurchasedId] = useState<string | null>(null);

  const subscriptions = NERAMIT_PRICING_PACKAGES.filter(
    (p) =>
      p.kind === "subscription" &&
      (interval === "month"
        ? p.billingInterval === "month"
        : p.billingInterval === "year" || p.id === "pro-month")
  );
  const topups = NERAMIT_PRICING_PACKAGES.filter((p) => p.kind === "topup");

  const handlePurchase = (id: string, totalTokens: number) => {
    topUpTokens(totalTokens);
    setRecentPurchasedId(id);
    setTimeout(() => setRecentPurchasedId(null), 2200);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="neu-pressed inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-bold">
          <Coins className="size-3.5 text-amber-400" />
          <span>
            {locale === "th" ? "ยอดคงเหลือปัจจุบัน:" : "Current Wallet:"}{" "}
            {tokenBalance.toLocaleString()} Tokens
          </span>
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
          {locale === "th"
            ? "แพ็กเกจสมาชิก & เติม Token (Neramit Pricing)"
            : "Neramit Plans & Instant Token Top-Up"}
        </h1>
        <p className="max-w-xl text-xs sm:text-sm text-[var(--muted-foreground)]">
          {locale === "th"
            ? "กดเลือกแพ็กเกจด้านล่างเพื่อทดสอบระบบเติม Token เข้ากระเป๋าทันที (Interactive Mock Billing)"
            : "Click any plan or top-up pack below to instantly credit tokens to your active studio wallet"}
        </p>

        <div className="neu-pressed flex items-center gap-1 rounded-full p-1.5">
          <button
            type="button"
            onClick={() => setInterval("month")}
            className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
              interval === "month" ? "neu-tint-primary" : "text-[var(--muted-foreground)]"
            }`}
          >
            {locale === "th" ? "รายเดือน (Monthly)" : "Monthly"}
          </button>
          <button
            type="button"
            onClick={() => setInterval("year")}
            className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
              interval === "year" ? "neu-tint-primary" : "text-[var(--muted-foreground)]"
            }`}
          >
            {locale === "th" ? "รายปี (ประหยัด 25%)" : "Yearly (Save 25%)"}
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {[...subscriptions, ...topups].map((pkg) => {
          const totalCredit = pkg.tokens + pkg.bonusTokens;
          const isSuccess = recentPurchasedId === pkg.id;
          return (
            <div
              key={pkg.id}
              className="neu-raised neu-grain flex flex-col justify-between gap-5 rounded-3xl p-6"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-extrabold">{pkg.name}</span>
                  <span className="neu-tint-primary rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                    {pkg.badge}
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold tabular-nums">
                    ฿{pkg.priceThb.toLocaleString()}
                  </span>
                  {pkg.billingInterval && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      / {pkg.billingInterval}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="neu-pressed flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold">
                    <Coins className="size-3.5 text-amber-400" />
                    <span>{pkg.tokens.toLocaleString()} Tokens</span>
                  </span>
                  {pkg.bonusTokens > 0 && (
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400">
                      +{pkg.bonusTokens.toLocaleString()} Bonus
                    </span>
                  )}
                </div>

                <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                  {pkg.description}
                </p>

                <ul className="flex flex-col gap-1.5 pt-1">
                  {pkg.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-xs">
                      <span className="text-violet-400">◇</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handlePurchase(pkg.id, totalCredit)}
                className="neu-tint-primary flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-extrabold transition-transform active:scale-95"
              >
                {isSuccess ? (
                  <>
                    <Check className="size-4" />
                    <span>+{totalCredit.toLocaleString()} Tokens Added!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    <span>
                      {locale === "th"
                        ? `รับ +${totalCredit.toLocaleString()} Tokens ทันที`
                        : `Claim +${totalCredit.toLocaleString()} Tokens`}
                    </span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}
