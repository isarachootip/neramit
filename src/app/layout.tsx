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
  title: "GenWhy × Mantra · AI Creative Studio Suite",
  description:
    "Neumorphic AI Creative Suite for 4K Image Generation, 16-Layer Decomposition, Multi-Mode Video Ads, Seed Audio 1.0, and Rich @img Prompt Composer.",
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
