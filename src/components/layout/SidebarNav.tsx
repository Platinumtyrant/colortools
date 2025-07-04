
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brush } from "lucide-react";
import { SidebarHeader, SidebarContent, SidebarSeparator } from "@/components/ui/sidebar";
import { useSidebarExtension } from "@/contexts/SidebarExtensionContext";

export function SidebarNav() {
    const pathname = usePathname();
    const { extension } = useSidebarExtension();
    
    return (
        <>
            <SidebarHeader className="flex items-center gap-2 p-4">
                 <Link href="/" className="flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base">
                     <Brush className="h-5 w-5 transition-all group-hover:scale-110" />
                     <span className="sr-only">Palette Prodigy</span>
                 </Link>
                <h1 className="font-bold text-lg group-data-[collapsible=icon]:hidden">Palette Prodigy</h1>
            </SidebarHeader>
            <SidebarContent>
                {pathname === '/' && extension && (
                    <>
                        <SidebarSeparator />
                        <div className="p-4">
                            {extension}
                        </div>
                    </>
                )}
            </SidebarContent>
        </>
    );
}
