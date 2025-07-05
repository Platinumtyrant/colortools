
"use client";

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from '@/components/ui/slider';
import { colord } from 'colord';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    getComplementary,
    getAnalogous,
    getSplitComplementary,
    getTriadic,
    getSquare,
    getRectangular,
    getTints,
    getTones,
    getShades,
} from '@/lib/colors';
import type { ColorResult } from '@uiw/react-color';
import HarmonyColorWheel from '@/components/colors/HarmonyColorWheel';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

const ColorWheel = dynamic(() => import('@uiw/react-color-wheel').then(mod => mod.default), {
  ssr: false,
  loading: () => (
      <div className="flex justify-center items-center w-[280px] h-[280px]">
        <Skeleton className="w-full h-full rounded-full" />
      </div>
  )
});

const SmallSwatch = ({ color }: { color: string }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="h-10 w-10 rounded-md border" style={{ backgroundColor: color }} />
            </TooltipTrigger>
            <TooltipContent>
                <p>{color.toUpperCase()}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);

const HarmonySwatch = ({ color }: { color: string }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="h-16 w-16 rounded-lg border shadow-sm" style={{ backgroundColor: color }} />
            </TooltipTrigger>
            <TooltipContent>
                <p>{color.toUpperCase()}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);

const ColorStrip = ({ title, colors }: { title: string, colors: string[] }) => (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {colors.map((c, i) => <SmallSwatch key={`${title}-${c}-${i}`} color={c} />)}
      </div>
    </div>
);

const HarmonyDescription = ({ title, description }: { title: string, description: React.ReactNode }) => (
    <AccordionItem value={title}>
        <AccordionTrigger>{title}</AccordionTrigger>
        <AccordionContent>
            <div className="prose prose-sm text-muted-foreground max-w-none">
                {description}
            </div>
        </AccordionContent>
    </AccordionItem>
);

export default function ColorWheelPage() {
    const [activeColor, setActiveColor] = useState('#ff6347');
    const [tintShadeCount, setTintShadeCount] = useState(5);

    const activeHsl = useMemo(() => colord(activeColor).toHsl(), [activeColor]);

    const handleLightnessChange = (newLightness: number[]) => {
        const newColor = colord({ ...activeHsl, l: newLightness[0] }).toHex();
        setActiveColor(newColor);
    };

    const harmonies = useMemo(() => ({
        complementary: getComplementary(activeColor),
        analogous: getAnalogous(activeColor),
        splitComplementary: getSplitComplementary(activeColor),
        triadic: getTriadic(activeColor),
        square: getSquare(activeColor),
        rectangular: getRectangular(activeColor),
    }), [activeColor]);

    const harmonyInfo = useMemo(() => [
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
            name: "Tetradic", 
            colors: harmonies.rectangular, 
            description: (
                 <>
                    <p>The tetradic (or rectangular) color scheme utilizes two pairs of complementary colors.</p>
                    <ul className="list-disc pl-5">
                        <li>It offers a rich, vibrant palette but can be hard to balance. Best if one color is dominant.</li>
                        <li>Examples: Blue, orange, red-orange, and blue-green.</li>
                    </ul>
                </>
            )
        },
    ], [harmonies]);

    const [activeHarmonyName, setActiveHarmonyName] = useState(harmonyInfo[0].name);

    const activeHarmony = useMemo(() => {
        return harmonyInfo.find(h => h.name === activeHarmonyName) || harmonyInfo[0];
    }, [activeHarmonyName, harmonyInfo]);

    const tints = useMemo(() => getTints(activeColor, tintShadeCount), [activeColor, tintShadeCount]);
    const shades = useMemo(() => getShades(activeColor, tintShadeCount), [activeColor, tintShadeCount]);
    const tones = useMemo(() => getTones(activeColor, tintShadeCount), [activeColor, tintShadeCount]);

    return (
        <main className="flex-1 w-full p-4 md:p-8 space-y-8">
            <CardHeader className="p-0 text-center max-w-3xl mx-auto">
                <CardTitle className="text-3xl">Color Theory Explorer</CardTitle>
                <CardDescription>
                    Select a color to explore its harmonies. A color wheel is a visual representation of colors arranged 
                    according to their chromatic relationship to help guide color harmony.
                </CardDescription>
            </CardHeader>

            <div className="flex flex-col items-center gap-8">
                <div className="flex items-center gap-4">
                    <ColorWheel
                        color={activeColor}
                        onChange={(color: ColorResult) => setActiveColor(color.hex)}
                        width={280}
                        height={280}
                    />
                    <div className="h-[280px]">
                        <Slider
                            orientation="vertical"
                            value={[activeHsl.l]}
                            onValueChange={handleLightnessChange}
                            max={100}
                            step={1}
                        />
                    </div>
                </div>

                <Card className="w-full max-w-xs">
                    <CardContent className="p-4">
                         <div className="w-full h-10 rounded-md border mb-2" style={{ backgroundColor: activeColor }}></div>
                         <p className="text-center font-mono">{activeColor.toUpperCase()}</p>
                    </CardContent>
                </Card>
            </div>
            
            <section className="w-full max-w-3xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Color Harmonies</CardTitle>
                        <CardDescription>Select a tab to view a different harmonic relationship based on your selected color.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue={harmonyInfo[0].name} onValueChange={setActiveHarmonyName} className="w-full">
                            <TabsList className="flex-wrap h-auto justify-start">
                                {harmonyInfo.map((harmony) => (
                                    <TabsTrigger key={harmony.name} value={harmony.name}>
                                        {harmony.name}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-8 p-4 min-h-[250px]">
                                <HarmonyColorWheel colors={activeHarmony.colors} size={200} />
                                <div className="flex flex-wrap gap-4 justify-center content-center max-w-[200px] min-h-[144px]">
                                    <AnimatePresence mode="wait">
                                    {activeHarmony.colors.map((c) => (
                                        <motion.div
                                            key={`${activeHarmony.name}-${c}`}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <HarmonySwatch color={c} />
                                        </motion.div>
                                    ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </Tabs>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tints, Tones & Shades</CardTitle>
                        <CardDescription>Explore variations of your selected color by mixing it with white (tints), gray (tones), or black (shades).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                           <div className="flex justify-between items-center">
                             <Label htmlFor="tint-shade-count">Count</Label>
                             <span className="text-sm font-medium">{tintShadeCount}</span>
                           </div>
                           <Slider
                                id="tint-shade-count"
                                min={2}
                                max={25}
                                step={1}
                                value={[tintShadeCount]}
                                onValueChange={(value) => setTintShadeCount(value[0])}
                            />
                        </div>

                        <div className="space-y-4">
                            <ColorStrip title="Tints" colors={tints} />
                            <ColorStrip title="Tones" colors={tones} />
                            <ColorStrip title="Shades" colors={shades} />
                        </div>
                    </CardContent>
                </Card>
            </section>


            <section className="w-full max-w-3xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Harmony Explanations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="multiple" className="w-full">
                            {harmonyInfo.map(harmony => (
                                <HarmonyDescription
                                    key={harmony.name}
                                    title={harmony.name}
                                    description={harmony.description}
                                />
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            </section>
        </main>
    );
}
