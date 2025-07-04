
"use client";

import { usePathname } from "next/navigation";
import { SidebarContent } from "@/components/ui/sidebar";
import { useSidebarExtension } from "@/contexts/SidebarExtensionContext";

export function SidebarNav() {
    const pathname = usePathname();
    const { extension } = useSidebarExtension();
    
    return (
        <SidebarContent className="p-0">
            {pathname === '/' && extension && (
                <div className="p-4">
                    {extension}
                </div>
            )}
        </SidebarContent>
    );
}
