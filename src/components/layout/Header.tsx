
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brush, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
    { href: '/mesh-gradient', label: 'Gradient Builder' },
    { href: '/', label: 'Palette Builder' },
    { href: '/inspiration', label: 'Inspiration' },
    { href: '/library', label: 'Library' },
    { href: '/pantone-guide', label: 'Pantone Guide' },
];

export function Header() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 sm:px-6">
            {/* Left side of header */}
            <div className="flex items-center gap-4">
                
                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "transition-colors hover:text-primary",
                                pathname === item.href ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Mobile Navigation Trigger */}
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Open navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left">
                            <nav className="grid gap-6 text-lg font-medium p-6">
                                <Link
                                    href="/"
                                    className="flex items-center gap-2 text-lg font-semibold mb-4"
                                >
                                    <Brush className="h-6 w-6" />
                                    <span>Palette Prodigy</span>
                                </Link>
                                {navItems.map((item) => (
                                    <SheetClose asChild key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "text-muted-foreground hover:text-foreground",
                                                pathname === item.href && "text-foreground"
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

            {/* Right side of header is empty */}
            <div></div>
        </header>
    );
}
