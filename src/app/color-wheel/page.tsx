
"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Slider } from '@/components/ui/slider';
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
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
import { motion, AnimatePresence } from 'framer-motion';
import { ColorBox } from '@/components/colors/ColorBox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pipette, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaletteBuilder } from '@/contexts/PaletteBuilderContext';
import { saveColorToLibrary, removeColorFromLibrary } from '@/lib/colors';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tooltip as ShadTooltip, TooltipContent as ShadTooltipContent, TooltipProvider as ShadTooltipProvider, TooltipTrigger as ShadTooltipTrigger } from '@/components/ui/tooltip';
import chroma from 'chroma-js';
import { simulate, type SimulationType } from '@/lib/colorblind';
import { WCAGDisplay } from '@/components/colors/WCAGDisplay';
import { ContrastGrid } from '@/components/colors/ContrastGrid';
import ColorPickerClient from '@/components/colors/ColorPickerClient';
import { cn } from '@/lib/utils';

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

extend([a11yPlugin]);

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

type ColorSpace = 'lch' | 'lab' | 'hsl' | 'hwb' | 'srgb';

const colorSpaceInfo: Record<ColorSpace, { name: string; components: string[]; descriptions: string[] }> = {
  lch: { name: 'LCH', components: ['L', 'C', 'H'], descriptions: ['Lightness (0-100)', 'Chroma (0-150)', 'Hue (0-360)'] },
  lab: { name: 'Lab', components: ['L*', 'a*', 'b*'], descriptions: ['Lightness', 'Green-Red', 'Blue-Yellow'] },
  hsl: { name: 'HSL', components: ['H', 'S', 'L'], descriptions: ['Hue (0-360)', 'Saturation (0-1)', 'Lightness (0-1)'] },
  hwb: { name: 'HWB', components: ['H', 'W', 'B'], descriptions: ['Hue (0-360)', 'Whiteness (0-100)', 'Blackness (0-100)'] },
  srgb: { name: 'sRGB', components: ['R', 'G', 'B'], descriptions: ['Red (0-255)', 'Green (0-255)', 'Blue (0-255)'] },
};

const getGraphData = (colors: string[], space: ColorSpace) => {
    if (!colors || colors.length === 0) return [];
    
    let components: [number, number, number][] = [];
    switch (space) {
        case 'lch':   components = colors.map(c => chroma(c).lch()); break;
        case 'lab':   components = colors.map(c => chroma(c).lab()); break;
        case 'hsl':   components = colors.map(c => chroma(c).hsl()); break;
        case 'hwb':   components = colors.map(c => colord(c).toHwb()).map(o => [o.h, o.w, o.b]); break;
        case 'srgb':  components = colors.map(c => chroma(c).rgb()); break;
        default:      components = colors.map(c => chroma(c).lch());
    }

    return components[0].map((_, i) => ({
      data: components.map((c, j) => ({
        name: j + 1,
        value: isNaN(c[i]) ? 0 : c[i]
      })),
      title: colorSpaceInfo[space].components[i],
      description: colorSpaceInfo[space].descriptions[i]
    }));
};

const ChartDisplay = ({ data, title, color, description }: { data: { name: number; value: number }[], title: string, color: string, description: string }) => (
  <div>
    <ShadTooltipProvider>
      <ShadTooltip>
        <ShadTooltipTrigger asChild>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 cursor-help underline decoration-dotted decoration-from-font">{title}</h3>
        </ShadTooltipTrigger>
        <ShadTooltipContent>
          <p className="max-w-xs">{description}</p>
        </ShadTooltipContent>
      </ShadTooltip>
    </ShadTooltipProvider>
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis 
          stroke="hsl(var(--muted-foreground))" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          domain={['dataMin', 'dataMax']}
          tickFormatter={(value) => typeof value === 'number' ? value.toFixed(1) : value}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
          }}
          formatter={(value: number) => value.toFixed(2)}
        />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: color, fill: color }}  />
      </LineChart>
    </ResponsiveContainer>
  </div>
);


