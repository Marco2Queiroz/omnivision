import { AppwritePing } from "@/components/providers/AppwritePing";
import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "OmniVision | Authority Intelligence",
  description:
    "Governança corporativa e gestão de crise — visão C-Level consolidada.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OmniVision",
  },
};

export const viewport: Viewport = {
  themeColor: "#051522",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${plusJakarta.variable} ${inter.variable} min-h-dvh bg-background`}
      >
        <AppwritePing />
        {children}
      </body>
    </html>
  );
}
