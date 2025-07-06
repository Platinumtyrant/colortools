
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Slider } from '@/components/ui/slider';
import { colord } from 'colord';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import {
    getComplementary,
    getAnalogous,
    getSplitComplementary,
    getTriadic,
    getSquare,
    getTones,
    getTints,
    getShades,
    getRectangular,
} from '@/lib/colors';
import type { ColorResult } from '@uiw/react-color';
import HarmonyColorWheel from '@/components/colors/HarmonyColorWheel';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { ColorBox, ColorDetails } from '@/components/colors/ColorBox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pipette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Type definition for the experimental EyeDropper API
interface EyeDropperResult {
  sRGBHex: string;
}
interface EyeDropper {
  new (): EyeDropper;
  open(options?: { signal: AbortSignal }): Promise<EyeDropperResult>;
}
declare global {
  interface Window {
    EyeDropper?: EyeDropper;
  }
}

const ColorWheel = dynamic(() => import('@uiw/react-color-wheel').then(mod => mod.default), {
  ssr: false,
  loading: () => (
      <div className="flex justify-center items-center w-[280px] h-[280px]">
        <Skeleton className="w-full h-full rounded-full" />
      </div>
  )
});

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
    const [tintCount, setTintCount] = useState(5);
    const [toneCount, setToneCount] = useState(5);
    const [shadeCount, setShadeCount] = useState(5);
    const [inputValue, setInputValue] = useState(activeColor);
    const { toast } = useToast();

    React.useEffect(() => {
        setInputValue(activeColor);
    }, [activeColor]);

    const activeHsl = useMemo(() => colord(activeColor).toHsl(), [activeColor]);

    const handleLightnessChange = (newLightness: number[]) => {
        const newColor = colord({ ...activeHsl, l: newLightness[0] }).toHex();
        setActiveColor(newColor);
    };

    const handleSaturationChange = (newSaturation: number[]) => {
        const newColor = colord({ ...activeHsl, s: newSaturation[0] }).toHex();
        setActiveColor(newColor);
    };

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        if (colord(value).isValid()) {
            setActiveColor(value);
        }
    }, []);

    const handleInputBlur = useCallback(() => {
        if (!colord(inputValue).isValid()) {
            setInputValue(activeColor);
        }
    }, [inputValue, activeColor]);

    const handleEyeDropper = async () => {
        if (!window.EyeDropper) {
          toast({
            title: "Unsupported Browser",
            description: "The eyedropper feature is not available in your browser.",
            variant: "destructive",
          });
          return;
        }
        try {
          const eyeDropper = new window.EyeDropper();
          const { sRGBHex } = await eyeDropper.open();
          setActiveColor(sRGBHex);
          toast({ title: "Color Picked!", description: `Set active color to ${sRGBHex}` });
        } catch (e) {
          console.log("EyeDropper cancelled");
        }
      };

    const harmonies = useMemo(() => ({
        complementary: getComplementary(activeColor),
        analogous: getAnalogous(activeColor),
        splitComplementary: getSplitComplementary(activeColor),
        triadic: getTriadic(activeColor),
        tetradic: getRectangular(activeColor),
        square: getSquare(activeColor),
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
                        <li>This is very popular and offers visual contrast while retaining balance and color richness.</li>
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
            colors: harmonies.tetradic, 
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
    ], [activeColor, harmonies]);

    const tints = useMemo(() => getTints(activeColor, tintCount), [activeColor, tintCount]);
    const shades = useMemo(() => getShades(activeColor, shadeCount), [activeColor, shadeCount]);
    const tones = useMemo(() => getTones(activeColor, toneCount), [activeColor, toneCount]);

    return (
        <main className="flex-1 w-full p-4 md:p-8 space-y-8">
            <CardHeader className="p-0 text-center max-w-4xl mx-auto">
                <CardTitle className="text-3xl">Color Theory Explorer</CardTitle>
                <CardDescription>
                    Select a color to explore its harmonies. A color wheel is a visual representation of colors arranged 
                    according to their chromatic relationship to help guide color harmony.
                </CardDescription>
            </CardHeader>

            <div className="flex flex-col md:flex-row items-center justify-center gap-12 max-w-4xl mx-auto">
                <div className="flex items-center justify-center gap-4">
                    <div className="flex flex-col items-center gap-4">
                        <ColorWheel
                            color={activeColor}
                            onChange={(color: ColorResult) => setActiveColor(color.hex)}
                            width={280}
                            height={280}
                        />
                        <div className="flex items-center gap-2 w-[280px]">
                            <Input
                                value={inputValue.toUpperCase()}
                                onChange={handleInputChange}
                                onBlur={handleInputBlur}
                                className="flex-1 p-2 h-9 rounded-md bg-muted text-center font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <Button onClick={handleEyeDropper} variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                                <Pipette className="h-4 w-4" />
                                <span className="sr-only">Pick from screen</span>
                            </Button>
                        </div>
                    </div>
                     <div className="flex gap-4 h-[280px]">
                        <div className="flex flex-col items-center gap-2">
                            <Slider
                                orientation="vertical"
                                value={[activeHsl.s]}
                                onValueChange={handleSaturationChange}
                                max={100}
                                step={1}
                            />
                            <Label className="text-xs text-muted-foreground">S</Label>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Slider
                                orientation="vertical"
                                value={[activeHsl.l]}
                                onValueChange={handleLightnessChange}
                                max={100}
                                step={1}
                            />
                            <Label className="text-xs text-muted-foreground">L</Label>
                        </div>
                    </div>
                </div>
                <div className="w-full max-w-sm h-full">
                    <Card className="overflow-hidden shadow-sm group w-full h-full flex flex-col">
                        <div className="relative h-80 w-full" style={{ backgroundColor: activeColor }} />
                        <CardContent className="p-4 flex-grow flex flex-col justify-center">
                            <p className="font-semibold text-lg text-center mb-2">{colord(activeColor).toName({closest: true})}</p>
                            <ColorDetails color={activeColor} />
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <section className="w-full max-w-4xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Color Harmonies</CardTitle>
                        <CardDescription>Select a tab to view a different harmonic relationship based on your selected color.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue={harmonyInfo[0].name} className="w-full">
                             <TabsList className="flex flex-wrap h-auto justify-center">
                                {harmonyInfo.map((harmony) => (
                                    <TabsTrigger key={harmony.name} value={harmony.name}>
                                        {harmony.name}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            {harmonyInfo.map(harmony => (
                                <TabsContent key={harmony.name} value={harmony.name}>
                                     <motion.div
                                        key={harmony.name}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className="mt-6 grid md:grid-cols-2 items-center gap-8 p-4"
                                    >
                                        <div className="mx-auto">
                                            <HarmonyColorWheel colors={harmony.colors} size={200} />
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-4">
                                            {harmony.colors.map((c, i) => (
                                                <ColorBox key={`${c}-${i}`} color={c} variant="compact" />
                                            ))}
                                        </div>
                                    </motion.div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tints, Tones & Shades</CardTitle>
                        <CardDescription>Explore variations of your selected color by mixing it with white (tints), gray (tones), or black (shades).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                       <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <Label htmlFor="tint-count" className="font-medium">Tints</Label>
                                    <span className="text-sm font-medium">{tintCount}</span>
                                </div>
                                <Slider
                                    id="tint-count"
                                    min={2}
                                    max={30}
                                    step={1}
                                    value={[tintCount]}
                                    onValueChange={(value) => setTintCount(value[0])}
                                />
                                <div className="flex flex-wrap gap-4 mt-4">
                                    {tints.map((c, i) => (
                                        <ColorBox key={`tint-${c}-${i}`} color={c} variant="compact" />
                                    ))}
                                </div>
                            </div>
                            
                            <Separator />

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <Label htmlFor="tone-count" className="font-medium">Tones</Label>
                                    <span className="text-sm font-medium">{toneCount}</span>
                                </div>
                                <Slider
                                    id="tone-count"
                                    min={2}
                                    max={30}
                                    step={1}
                                    value={[toneCount]}
                                    onValueChange={(value) => setToneCount(value[0])}
                                />
                                <div className="flex flex-wrap gap-4 mt-4">
                                    {tones.map((c, i) => (
                                        <ColorBox key={`tone-${c}-${i}`} color={c} variant="compact" />
                                    ))}
                                </div>
                            </div>

                            <Separator />
                            
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <Label htmlFor="shade-count" className="font-medium">Shades</Label>
                                    <span className="text-sm font-medium">{shadeCount}</span>
                                </div>
                                <Slider
                                    id="shade-count"
                                    min={2}
                                    max={30}
                                    step={1}
                                    value={[shadeCount]}
                                    onValueChange={(value) => setShadeCount(value[0])}
                                />
                                <div className="flex flex-wrap gap-4 mt-4">
                                    {shades.map((c, i) => (
                                        <ColorBox key={`shade-${c}-${i}`} color={c} variant="compact" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <section className="w-full max-w-4xl mx-auto">
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
