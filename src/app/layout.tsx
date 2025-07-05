
import type { Metadata } from "next";
import { Noto_Sans } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { MainLayout } from "@/components/layout/MainLayout";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

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
    <html lang="en" className={`${notoSans.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="font-headline antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <MainLayout>
            {children}
          </MainLayout>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
