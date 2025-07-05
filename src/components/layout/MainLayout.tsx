
"use client";

import React from 'react';
import { Header } from './Header';

export function MainLayout({ children }: { children: React.ReactNode; }) {
  return (
    <div className="flex h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 overflow-auto">
            {children}
        </main>
    </div>
  );
}
