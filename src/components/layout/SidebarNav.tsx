
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Palette, Layers, Library, LayoutDashboard, Brush, Wrench, Wand2 } from "lucide-react";
import { SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

const menuItems = [
    { href: '/', label: 'Palette Builder', icon: Palette },
    { href: '/scale', label: 'Color Tools', icon: Wrench },
    { href: '/mesh-gradient', label: 'Gradient Builder', icon: Layers },
    { href: '/palette-generator', label: 'Palette Generator', icon: Wand2 },
    { href: '/library', label: 'Library', icon: Library },
    { href: '/dashboard-example', label: 'Dashboard Example', icon: LayoutDashboard },
];

export function SidebarNav() {
    const pathname = usePathname();
    
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
                <SidebarMenu>
                    {menuItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                             <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href}
                                tooltip={item.label}
                             >
                                <Link href={item.href}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
        </>
    );
}
