import type { Metadata } from "next";
import { IBM_Plex_Mono, Noto_Serif, Open_Sans } from "next/font/google";

import "./globals.css";

import { AppProviders } from "@/components/providers/app-providers";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";

const openSans = Open_Sans({
  subsets: ["cyrillic", "latin"],
  variable: "--font-sans",
  display: "swap",
});

const notoSerif = Noto_Serif({
  subsets: ["cyrillic", "latin"],
  variable: "--font-serif",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://progulkas.local"),
  title: {
    default: "Маршруты Прогулки",
    template: "%s — Маршруты Прогулки",
  },
  description:
    "Платформа для планирования прогулочных маршрутов по России с картами, треками и социальными функциями.",
  keywords: [
    "прогулки",
    "маршруты",
    "туризм",
    "outdoor",
    "карты",
    "OSM",
  ],
  authors: [{ name: "Команда Маршруты Прогулки" }],
  openGraph: {
    title: "Маршруты Прогулки",
    description:
      "Создавайте, исследуйте и делитесь прогулочными маршрутами с интерактивными картами и подробными данными.",
    type: "website",
    locale: "ru_RU",
    url: "https://progulkas.local",
  },
  alternates: {
    canonical: "https://progulkas.local",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={cn(openSans.variable, notoSerif.variable, plexMono.variable)}>
        <AppProviders>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1 bg-background">
              <div className="container py-10">{children}</div>
            </main>
            <SiteFooter />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
