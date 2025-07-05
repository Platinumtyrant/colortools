
"use client";

import { SidebarContent } from "@/components/ui/sidebar";
import { useSidebarExtension } from "@/contexts/SidebarExtensionContext";

export function SidebarNav() {
    const { extension } = useSidebarExtension();
    
    return (
        <SidebarContent className="p-0">
            {extension && (
                <div className="p-4">
                    {extension}
                </div>
            )}
        </SidebarContent>
    );
}
