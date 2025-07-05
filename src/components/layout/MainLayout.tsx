
"use client";

import React from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { SidebarProvider, useSidebar, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from './SidebarNav';
import { Header } from './Header';

function LayoutController({
  children,
}: {
  children: React.ReactNode;
}) {
    const { setOpen } = useSidebar();
    
    return (
        <ResizablePanelGroup 
            direction="horizontal"
            onLayout={(sizes: number[]) => {
                document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`;
            }}
            className="h-full items-stretch"
        >
            <ResizablePanel
                defaultSize={25}
                minSize={20}
                maxSize={30}
                collapsible={true}
                collapsedSize={4}
                onCollapse={() => {
                    setOpen(false);
                }}
                onExpand={() => {
                    setOpen(true);
                }}
                className="hidden md:block"
            >
                <Sidebar>
                    <SidebarNav />
                </Sidebar>
            </ResizablePanel>
            <ResizableHandle withHandle className="hidden md:flex" />
            <ResizablePanel defaultSize={75}>
                <SidebarInset>
                    <Header />
                    <main className="flex flex-1 flex-col overflow-auto p-4 md:p-8">
                        {children}
                    </main>
                </SidebarInset>
            </ResizablePanel>
        </ResizablePanelGroup>
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
