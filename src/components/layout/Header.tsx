"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brush, Menu, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const navItems = [
    { href: '/mesh-gradient', label: 'Gradient Builder' },
    { href: '/', label: 'Palette Builder' },
    { href: '/inspiration', label: 'Inspiration' },
    { href: '/library', label: 'Library' },
    { 
        label: 'Pantone Guide',
        children: [
            { href: '/pantone-process', label: 'Process Colors' },
            { href: '/pantone-yellow-orange', label: 'Yellows & Oranges' },
            { href: '/pantone-orange-red', label: 'Oranges & Reds' },
            { href: '/pantone-pink-purple', label: 'Pinks & Purples' },
            { href: '/pantone-blue-violet', label: 'Blues & Violets' },
            { href: '/pantone-cyan-green', label: 'Cyans & Greens' },
            { href: '/pantone-yellow-green', label: 'Yellows & Greens' },
            { href: '/pantone-gray-brown', label: 'Grays & Browns' },
        ]
    },
];

export function Header() {
    const pathname = usePathname();

    const isPantoneActive = pathname.startsWith('/pantone');

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 sm:px-6">
            <div className="flex items-center gap-4">
                
                <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
                    {navItems.map((item) => (
                        item.children ? (
                            <DropdownMenu key={item.label}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className={cn(
                                        "transition-colors hover:text-primary gap-1",
                                        isPantoneActive ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {item.label}
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    {item.children.map(child => (
                                        <DropdownMenuItem key={child.href} asChild>
                                            <Link href={child.href}>{child.label}</Link>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button asChild variant="ghost" className="text-muted-foreground hover:text-primary">
                                <Link
                                    key={item.href}
                                    href={item.href!}
                                    className={cn(
                                        "transition-colors",
                                        pathname === item.href ? "text-primary" : "text-muted-foreground"
                                    )}
                                >
                                    {item.label}
                                </Link>
                            </Button>
                        )
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
                                <Accordion type="single" collapsible className="w-full">
                                    {navItems.map((item) => (
                                        item.children ? (
                                            <AccordionItem value={item.label} key={item.label} className="border-b-0">
                                                <AccordionTrigger className={cn(
                                                    "py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:no-underline",
                                                    isPantoneActive && "text-foreground"
                                                )}>
                                                    {item.label}
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="flex flex-col gap-3 pl-6">
                                                    {item.children.map((child) => (
                                                        <SheetClose asChild key={child.href}>
                                                            <Link href={child.href} className={cn(
                                                                "text-muted-foreground hover:text-foreground",
                                                                pathname === child.href && "text-foreground font-semibold"
                                                            )}>
                                                                {child.label}
                                                            </Link>
                                                        </SheetClose>
                                                    ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ) : (
                                            <SheetClose asChild key={item.href}>
                                                <Link
                                                    href={item.href!}
                                                    className={cn(
                                                        "block py-3 text-base text-muted-foreground hover:text-foreground",
                                                        pathname === item.href && "text-foreground font-semibold"
                                                    )}
                                                >
                                                    {item.label}
                                                </Link>
                                            </SheetClose>
                                        )
                                    ))}
                                </Accordion>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div></div>
        </header>
    );
}