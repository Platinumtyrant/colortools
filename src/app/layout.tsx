
import type { Metadata } from "next";
import { Noto_Sans } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { MainLayout } from "@/components/layout/MainLayout";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { getCombinedPantoneLookup } from "@/lib/palette-parser";
import { PantoneProvider } from "@/contexts/SidebarExtensionContext";
import { PaletteBuilderProvider } from "@/contexts/PaletteBuilderContext";

export const metadata: Metadata = {
  title: "Palette Prodigy",
  description: "A powerful color palette and gradient mesh builder.",
};

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-noto-sans',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pantoneLookup = getCombinedPantoneLookup();

  return (
    <html lang="en" className={`${notoSans.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="font-headline antialiased">
        <PantoneProvider lookup={pantoneLookup}>
          <PaletteBuilderProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              themes={['light', 'dark', 'black']}
            >
              <MainLayout>
                {children}
              </MainLayout>
            </ThemeProvider>
          </PaletteBuilderProvider>
        </PantoneProvider>
        <Toaster />
      </body>
    </html>
  );
}
