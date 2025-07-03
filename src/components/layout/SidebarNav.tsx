"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Palette, Scaling, Layers, GitCompare, Library, LayoutDashboard, Brush } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const menuItems = [
    { href: '/', label: 'Palette Builder', icon: Palette },
    { href: '/scale', label: 'Scale Generator', icon: Scaling },
    { href: '/mesh-gradient', label: 'Gradient Builder', icon: Layers },
    { href: '/contrast-checker', label: 'Contrast Checker', icon: GitCompare },
    { href: '/library', label: 'Library', icon: Library },
    { href: '/dashboard-example', label: 'Dashboard Example', icon: LayoutDashboard },
];

export function SidebarNav() {
    const pathname = usePathname();
    return (
        <TooltipProvider>
            <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
                <Link
                    href="/"
                    className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
                >
                    <Brush className="h-5 w-5 transition-all group-hover:scale-110" />
                    <span className="sr-only">Palette Prodigy</span>
                </Link>
                {menuItems.map((item) => (
                    <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                            <Link
                                href={item.href}
                                className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                                    pathname === item.href && "bg-accent text-accent-foreground"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                <span className="sr-only">{item.label}</span>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                ))}
            </nav>
        </TooltipProvider>
    )
}