export default function ColorWheelPage({}) {
    const [activeColor, setActiveColor] = useState('#ff6347');
    const [tintCount, setTintCount] = useState(5);
    const [toneCount, setToneCount] = useState(5);
    const [shadeCount, setShadeCount] = useState(5);
    const [inputValue, setInputValue] = useState(activeColor);

    const { toast } = useToast();
    const { palette, setPalette } = usePaletteBuilder();
    const [libraryColors, setLibraryColors] = useState<string[]>([]);
    const [isClient, setIsClient] = useState(false);

    const paletteHexes = useMemo(() => new Set(palette.map(p => colord(p.hex).toHex())), [palette]);
    const libraryHexes = useMemo(() => new Set(libraryColors.map(c => colord(c).toHex())), [libraryColors]);

    // Analysis State
    const [simulationType, setSimulationType] = useState<SimulationType>('normal');
    const [correctLightness, setCorrectLightness] = useState(true);
    const [useBezier, setUseBezier] = useState(true);
    const [colorSpace, setColorSpace] = useState<ColorSpace>('lch');
    const [fgColor, setFgColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#FFFFFF');

    useEffect(() => {
        setIsClient(true);
        try {
            const savedColorsJSON = localStorage.getItem('saved_individual_colors');
            if (savedColorsJSON) {
                setLibraryColors(JSON.parse(savedColorsJSON));
            }
        } catch (e) { console.error(e); }
    }, []);
    
    const handleToggleLibrary = useCallback((color: string) => {
        const normalizedColor = colord(color).toHex();
        const isInLibrary = libraryHexes.has(normalizedColor);
        
        const result = isInLibrary ? removeColorFromLibrary(color) : saveColorToLibrary(color);
        toast({ title: result.message, variant: result.success ? 'default' : 'destructive' });

        if (result.success) {
            const newLibrary = isInLibrary
                ? libraryColors.filter(c => colord(c).toHex() !== normalizedColor)
                : [...libraryColors, normalizedColor];
            setLibraryColors(newLibrary);
        }
    }, [libraryColors, libraryHexes, toast]);

    const handleAddToPalette = useCallback((color: string) => {
        if (palette.length >= 20) {
            toast({ title: "Palette is full (20 colors max).", variant: "destructive" });
            return;
        }
        const newPaletteColor = { id: Date.now(), hex: color, locked: false };
        setPalette(p => [...p, newPaletteColor]);
        toast({ title: "Color added to palette!" });
    }, [palette.length, setPalette, toast]);

    const handleRemoveFromPalette = useCallback((color: string) => {
        const normalizedColor = colord(color).toHex();
        setPalette(currentPalette => currentPalette.filter(p => colord(p.hex).toHex() !== normalizedColor));
        toast({ title: 'Color removed from palette.' });
    }, [setPalette, toast]);


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

    const [activeHarmony, setActiveHarmony] = useState(harmonyInfo[0]);
    const activeHarmonyColors = useMemo(() => activeHarmony.colors, [activeHarmony]);

    // Analysis Logic
    useEffect(() => {
      if (activeHarmonyColors.length > 0) {
          setFgColor(activeHarmonyColors[0]);
          if(activeHarmonyColors.length > 1) {
            setBgColor(activeHarmonyColors[activeHarmonyColors.length - 1]);
          }
      }
    }, [activeHarmonyColors]);
    
    const interpolationMode = useMemo(() => {
        if (colorSpace === 'hwb' || colorSpace === 'srgb') return 'lch';
        return colorSpace;
    }, [colorSpace]);
    
    const analysisSourcePalette = useMemo(() => {
        if (activeHarmonyColors.length < 2) return activeHarmonyColors;
        if (!useBezier && !correctLightness) {
            return activeHarmonyColors;
        }
        const interpolator = useBezier ? chroma.bezier(activeHarmonyColors) : activeHarmonyColors;
        let scale = chroma.scale(interpolator).mode(interpolationMode as any);
        if (correctLightness) {
            scale = scale.correctLightness();
        }
        return scale.colors(activeHarmonyColors.length);
    }, [activeHarmonyColors, useBezier, correctLightness, interpolationMode]);
  
    const simulatedPalette = useMemo(() => {
        if (analysisSourcePalette.length === 0) return [];
        const source = (useBezier || correctLightness) ? analysisSourcePalette : activeHarmonyColors;
        return source.map(color => simulate(color, simulationType));
    }, [analysisSourcePalette, activeHarmonyColors, simulationType, useBezier, correctLightness]);
  
    const graphData = useMemo(() => getGraphData(analysisSourcePalette, colorSpace), [analysisSourcePalette, colorSpace]);
    
    const isPaletteColorblindSafe = useMemo(() => {
        if (activeHarmonyColors.length < 2) return true;

        for(let i=0; i < simulatedPalette.length - 1; i++){
            if(chroma.contrast(simulatedPalette[i], simulatedPalette[i+1]) < 1.15){
                return false;
            }
        }
        return true;
    }, [activeHarmonyColors, simulatedPalette]);


    const renderColorGrid = (colors: string[]) => (
        <div className="flex flex-wrap gap-4 mt-4">
            {colors.map((c, i) => {
                if (!isClient) {
                    return <Skeleton key={i} className="w-40 h-[72px]" />;
                }
                const normalizedColor = colord(c).toHex();
                const isInLibrary = libraryHexes.has(normalizedColor);
                const isInPalette = paletteHexes.has(normalizedColor);

                return (
                    <div key={`${c}-${i}`} className="w-40">
                         <ColorBox
                            color={c}
                            variant="compact"
                            onAddToLibrary={!isInLibrary ? () => handleToggleLibrary(c) : undefined}
                            onRemoveFromLibrary={isInLibrary ? () => handleToggleLibrary(c) : undefined}
                            onAddToPalette={!isInPalette ? () => handleAddToPalette(c) : undefined}
                            onRemoveFromPalette={isInPalette ? () => handleRemoveFromPalette(c) : undefined}
                         />
                    </div>
                );
            })}
        </div>
    );
    
    const renderAnalysisPanel = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="flex justify-between items-center text-sm">
                        <Label>Simulated View</Label>
                        <AnimatePresence>
                            {isPaletteColorblindSafe ? (
                                <motion.span
                                    key="safe"
                                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                    className="flex items-center text-xs text-green-500 gap-1.5"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Adjacent contrast OK
                                </motion.span>
                            ) : (
                                 <motion.span
                                    key="unsafe"
                                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                    className="flex items-center text-xs text-amber-500 gap-1.5"
                                >
                                    <AlertTriangle className="h-3.5 w-3.5" /> Low adjacent contrast
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative group/palette w-full h-16 rounded-md overflow-hidden border">
                        <div className="h-full w-full flex">
                            {simulatedPalette.map((color, index) => (
                                <div key={index} style={{ backgroundColor: color }} className="flex-1" />
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                       <div className="space-y-1.5">
                            <Label className="text-sm">Simulate Deficiency</Label>
                            <RadioGroup defaultValue="normal" value={simulationType} onValueChange={(value) => setSimulationType(value as SimulationType)} className="flex flex-wrap items-center gap-1 border rounded-md p-1">
                                <RadioGroupItem value="normal" id="sb-normal" className="sr-only" />
                                <Label htmlFor="sb-normal" className={cn("px-2 py-1 cursor-pointer text-xs rounded-sm", simulationType === 'normal' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Normal</Label>
                                <RadioGroupItem value="deutan" id="sb-deutan" className="sr-only" />
                                <Label htmlFor="sb-deutan" className={cn("px-2 py-1 cursor-pointer text-xs rounded-sm", simulationType === 'deutan' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Deutan</Label>
                                <RadioGroupItem value="deuteranomaly" id="sb-deuteranomaly" className="sr-only" />
                                <Label htmlFor="sb-deuteranomaly" className={cn("px-2 py-1 cursor-pointer text-xs rounded-sm", simulationType === 'deuteranomaly' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Deuteranomaly</Label>
                                <RadioGroupItem value="protan" id="sb-protan" className="sr-only" />
                                <Label htmlFor="sb-protan" className={cn("px-2 py-1 cursor-pointer text-xs rounded-sm", simulationType === 'protan' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Protan</Label>
                                <RadioGroupItem value="tritan" id="sb-tritan" className="sr-only" />
                                <Label htmlFor="sb-tritan" className={cn("px-2 py-1 cursor-pointer text-xs rounded-sm", simulationType === 'tritan' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Tritan</Label>
                            </RadioGroup>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm">Graph Color Space</Label>
                            <Select value={colorSpace} onValueChange={(v) => setColorSpace(v as ColorSpace)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select colorspace..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(colorSpaceInfo).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>{value.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="useBezier" checked={useBezier} onCheckedChange={(checked) => setUseBezier(!!checked)} />
                                <ShadTooltipProvider>
                                    <ShadTooltip>
                                        <ShadTooltipTrigger asChild>
                                            <Label htmlFor="useBezier" className="cursor-help underline decoration-dotted decoration-from-font">Bezier interpolation</Label>
                                        </ShadTooltipTrigger>
                                        <ShadTooltipContent>
                                            <p className="max-w-xs">Smooths the line between colors using a curve, creating a more natural transition.</p>
                                        </ShadTooltipContent>
                                    </ShadTooltip>
                                </ShadTooltipProvider>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="correctLightness" checked={correctLightness} onCheckedChange={(checked) => setCorrectLightness(!!checked)} />
                                <Label htmlFor="correctLightness">Correct lightness</Label>
                            </div>
                        </div>
                    </div>
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="space-y-2 pt-4">
                        {graphData.map((graph, i) => (
                            <ChartDisplay 
                                key={`${graph.title}-${i}`}
                                data={graph.data} 
                                title={graph.title} 
                                description={graph.description}
                                color={`hsl(var(--chart-${(i % 5) + 1}))`}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );

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
                <div className="w-full max-w-sm">
                     <ColorBox
                        variant="default"
                        color={activeColor}
                        onAddToLibrary={isClient && !libraryHexes.has(colord(activeColor).toHex()) ? () => handleToggleLibrary(activeColor) : undefined}
                        onRemoveFromLibrary={isClient && libraryHexes.has(colord(activeColor).toHex()) ? () => handleToggleLibrary(activeColor) : undefined}
                    />
                </div>
            </div>
            
            <section className="w-full max-w-4xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Color Harmonies</CardTitle>
                        <CardDescription>Select a tab to view a different harmonic relationship based on your selected color.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs 
                            defaultValue={harmonyInfo[0].name} 
                            className="w-full"
                            onValueChange={(value) => setActiveHarmony(harmonyInfo.find(h => h.name === value) || harmonyInfo[0])}
                        >
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
                                            {harmony.colors.map((c, i) => {
                                                if (!isClient) {
                                                    return <Skeleton key={i} className="w-40 h-[72px]" />;
                                                }
                                                const normalizedColor = colord(c).toHex();
                                                const isInLibrary = libraryHexes.has(normalizedColor);
                                                const isInPalette = paletteHexes.has(normalizedColor);
                                                return (
                                                    <div key={`${c}-${i}`} className="w-40">
                                                        <ColorBox
                                                            color={c}
                                                            variant="compact"
                                                            onAddToLibrary={!isInLibrary ? () => handleToggleLibrary(c) : undefined}
                                                            onRemoveFromLibrary={isInLibrary ? () => handleToggleLibrary(c) : undefined}
                                                            onAddToPalette={!isInPalette ? () => handleAddToPalette(c) : undefined}
                                                            onRemoveFromPalette={isInPalette ? () => handleRemoveFromPalette(c) : undefined}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Harmony Analysis</CardTitle>
                        <CardDescription>Analyze the currently selected harmony for accessibility and contrast.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                        <Tabs defaultValue="palette-analysis" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="palette-analysis">Palette Analysis</TabsTrigger>
                                <TabsTrigger value="contrast-checker">Contrast Checker</TabsTrigger>
                            </TabsList>
                            <TabsContent value="palette-analysis" className="p-4 flex-grow min-h-0">
                                {renderAnalysisPanel()}
                            </TabsContent>
                            <TabsContent value="contrast-checker" className="p-4 flex-grow min-h-0">
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                         <ContrastGrid colors={activeHarmonyColors} />
                                    </div>
                                    <div className="space-y-4">
                                         <div className="grid grid-cols-2 gap-4">
                                             <div>
                                                <Label className="text-sm font-medium mb-2 block">Text Color</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" className="justify-start gap-2 w-full">
                                                            <div className="w-4 h-4 rounded border" style={{backgroundColor: fgColor}}></div>
                                                            {fgColor.toUpperCase()}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="p-0">
                                                        <ColorPickerClient color={fgColor} onChange={(c) => setFgColor(c.hex)} />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                             <div>
                                                <Label className="text-sm font-medium mb-2 block">Background Color</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" className="justify-start gap-2 w-full">
                                                            <div className="w-4 h-4 rounded border" style={{backgroundColor: bgColor}}></div>
                                                            {bgColor.toUpperCase()}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="p-0">
                                                        <ColorPickerClient color={bgColor} onChange={(c) => setBgColor(c.hex)} />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                         </div>
                                        
                                        <div
                                            className="p-4 rounded-lg text-center border-2 border-dashed flex items-center justify-center h-40"
                                            style={{ backgroundColor: bgColor, color: fgColor }}
                                        >
                                            <p className="font-bold text-[64pt]">Aa</p>
                                        </div>
                                        
                                        <WCAGDisplay textColor={fgColor} bgColor={bgColor} />
                                    </div>
                                </div>
                            </TabsContent>
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
                                {renderColorGrid(tints)}
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
                                {renderColorGrid(tones)}
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
                                {renderColorGrid(shades)}
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
