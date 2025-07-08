
"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import cmykPlugin from 'colord/plugins/cmyk';
import lchPlugin from 'colord/plugins/lch';
import labPlugin from 'colord/plugins/lab';
import hwbPlugin from 'colord/plugins/hwb';
import chroma from 'chroma-js';
import { generatePalette, getRandomColor, type GenerationType, adjustForColorblindSafety } from '@/lib/palette-generator';
import type { PaletteColor } from '@/lib/palette-generator';
import { simulate, type SimulationType } from '@/lib/colorblind';
import { analyzePalette } from '@/lib/palette-analyzer';
import { Palette } from '@/components/palettes/Palette';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tooltip as ShadTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, Dices, Pencil, Sparkles, Pipette, Unlock, Lock, Library, Copy, MousePointerClick } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { ColorBox } from '@/components/colors/ColorBox';
import { Slider } from '@/components/ui/slider';
import type { ColorResult } from 'react-color';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePaletteBuilder } from '@/contexts/PaletteBuilderContext';
import { saveColorToLibrary, removeColorFromLibrary } from '@/lib/colors';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ColorPickerClient from '@/components/colors/ColorPickerClient';
import { WCAGDisplay } from '@/components/colors/WCAGDisplay';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContrastGrid } from '@/components/colors/ContrastGrid';


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

extend([hwbPlugin, cmykPlugin, lchPlugin, labPlugin]);

const ColorWheel = dynamic(() => import('@uiw/react-color-wheel').then(mod => mod.default), {
  ssr: false,
  loading: () => (
      <div className="flex justify-center items-center w-[280px] h-[280px]">
        <Skeleton className="w-full h-full rounded-full" />
      </div>
  )
});

type ColorSpace = 'lch' | 'lab' | 'hsl' | 'hwb' | 'srgb';

const colorSpaceInfo: Record<ColorSpace, { name: string; components: string[]; descriptions: string[] }> = {
  lch: { name: 'LCH', components: ['L', 'C', 'H'], descriptions: ['Lightness (0-100)', 'Chroma (0-150)', 'Hue (0-360)'] },
  lab: { name: 'Lab', components: ['L*', 'a*', 'b*'], descriptions: ['Lightness', 'Green-Red', 'Blue-Yellow'] },
  hsl: { name: 'HSL', components: ['H', 'S', 'L'], descriptions: ['Hue (0-360)', 'Saturation (0-1)', 'Lightness (0-1)'] },
  hwb: { name: 'HWB', components: ['H', 'W', 'B'], descriptions: ['Hue (0-360)', 'Whiteness (0-100)', 'Blackness (0-100)'] },
  srgb: { name: 'sRGB', components: ['R', 'G', 'B'], descriptions: ['Red (0-255)', 'Green (0-255)', 'Blue (0-255)'] },
};


// Helper to get graph data
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

