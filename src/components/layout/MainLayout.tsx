
"use client";

import React from 'react';
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import { SidebarNav } from './SidebarNav';
import { Header } from './Header';

function LayoutController({
  children,
}: {
  children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-background">
            <Sidebar>
                <SidebarNav />
            </Sidebar>
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}


export function MainLayout({ children }: { children: React.ReactNode; }) {
  return (
    <SidebarProvider defaultOpen={true}>
        <LayoutController>
            {children}
        </LayoutController>
    </SidebarProvider>
  );
}
