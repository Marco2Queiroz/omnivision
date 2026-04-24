import { AppProviders } from "@/components/providers/AppProviders";
import { AppwritePing } from "@/components/providers/AppwritePing";
import { ClearStaleServiceWorker } from "@/components/providers/ClearStaleServiceWorker";
import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  applicationName: "OmniVision",
  title: "OmniVision | Inteligência executiva",
  description:
    "Governança corporativa e gestão de crise — visão de diretoria consolidada.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-omni.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/icon-omni.png", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OmniVision",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#060e20",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `html{background:#060e20}html.light{background:#f5f6f7}body{margin:0;min-height:100vh}`,
          }}
        />
      </head>
      <body
        className={`${manrope.variable} ${inter.variable} min-h-dvh bg-background font-body antialiased`}
      >
        <AppProviders>
          <ClearStaleServiceWorker />
          <AppwritePing />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
