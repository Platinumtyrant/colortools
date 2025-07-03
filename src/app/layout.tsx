import type { Metadata } from "next";
import { Noto_Sans } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/layout/Header";
import { SidebarNav } from "@/components/layout/SidebarNav";
import "./globals.css";

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
    <html lang="en" className={`${notoSans.variable} dark`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#111111" />
        {/* Google Font links removed, handled by next/font */}
      </head>
      <body className="font-headline antialiased">
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
                <SidebarNav />
            </aside>
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                <Header />
                <main>{children}</main>
            </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
