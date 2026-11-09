"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { I18N_DICTIONARY, I18nStrings } from "../domain/i18n-catalog";
import { StudioLocale, StudioTheme } from "../domain/studio-types";
import {
  loadUiPreferences,
  loadWalletBalance,
  saveUiPreferences,
  saveWalletBalance,
} from "../repositories/studio-storage";

interface AppPreferencesContextValue {
  theme: StudioTheme;
  toggleTheme: () => void;
  locale: StudioLocale;
  setLocale: (loc: StudioLocale) => void;
  t: I18nStrings;
  tokenBalance: number;
  payWithTeam: boolean;
  setPayWithTeam: (val: boolean) => void;
  spendTokens: (amount: number) => boolean;
  topUpTokens: (amount: number) => void;
}

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

export function AppPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<StudioTheme>("dark");
  const [locale, setLocaleState] = useState<StudioLocale>("th");
  const [payWithTeam, setPayWithTeamState] = useState<boolean>(false);
  const [tokenBalance, setTokenBalance] = useState<number>(2500);

  useEffect(() => {
    const prefs = loadUiPreferences();
    setTheme(prefs.theme);
    setLocaleState(prefs.locale);
    setPayWithTeamState(prefs.payWithTeam);
    setTokenBalance(loadWalletBalance());
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: StudioTheme = prev === "dark" ? "light" : "dark";
      saveUiPreferences({ theme: next, locale, payWithTeam });
      return next;
    });
  };

  const setLocale = (nextLocale: StudioLocale) => {
    setLocaleState(nextLocale);
    saveUiPreferences({ theme, locale: nextLocale, payWithTeam });
  };

  const setPayWithTeam = (val: boolean) => {
    setPayWithTeamState(val);
    saveUiPreferences({ theme, locale, payWithTeam: val });
  };

  const spendTokens = (amount: number): boolean => {
    if (tokenBalance < amount) {
      return false;
    }
    const next = tokenBalance - amount;
    setTokenBalance(next);
    saveWalletBalance(next);
    return true;
  };

  const topUpTokens = (amount: number) => {
    const next = tokenBalance + amount;
    setTokenBalance(next);
    saveWalletBalance(next);
  };

  return (
    <AppPreferencesContext.Provider
      value={{
        theme,
        toggleTheme,
        locale,
        setLocale,
        t: I18N_DICTIONARY[locale],
        tokenBalance,
        payWithTeam,
        setPayWithTeam,
        spendTokens,
        topUpTokens,
      }}
    >
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences(): AppPreferencesContextValue {
  const ctx = useContext(AppPreferencesContext);
  if (!ctx) {
    throw new Error("useAppPreferences must be used within AppPreferencesProvider");
  }
  return ctx;
}
