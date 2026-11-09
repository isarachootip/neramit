import type { Metadata } from "next";
import "./globals.css";
import { AppPreferencesProvider } from "@/hooks/use-app-preferences";
import { AppHeader } from "@/components/layout/AppHeader";

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
    <html lang="th" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Noto+Sans+Thai:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
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
