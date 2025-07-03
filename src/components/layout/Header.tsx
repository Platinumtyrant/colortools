"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Brush } from "lucide-react";

export function Header() {
    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <div className="sm:hidden flex items-center gap-4">
                <SidebarTrigger />
                <div className="flex items-center gap-2 font-bold">
                    <Brush className="h-5 w-5" />
                    <h1 className="text-xl">Palette Prodigy</h1>
                </div>
            </div>
        </header>
    );
}
