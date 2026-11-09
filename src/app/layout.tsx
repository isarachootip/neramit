import type { Metadata } from "next";
import { Hanken_Grotesk, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { AppPreferencesProvider } from "@/hooks/use-app-preferences";
import { AppHeader } from "@/components/layout/AppHeader";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const notoThai = Noto_Sans_Thai({
  subsets: ["thai"],
  variable: "--font-noto-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Neramit AI (เนรมิต AI) · Unified Omni-Studio & Ad Production Suite",
  description:
    "Flagship Hybrid Tactile Glass + Neumorphic AI Studio with Image-to-Video Pipeline Chaining, True @-Autocomplete Chip Composer, HTML5 Mask Painter, and Hybrid API Key Vault.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      data-theme="dark"
      className={`${hanken.variable} ${notoThai.variable}`}
    >
      <body className="antialiased">
        <AppPreferencesProvider>
          <div className="flex min-h-svh flex-col">
            <AppHeader />
            <main className="flex-1 pb-16">{children}</main>
          </div>
        </AppPreferencesProvider>
      </body>
    </html>
  );
}
