
"use client";

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    getComplementary,
    getAnalogous,
    getSplitComplementary,
    getTriadic,
    getSquare,
    getRectangular
} from '@/lib/colors';

const ColorPickerClient = dynamic(() => import('@/components/colors/ColorPickerClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-sm space-y-3 rounded-lg border bg-card p-4 text-card-foreground h-full">
        <div className="flex gap-3 h-40">
            <Skeleton className="relative flex-1 cursor-pointer" />
            <Skeleton className="relative w-5 cursor-pointer" />
        </div>
        <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
        </div>
        <div className="space-y-3 pt-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
        </div>
    </div>
  )
});

const Swatch = ({ color }: { color: string }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="h-12 w-12 rounded-md border" style={{ backgroundColor: color }} />
            </TooltipTrigger>
            <TooltipContent>
                <p>{color.toUpperCase()}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);

const HarmonyDisplay = ({ title, description, colors }: { title: string, description: string | React.ReactNode, colors: string[] }) => (
    <AccordionItem value={title}>
        <AccordionTrigger>{title}</AccordionTrigger>
        <AccordionContent>
            <div className="space-y-4">
                <div className="prose prose-sm text-muted-foreground">
                    {typeof description === 'string' ? <p>{description}</p> : description}
                </div>
                <div className="flex gap-2 flex-wrap">
                    {colors.map((c, i) => <Swatch key={`${title}-${c}-${i}`} color={c} />)}
                </div>
            </div>
        </AccordionContent>
    </AccordionItem>
);

export default function ColorWheelPage() {
    const [activeColor, setActiveColor] = useState('#ff6347');

    const harmonies = useMemo(() => ({
        complementary: getComplementary(activeColor),
        analogous: getAnalogous(activeColor),
        splitComplementary: getSplitComplementary(activeColor),
        triadic: getTriadic(activeColor),
        square: getSquare(activeColor),
        rectangular: getRectangular(activeColor),
    }), [activeColor]);

    const harmonyInfo = [
        { 
            name: "Complementary", 
            colors: harmonies.complementary, 
            description: (
                <>
                    <p>Comprised of two colors that are opposite each other on the color wheel.</p>
                    <ul className="list-disc pl-5">
                        <li>Creates a high contrast and vibrant look.</li>
                        <li>Examples: Blue and orange, red and green, purple and yellow.</li>
                    </ul>
                </>
            )
        },
        { 
            name: "Analogous", 
            colors: harmonies.analogous, 
            description: (
                 <>
                    <p>Involves colors that are next to each other on the color wheel.</p>
                    <ul className="list-disc pl-5">
                        <li>Usually matches well and creates serene and comfortable designs.</li>
                        <li>Often includes one dominant color, with the others supporting.</li>
                        <li>Examples: Red, orange, and red-orange; blue, blue-green, and green.</li>
                    </ul>
                </>
            )
        },
        { 
            name: "Split Complementary", 
            colors: harmonies.splitComplementary, 
            description: (
                 <>
                    <p>A variation of the complementary color scheme but with less tension.</p>
                    <ul className="list-disc pl-5">
                        <li>Includes one base color and the two colors adjacent to its complementary.</li>
                        <li>Offers strong visual contrast, but with more nuance than a straight complementary scheme.</li>
                        <li>Examples: Blue, yellow-orange, and red-orange.</li>
                    </ul>
                </>
            )
        },
        { 
            name: "Triadic", 
            colors: harmonies.triadic, 
            description: (
                 <>
                    <p>A triadic color scheme involves three colors that are evenly spaced on the color wheel, creating an equilateral triangle.</p>
                    <ul className="list-disc pl-5">
                        <li>This scheme is very popular and offers visual contrast while retaining balance and color richness.</li>
                        <li>Examples: Red, yellow, and blue; orange, green, and purple.</li>
                    </ul>
                </>
            )
        },
        { 
            name: "Square", 
            colors: harmonies.square, 
            description: (
                 <>
                    <p>The square color scheme includes four colors evenly spaced on the color wheel, forming a square.</p>
                    <ul className="list-disc pl-5">
                        <li>Offers plenty of contrast while still retaining harmony.</li>
                        <li>It’s crucial to balance the colors well, as this scheme can be overwhelming if not managed carefully.</li>
                        <li>Examples: Red, green, cyan, and violet.</li>
                    </ul>
                </>
            )
        },
        { 
            name: "Rectangular (Tetradic)", 
            colors: harmonies.rectangular, 
            description: (
                 <>
                    <p>Similar to the square but with colors forming a rectangle on the color wheel.</p>
                    <ul className="list-disc pl-5">
                        <li>It utilizes two pairs of complementary colors, but with one color dominating and the others serving as accents.</li>
                        <li>Examples: Blue, orange, red-orange, and blue-green.</li>
                    </ul>
                </>
            )
        },
    ];

    return (
        <main className="flex-1 w-full p-4 md:p-8">
            <CardHeader className="p-0 mb-8">
                <CardTitle className="text-3xl">Color Theory Explorer</CardTitle>
                <CardDescription>
                    A color wheel is a visual representation of colors arranged according to their chromatic relationship. 
                    It is a circular diagram where colors are typically organized according to their hue. The primary 
                    purpose of a color wheel is to show the relationship between different hues and to give guidance on 
                    color harmony and the creation of color schemes.
                </CardDescription>
            </CardHeader>

            <div className="grid md:grid-cols-[340px_1fr] gap-8">
                <aside>
                    <Card>
                        <CardHeader>
                            <CardTitle>Select a Base Color</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ColorPickerClient
                                color={activeColor}
                                onChange={(c) => setActiveColor(c.hex)}
                                className="w-full max-w-sm border-0 shadow-none p-0"
                            />
                        </CardContent>
                    </Card>
                </aside>
                <section>
                    <Accordion type="multiple" className="w-full" defaultValue={["Complementary", "Analogous", "Triadic"]}>
                        {harmonyInfo.map(harmony => (
                            <HarmonyDisplay 
                                key={harmony.name}
                                title={harmony.name}
                                description={harmony.description}
                                colors={harmony.colors}
                            />
                        ))}
                    </Accordion>
                </section>
            </div>
        </main>
    );
}
