"use client";

import Link from 'next/link';
import { Palette, Scaling, Layers, GitCompare, Library, LayoutDashboard, Menu, Brush } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const menuItems = [
    { href: '/', label: 'Palette Builder', icon: Palette },
    { href: '/scale', label: 'Scale Generator', icon: Scaling },
    { href: '/mesh-gradient', label: 'Gradient Builder', icon: Layers },
    { href: '/contrast-checker', label: 'Contrast Checker', icon: GitCompare },
    { href: '/library', label: 'Library', icon: Library },
    { href: '/dashboard-example', label: 'Dashboard Example', icon: LayoutDashboard },
];

export function Header() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <Sheet>
                <SheetTrigger asChild>
                    <Button size="icon" variant="outline" className="sm:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="sm:max-w-xs">
                    <nav className="grid gap-6 text-lg font-medium">
                        <Link href="/" className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base">
                            <Brush className="h-5 w-5 transition-all group-hover:scale-110" />
                            <span className="sr-only">Palette Prodigy</span>
                        </Link>
                        {menuItems.map((item) => (
                             <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-4 px-2.5",
                                    pathname === item.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2 font-bold sm:hidden">
                <Brush className="h-5 w-5" />
                <h1 className="text-xl">Palette Prodigy</h1>
            </div>
        </header>
    );
}