// Graph Component
const ChartDisplay = ({ data, title, color, description }: { data: { name: number; value: number }[], title: string, color: string, description: string }) => (
  <div>
    <TooltipProvider>
      <ShadTooltip>
        <TooltipTrigger asChild>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 cursor-help underline decoration-dotted decoration-from-font">{title}</h3>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{description}</p>
        </TooltipContent>
      </ShadTooltip>
    </TooltipProvider>
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

const allGenerationTypes: GenerationType[] = ['analogous', 'triadic', 'complementary', 'tints', 'shades'];

function PaletteBuilderPage() {
    const { 
        mainColor, setMainColor, 
        palette, setPalette, 
        generationType, setGenerationType,
        isHarmonyLocked, setIsHarmonyLocked,
        paletteToLoad, loadPalette, clearPaletteToLoad
    } = usePaletteBuilder();

    const [simulationType, setSimulationType] = useState<SimulationType>('normal');
    const [correctLightness, setCorrectLightness] = useState(true);
    const [useBezier, setUseBezier] = useState(true);
    const [inputValue, setInputValue] = useState(mainColor);
    const [colorSpace, setColorSpace] = useState<ColorSpace>('lch');
    const [contrastBgColor, setContrastBgColor] = useState('#ffffff');
    
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [newPaletteName, setNewPaletteName] = useState("");
    const [editingPaletteId, setEditingPaletteId] = useState<number | null>(null);
    const [editingColorId, setEditingColorId] = useState<number | null>(null);
    const [libraryColors, setLibraryColors] = useState<string[]>([]);
    const libraryHexes = useMemo(() => new Set(libraryColors.map(c => colord(c).toHex())), [libraryColors]);

    const { toast } = useToast();
    const router = useRouter();
    const isInitialLoad = useRef(true);

    useEffect(() => {
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
  
    const hasLockedColors = useMemo(() => palette.some(c => c.locked), [palette]);

    // When the main color changes, update the currently editing swatch in the palette
    useEffect(() => {
        if (editingColorId !== null) {
            setPalette(prev => prev.map(p => p.id === editingColorId ? { ...p, hex: mainColor } : p));
        }
    }, [mainColor, editingColorId, setPalette]);
  
    useEffect(() => {
        setInputValue(mainColor);
    }, [mainColor]);

    const mainHsl = useMemo(() => colord(mainColor).toHsl(), [mainColor]);

    const handleLightnessChange = (newLightness: number[]) => {
        const newColor = colord({ ...mainHsl, l: newLightness[0] }).toHex();
        setMainColor(newColor);
    };

    const handleSaturationChange = (newSaturation: number[]) => {
        const newColor = colord({ ...mainHsl, s: newSaturation[0] }).toHex();
        setMainColor(newColor);
    };

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        if (colord(value).isValid()) {
            setMainColor(value);
        }
    }, [setMainColor]);

    const handleInputBlur = useCallback(() => {
        if (!colord(inputValue).isValid()) {
            setInputValue(mainColor);
        }
    }, [inputValue, mainColor]);

    const regeneratePalette = useCallback((base: string, type: GenerationType) => {
        const newHexes = generatePalette({
            numColors: palette.length || 5,
            type: type,
            baseColors: [base],
        });

        setPalette(currentPalette => {
            const lockedColors = new Map(currentPalette.filter(p => p.locked).map(p => [p.id, p.hex]));
            if (lockedColors.size > 0) {
                 const newPalette = [...currentPalette];
                 const unlockedIndices: number[] = [];
                 currentPalette.forEach((p, i) => { if (!p.locked) unlockedIndices.push(i); });
                 
                 unlockedIndices.forEach((paletteIndex, i) => {
                    newPalette[paletteIndex].hex = newHexes[i % newHexes.length];
                });
                return newPalette;
            } else {
                 newHexes[0] = base;
                 return newHexes.map((hex, i) => ({
                    id: currentPalette[i]?.id || Date.now() + i,
                    hex,
                    locked: currentPalette[i]?.locked || false
                 }));
            }
        });
    }, [palette.length, setPalette]);

    useEffect(() => {
        if (paletteToLoad) {
            setPalette(paletteToLoad.colors.map((hex, i) => ({ id: Date.now() + i, hex, locked: false })));
            setMainColor(paletteToLoad.colors[0] || '#FF9800');
            setNewPaletteName(paletteToLoad.name || '');
            setEditingPaletteId(paletteToLoad.id);
            toast({ title: `Loaded "${paletteToLoad.name}" for editing.` });
            clearPaletteToLoad();
        } else if (isInitialLoad.current && palette.length === 0) {
            const initialHexes = generatePalette({ numColors: 5, type: 'analogous', baseColors: [mainColor] });
            initialHexes[0] = mainColor;
            setPalette(initialHexes.map((hex, i) => ({ id: Date.now() + i, hex, locked: false })));
        }
        isInitialLoad.current = false;
    }, [paletteToLoad, clearPaletteToLoad, setPalette, setMainColor, mainColor, palette.length, toast]);

    const handleMix = useCallback(() => {
        const newType = allGenerationTypes[Math.floor(Math.random() * allGenerationTypes.length)];
        setGenerationType(newType);
        regeneratePalette(mainColor, newType);
        toast({ title: `Generated ${newType} palette`});
    }, [regeneratePalette, mainColor, setGenerationType, toast]);

    const handleRandomize = useCallback(() => {
        setEditingPaletteId(null);
        setEditingColorId(null);
        setPalette(prev => prev.map(c => ({...c, locked: false})));
        const newMainColor = getRandomColor();
        setMainColor(newMainColor);
        if (!isHarmonyLocked) {
            const newType = allGenerationTypes[Math.floor(Math.random() * allGenerationTypes.length)];
            setGenerationType(newType);
             const newHexes = generatePalette({ numColors: 5, type: newType, baseColors: [newMainColor] });
             setPalette(newHexes.map((hex, i) => ({ id: Date.now() + i, hex, locked: false })))
        } else {
            regeneratePalette(newMainColor, generationType);
        }
        toast({ title: "Palette Randomized!" });
    }, [toast, isHarmonyLocked, setPalette, setMainColor, setGenerationType, regeneratePalette, generationType]);
    
    const handleSetActiveColor = useCallback((id: number, hex: string) => {
        setMainColor(hex);
        setEditingColorId(id);
    }, [setMainColor]);

    const handleOpenSaveDialog = useCallback(() => {
        if (palette.length === 0) {
            toast({ title: "Cannot save empty palette", variant: "destructive" });
            return;
        }
        if (editingPaletteId) {
            const savedPalettesJSON = localStorage.getItem('saved_palettes');
            const savedPalettes = savedPalettesJSON ? JSON.parse(savedPalettesJSON) : [];
            const existingPalette = savedPalettes.find((p: any) => p.id === editingPaletteId);
            if (existingPalette) {
                setNewPaletteName(existingPalette.name);
            }
        } else {
            const detectedHarmony = analyzePalette(palette.map(p => p.hex));
            setNewPaletteName(detectedHarmony === 'Custom' ? 'My Custom Palette' : `${detectedHarmony} Palette`);
        }
        setIsSaveDialogOpen(true);
    }, [palette, toast, editingPaletteId]);

    const handleSaveToLibrary = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!newPaletteName.trim()) {
            toast({ title: "Please enter a name for the palette.", variant: "destructive" });
            return;
        }

        const savedPalettesJSON = localStorage.getItem('saved_palettes');
        let savedPalettes = savedPalettesJSON ? JSON.parse(savedPalettesJSON) : [];

        if (editingPaletteId) {
            savedPalettes = savedPalettes.map((p: any) => 
                p.id === editingPaletteId 
                ? { ...p, name: newPaletteName, colors: palette.map(c => c.hex) } 
                : p
            );
            toast({ title: "Palette Updated!", description: `"${newPaletteName}" has been updated.` });
        } else {
            const newPalette = {
                id: Date.now(),
                name: newPaletteName,
                colors: palette.map(p => p.hex)
            };
            savedPalettes.push(newPalette);
            toast({ title: "Palette Saved!", description: `"${newPaletteName}" saved to your library.` });
        }

        localStorage.setItem('saved_palettes', JSON.stringify(savedPalettes));
        
        setIsSaveDialogOpen(false);
        setNewPaletteName("");
        setEditingPaletteId(null);
    }, [palette, newPaletteName, toast, editingPaletteId]);

    const handleLockToggle = useCallback((id: number) => {
        setPalette(prev => prev.map(c => c.id === id ? { ...c, locked: !c.locked } : c));
    }, [setPalette]);

    const handleRemoveColor = useCallback((id: number) => {
        if (palette.length <= 2) {
            toast({ title: "Minimum 2 colors required.", variant: "destructive" });
            return;
        }
        setPalette(palette.filter(c => c.id !== id));
    }, [palette, toast, setPalette]);

    const handleAddColorAtIndex = useCallback((index: number) => {
        if (palette.length >= 20) {
            toast({ title: 'Maximum of 20 colors reached.', variant: 'destructive' });
            return;
        }
        setPalette(prev => {
            const newPalette = [...prev];
            const colorBefore = prev[index - 1]?.hex || null;
            const colorAfter = prev[index]?.hex || null;
            
            let newHex: string;

            if (colorBefore && colorAfter) {
                newHex = chroma.mix(colorBefore, colorAfter, 0.5, 'lch').hex();
            } else if (colorBefore) {
                newHex = chroma(colorBefore).set('lch.l', '*0.8').hex();
            } else if (colorAfter) {
                newHex = chroma(colorAfter).set('lch.l', '*1.2').hex();
            } else {
                newHex = getRandomColor();
            }

            const newColor: PaletteColor = {
                id: Date.now(),
                hex: newHex,
                locked: false,
            };

            newPalette.splice(index, 0, newColor);
            
            return adjustForColorblindSafety(newPalette);
        });
    }, [palette.length, toast, setPalette]);

    const handleUnlockAll = useCallback(() => {
        setPalette(prev => prev.map(c => ({...c, locked: false})));
        toast({ title: "All colors unlocked" });
    }, [toast, setPalette]);

    const handleApplyAnalyzedPalette = useCallback((newHexes: string[]) => {
        setPalette(newHexes.map((hex, i) => ({ 
            id: palette[i]?.id || Date.now() + i, 
            hex, 
            locked: false
        })));
        toast({ title: "Palette Updated", description: "The analyzed palette has been applied to the editor." });
    }, [palette, toast, setPalette]);

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
            setMainColor(sRGBHex);
            toast({ title: "Color Picked!", description: `Set active color to ${sRGBHex}` });
        } catch (e) {
            console.log("EyeDropper cancelled");
        }
    };

    const paletteHexes = useMemo(() => palette.map(p => p.hex), [palette]);

    const interpolationMode = useMemo(() => {
        if (colorSpace === 'hwb' || colorSpace === 'srgb') return 'lch';
        return colorSpace;
    }, [colorSpace]);
    
    const analysisSourcePalette = useMemo(() => {
        if (paletteHexes.length < 2) return paletteHexes;
        if (!useBezier && !correctLightness) {
            return paletteHexes;
        }
        const interpolator = useBezier ? chroma.bezier(paletteHexes) : paletteHexes;
        let scale = chroma.scale(interpolator).mode(interpolationMode as any);
        if (correctLightness) {
            scale = scale.correctLightness();
        }
        return scale.colors(paletteHexes.length);
    }, [paletteHexes, useBezier, correctLightness, interpolationMode]);
  
    const simulatedPalette = useMemo(() => {
        if (analysisSourcePalette.length === 0) return [];
        const source = (useBezier || correctLightness) ? analysisSourcePalette : paletteHexes;
        return source.map(color => simulate(color, simulationType));
    }, [analysisSourcePalette, paletteHexes, simulationType, useBezier, correctLightness]);
  
    const graphData = useMemo(() => getGraphData(analysisSourcePalette, colorSpace), [analysisSourcePalette, colorSpace]);
  
    const { isPaletteColorblindSafe } = useMemo(() => {
        if (palette.length < 2) return { isPaletteColorblindSafe: true, adjustedPalette: palette };
        const adjusted = adjustForColorblindSafety(palette);
        let isSafe = true;
        for(let i=0; i < adjusted.length -1; i++){
            if(chroma.contrast(adjusted[i].hex, adjusted[i+1].hex) < 1.1){
                isSafe = false;
                break;
            }
        }
        return { isPaletteColorblindSafe: isSafe, adjustedPalette: adjusted };
    }, [palette]);

    const detectedHarmony = useMemo(() => {
        return analyzePalette(palette.map(p => p.hex));
    }, [palette]);

    const analysisPanel = useMemo(() => (
        <Card className="h-full flex flex-col">
            <Tabs defaultValue="palette-analysis" className="w-full flex flex-col flex-grow">
                <div className="p-4 border-b shrink-0">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="palette-analysis">Palette Analysis</TabsTrigger>
                        <TabsTrigger value="contrast-checker">Contrast Checker</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="palette-analysis" className="p-4 flex-grow min-h-0 overflow-y-auto">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center text-sm">
                                <Label>Detected Harmony</Label>
                                <Badge variant="outline" className="font-semibold">{detectedHarmony}</Badge>
                            </div>
                            <Separator />
                            <div className="flex flex-col gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-sm">Color Space</Label>
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
                                        <TooltipProvider>
                                            <ShadTooltip>
                                                <TooltipTrigger asChild>
                                                    <Label htmlFor="useBezier" className="cursor-help underline decoration-dotted decoration-from-font">Bezier interpolation</Label>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="max-w-xs">Smooths the line between colors using a curve, creating a more natural transition.</p>
                                                </TooltipContent>
                                            </ShadTooltip>
                                        </TooltipProvider>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="correctLightness" checked={correctLightness} onCheckedChange={(checked) => setCorrectLightness(!!checked)} />
                                        <Label htmlFor="correctLightness">Correct lightness</Label>
                                    </div>
                                </div>
                                <div className="flex flex-col items-start gap-2">
                                    <Label className="text-sm">Simulate Deficiency:</Label>
                                    <RadioGroup defaultValue="normal" value={simulationType} onValueChange={(value) => setSimulationType(value as SimulationType)} className="flex flex-wrap items-center gap-1 border rounded-md p-1">
                                        <RadioGroupItem value="normal" id="sb-normal" className="sr-only" />
                                        <Label htmlFor="sb-normal" className={cn("px-3 py-1 cursor-pointer text-sm rounded-sm", simulationType === 'normal' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Normal</Label>
                                        <RadioGroupItem value="deutan" id="sb-deutan" className="sr-only" />
                                        <Label htmlFor="sb-deutan" className={cn("px-3 py-1 cursor-pointer text-sm rounded-sm", simulationType === 'deutan' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Deutan</Label>
                                        <RadioGroupItem value="deuteranomaly" id="sb-deuteranomaly" className="sr-only" />
                                        <Label htmlFor="sb-deuteranomaly" className={cn("px-3 py-1 cursor-pointer text-sm rounded-sm", simulationType === 'deuteranomaly' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Deuteranomaly</Label>
                                        <RadioGroupItem value="protan" id="sb-protan" className="sr-only" />
                                        <Label htmlFor="sb-protan" className={cn("px-3 py-1 cursor-pointer text-sm rounded-sm", simulationType === 'protan' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Protan</Label>
                                        <RadioGroupItem value="tritan" id="sb-tritan" className="sr-only" />
                                        <Label htmlFor="sb-tritan" className={cn("px-3 py-1 cursor-pointer text-sm rounded-sm", simulationType === 'tritan' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Tritan</Label>
                                    </RadioGroup>
                                </div>
                            </div>
                            <div className="h-5">
                                <AnimatePresence>
                                    {isPaletteColorblindSafe && (
                                        <motion.span
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex items-center text-sm text-green-500"
                                        >
                                            <CheckCircle2 className="mr-2 h-4 w-4" /> This palette appears to be colorblind-safe.
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="relative group/palette w-full h-16">
                                <div className="absolute inset-0 overflow-hidden rounded-md border group-hover/palette:opacity-100 transition-opacity">
                                    <div className="absolute inset-0 -bottom-10 flex items-center justify-center opacity-0 pointer-events-none group-hover/palette:opacity-100">
                                        <Button
                                            onClick={() => handleApplyAnalyzedPalette(simulatedPalette)}
                                            variant="secondary"
                                            className="pointer-events-auto"
                                        >
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Use This Palette
                                        </Button>
                                    </div>
                                </div>
                                <div className="absolute inset-0 overflow-hidden rounded-md border pointer-events-none">
                                    <div className="h-full w-full flex">
                                        {simulatedPalette.map((color, index) => (
                                            <div key={index} style={{ backgroundColor: color }} className="flex-1" />
                                        ))}
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
                </TabsContent>
                <TabsContent value="contrast-checker" className="p-4 flex-grow min-h-0 overflow-y-auto">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <ContrastGrid colors={paletteHexes} />
                            <div className="text-sm">Text Color: {mainColor.toUpperCase()}</div>
                             <div>
                                <div className="text-sm mb-2">Background Color</div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="justify-start gap-2">
                                            <div className="w-4 h-4 rounded border" style={{backgroundColor: contrastBgColor}}></div>
                                            {contrastBgColor.toUpperCase()}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0">
                                        <ColorPickerClient color={contrastBgColor} onChange={(c) => setContrastBgColor(c.hex)} />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div
                                className="p-4 rounded-lg text-center border-2 border-dashed flex items-center justify-center h-40"
                                style={{ backgroundColor: contrastBgColor, color: mainColor }}
                            >
                                <p className="font-bold text-[64pt]">Aa</p>
                            </div>
                            
                            <WCAGDisplay textColor={mainColor} bgColor={contrastBgColor} />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </Card>
    ), [
        useBezier,
        correctLightness,
        simulationType,
        isPaletteColorblindSafe,
        simulatedPalette,
        handleApplyAnalyzedPalette,
        detectedHarmony,
        colorSpace,
        graphData,
        paletteHexes,
        mainColor,
        contrastBgColor,
    ]);

    const paletteActions = (
        <TooltipProvider>
            <div className="flex w-full flex-col gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <ShadTooltip>
                        <TooltipTrigger asChild><Button onClick={handleMix} size="sm" disabled={isHarmonyLocked}><Dices className="mr-2 h-4 w-4" />Mix</Button></TooltipTrigger>
                        <TooltipContent><p>Generates a new palette using a different harmony.</p></TooltipContent>
                    </ShadTooltip>
                     <ShadTooltip>
                        <TooltipTrigger asChild><Button onClick={handleRandomize} size="sm" variant="outline"><Sparkles className="mr-2 h-4 w-4" />Randomize</Button></TooltipTrigger>
                        <TooltipContent><p>Generates a completely new random palette.</p></TooltipContent>
                    </ShadTooltip>
                     <ShadTooltip>
                        <TooltipTrigger asChild><Button onClick={handleUnlockAll} variant="outline" size="sm" disabled={!hasLockedColors}><Unlock className="mr-2 h-4 w-4" />Unlock All</Button></TooltipTrigger>
                        <TooltipContent><p>Unlocks all colors in the current palette.</p></TooltipContent>
                    </ShadTooltip>
                     <ShadTooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={handleOpenSaveDialog}>
                                {editingPaletteId ? <Pencil className="mr-2 h-4 w-4" /> : null}
                                {editingPaletteId ? 'Update Palette' : 'Save'}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Save the current palette to your library.</p></TooltipContent>
                    </ShadTooltip>
                </div>
                <div className="flex items-center gap-2">
                    <Label htmlFor="generationType" className="text-xs shrink-0">Type</Label>
                    <Select 
                        value={generationType} 
                        onValueChange={(value) => {
                            if (!isHarmonyLocked) {
                                setGenerationType(value as GenerationType);
                            }
                        }}
                        disabled={hasLockedColors}
                    >
                        <SelectTrigger id="generationType" className="w-[150px] h-9">
                            <div className="flex items-center gap-1.5">
                            <SelectValue placeholder="Select type" />
                            {isHarmonyLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {allGenerationTypes.map(type => (
                                    <SelectItem key={type} value={type} className="capitalize" disabled={isHarmonyLocked}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                            <Separator className="my-1" />
                             <ShadTooltip>
                                <TooltipTrigger asChild>
                                    <div className="p-1">
                                        <button
                                            onPointerDown={(e) => e.preventDefault()}
                                            onClick={() => setIsHarmonyLocked(v => !v)}
                                            className="w-full flex items-center justify-start gap-2 text-sm p-1.5 rounded-sm hover:bg-accent focus:bg-accent outline-none"
                                        >
                                            {isHarmonyLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                            <span>{isHarmonyLocked ? 'Unlock Harmony' : 'Lock Harmony'}</span>
                                        </button>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="right"><p>Prevents the harmony type from changing during randomization.</p></TooltipContent>
                            </ShadTooltip>
                        </SelectContent>
                    </Select>
                    {hasLockedColors && <p className="text-xs text-muted-foreground mt-1">Unlock all to change type.</p>}
                </div>
            </div>
        </TooltipProvider>
    );

    return (
        <div className="flex h-full overflow-hidden">
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleSaveToLibrary}>
                        <DialogHeader>
                            <DialogTitle>{editingPaletteId ? 'Edit Palette' : 'Save Palette'}</DialogTitle>
                            <DialogDescription>
                                Give your palette a name. Click save when you're done.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    value={newPaletteName}
                                    onChange={(e) => setNewPaletteName(e.target.value)}
                                    className="col-span-3"
                                    placeholder="e.g. Sunset Vibes"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">{editingPaletteId ? 'Update' : 'Save'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_550px] gap-4 md:gap-8 p-4 md:p-8 overflow-y-auto">
                <div className="flex flex-col gap-8 min-h-0">
                    <section className="flex flex-col lg:flex-row items-center justify-center gap-8 w-full">
                        <div className="w-full lg:w-auto flex justify-center">
                            <div className="flex items-center justify-center gap-4">
                                <div className="flex flex-col items-center gap-4">
                                    <ColorWheel
                                        color={mainColor}
                                        onChange={(color: ColorResult) => setMainColor(color.hex)}
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
                                        <TooltipProvider>
                                            <ShadTooltip>
                                                <TooltipTrigger asChild>
                                                    <Button onClick={handleEyeDropper} variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                                                        <Pipette className="h-4 w-4" />
                                                        <span className="sr-only">Pick from screen</span>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Pick a color from your screen</p>
                                                </TooltipContent>
                                            </ShadTooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>
                                <div className="flex gap-4 h-[280px]">
                                    <div className="flex flex-col items-center gap-2">
                                        <Slider
                                            orientation="vertical"
                                            value={[mainHsl.s]}
                                            onValueChange={handleSaturationChange}
                                            max={100}
                                            step={1}
                                        />
                                        <Label className="text-xs text-muted-foreground">S</Label>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <Slider
                                            orientation="vertical"
                                            value={[mainHsl.l]}
                                            onValueChange={handleLightnessChange}
                                            max={100}
                                            step={1}
                                        />
                                        <Label className="text-xs text-muted-foreground">L</Label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full lg:w-auto flex justify-center">
                             <div className="w-full max-w-sm relative group/container" onClick={() => setEditingColorId(null)} >
                                 <ColorBox
                                    variant="default"
                                    color={mainColor}
                                    onAddToLibrary={!libraryHexes.has(colord(mainColor).toHex()) ? () => handleToggleLibrary(mainColor) : undefined}
                                    onRemoveFromLibrary={libraryHexes.has(colord(mainColor).toHex()) ? () => handleToggleLibrary(mainColor) : undefined}
                                />
                            </div>
                        </div>
                    </section>
                    
                    <section className="w-full flex-grow min-h-0">
                        {analysisPanel}
                    </section>
                </div>
                
                <section className="flex flex-col min-h-0 lg:min-h-full">
                    <Palette
                        palette={palette}
                        editingColorId={editingColorId}
                        onLockToggle={handleLockToggle}
                        onRemoveColor={handleRemoveColor}
                        onAddColor={handleAddColorAtIndex}
                        onSetActiveColor={handleSetActiveColor}
                        actions={paletteActions}
                        onToggleLibrary={handleToggleLibrary}
                        libraryHexes={libraryHexes}
                    />
                </section>
            </main>
        </div>
    );
}

export default PaletteBuilderPage;





    

    










