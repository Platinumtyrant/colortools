
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brush, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
    { href: '/', label: 'Palette Builder' },
    { href: '/mesh-gradient', label: 'Gradient Builder' },
    { href: '/color-wheel', label: 'Color Wheel' },
    { href: '/inspiration', label: 'Inspiration' },
    { href: '/pantone-guide', label: 'Pantone Guide' },
    { href: '/library', label: 'Library' },
];

export function Header() {
    const pathname = usePathname();

    const isPantoneActive = pathname.startsWith('/pantone');

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 sm:px-6">
            <div className="flex items-center gap-4">
                
                <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
                    {navItems.map((item) => (
                        <Button key={item.href} asChild variant="ghost" className="text-muted-foreground hover:text-primary">
                            <Link
                                href={item.href!}
                                className={cn(
                                    "transition-colors",
                                    pathname === item.href || (item.href === '/pantone-guide' && isPantoneActive) ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                {item.label}
                            </Link>
                        </Button>
                    ))}
                </nav>

                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Open navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0">
                             <div className="p-6">
                                <Link
                                    href="/"
                                    className="flex items-center gap-2 text-lg font-semibold mb-4"
                                >
                                    <Brush className="h-6 w-6" />
                                    <span>Palette Prodigy</span>
                                </Link>
                             </div>
                            <nav className="grid gap-2 text-lg font-medium px-6">
                                {navItems.map((item) => (
                                    <SheetClose asChild key={item.href}>
                                        <Link
                                            href={item.href!}
                                            className={cn(
                                                "block py-3 text-base text-muted-foreground hover:text-foreground",
                                                pathname === item.href || (item.href === '/pantone-guide' && isPantoneActive) ? "text-foreground font-semibold" : ""
                                            )}
                                        >
                                            {item.label}
                                        </Link>
                                    </SheetClose>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <ThemeToggle />
            </div>
        </header>
    );
}
