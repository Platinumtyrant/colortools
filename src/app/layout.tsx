import type { Metadata } from "next";
import { Noto_Sans } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster";
import { SidebarExtensionProvider } from "@/contexts/SidebarExtensionContext";
import "./globals.css";
import { MainLayout } from "@/components/layout/MainLayout";

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
  return (
    <html lang="en" className={`${notoSans.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="font-headline antialiased">
        <SidebarExtensionProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </SidebarExtensionProvider>
        <Toaster />
      </body>
    </html>
  );
}
