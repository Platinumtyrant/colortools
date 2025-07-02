import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/layout/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Palette Prodigy",
  description: "A powerful color palette and gradient mesh builder.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#111111" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-headline antialiased">
        <Header />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
