
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
    { href: '/camera-identifier', label: 'Camera Identifier' },
    { href: '/inspiration', label: 'Inspiration' },
    { href: '/pantone-guide', label: 'Pantone Guide' },
    { href: '/library', label: 'Library' },
];

export function Header() {
    const pathname = usePathname();

    const isPantoneActive = pathname.startsWith('/pantone');

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center justify-center bg-background px-4 sm:px-6 relative">

            <div className="md:hidden absolute left-4 top-1/2 -translate-y-1/2">
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
            
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium bg-muted p-1 rounded-md">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href === '/pantone-guide' && isPantoneActive);
                    return (
                        <Link
                            key={item.href}
                            href={item.href!}
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                isActive
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="md:hidden">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-lg font-semibold"
                >
                    <Brush className="h-6 w-6" />
                    <span>Palette Prodigy</span>
                </Link>
            </div>

            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <ThemeToggle />
            </div>
        </header>
    );
}
