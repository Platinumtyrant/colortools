
"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import cmykPlugin from 'colord/plugins/cmyk';
import lchPlugin from 'colord/plugins/lch';
import labPlugin from 'colord/plugins/lab';
import chroma from 'chroma-js';
import { generatePalette, getRandomColor, type GenerationType, adjustForColorblindSafety } from '@/lib/palette-generator';
import type { PaletteColor } from '@/lib/palette-generator';
import { simulate, type SimulationType } from '@/lib/colorblind';
import { analyzePalette } from '@/lib/palette-analyzer';
import { Palette } from '@/components/palettes/Palette';
import { PaletteGenerator } from '@/components/palettes/PaletteGenerator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tooltip as ShadTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, Contrast } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WCAGDisplay } from '@/components/colors/WCAGDisplay';
import { useSidebarExtension } from '@/contexts/SidebarExtensionContext';

extend([namesPlugin, cmykPlugin, lchPlugin, labPlugin]);

const ColorPickerClient = dynamic(() => import('@/components/colors/ColorPickerClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-sm space-y-3 rounded-lg border bg-card p-4 text-card-foreground h-full">
        <div className="flex gap-3 h-40">
            <Skeleton className="relative flex-1 cursor-pointer" />
            <Skeleton className="relative w-5 cursor-pointer" />
        </div>
        <Skeleton className="h-10 w-full" />
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

// Helper to get graph data
const getGraphData = (colors: string[]) => {
  if (!colors || colors.length === 0) return { lightness: [], saturation: [], hue: [] };
  const lch = colors.map(c => chroma(c).lch());
  return {
    lightness: lch.map((c, i) => ({ name: i + 1, value: c[0] })),
    saturation: lch.map((c, i) => ({ name: i + 1, value: c[1] })),
    hue: lch.map((c, i) => ({ name: i + 1, value: isNaN(c[2]) ? 0 : c[2] })),
  };
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
          tickFormatter={(value) => typeof value === 'number' ? value.toFixed(0) : value}
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


export default function UnifiedBuilderPage() {
  const [mainColor, setMainColor] = useState('#FF9800');
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [generationType, setGenerationType] = useState<GenerationType>('analogous');
  const [generationCycle, setGenerationCycle] = useState<GenerationType[]>(['analogous', 'triadic', 'complementary', 'tints', 'shades']);
  const [simulationType, setSimulationType] = useState<SimulationType>('normal');
  const [correctLightness, setCorrectLightness] = useState(true);
  const [useBezier, setUseBezier] = useState(true);
  
  const [isContrastMode, setIsContrastMode] = useState(false);
  const [contrastTextColor, setContrastTextColor] = useState('#000000');
  
  const { toast } = useToast();
  const { setExtension } = useSidebarExtension();

  const isGenerationLocked = useMemo(() => palette.every(c => c.locked), [palette]);
  
  const regeneratePalette = useCallback((isRandomizing = false) => {
    setPalette(prevPalette => {
        const lockedColors = prevPalette.filter(c => c.locked);
        const lockedHexes = lockedColors.map(c => c.hex);
        const numColors = prevPalette.length || 5;

        let currentType = generationType;
        if (isRandomizing) {
          if (lockedColors.length > 0) {
            const nextType = generationCycle[0];
            setGenerationCycle(prevCycle => [...prevCycle.slice(1), prevCycle[0]]);
            setGenerationType(nextType);
            currentType = nextType;
          } else {
             setMainColor(getRandomColor());
          }
        }
        
        const baseColors = lockedHexes.length > 0 
            ? lockedHexes 
            : (isRandomizing ? [getRandomColor()] : [mainColor]);
        
        const newHexes = generatePalette({ 
            numColors, 
            type: currentType, 
            lockedColors: baseColors,
        });

        let newPalette: PaletteColor[] = [];
        let newHexIndex = 0;
        
        for (let i = 0; i < numColors; i++) {
            const originalColor = prevPalette[i];
            if (originalColor?.locked) {
                newPalette.push(originalColor);
            } else {
                const newId = originalColor?.id || Date.now() + i;
                newPalette.push({ id: newId, hex: newHexes[newHexIndex++], locked: false });
            }
        }
        
        return newPalette;
    });
  }, [generationType, generationCycle, mainColor]);

  useEffect(() => {
    regeneratePalette();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleColorChange = useCallback((newColor: any) => {
    setMainColor(newColor.hex);
  }, []);

  const handleAddColorToPalette = useCallback(() => {
    setPalette(prevColors => {
      if (prevColors.some(p => p.hex === mainColor)) {
        toast({ title: 'Color already in palette.' });
        return prevColors;
      }
      if (prevColors.length >= 10) {
        toast({ title: "Maximum 10 colors reached.", variant: "destructive" });
        return prevColors;
      }
      const newColor: PaletteColor = { id: Date.now(), hex: mainColor, locked: false };
      return [...prevColors, newColor];
    });
    toast({ title: 'Color added to palette!' });
  }, [mainColor, toast]);
  
  const handleSaveToLibrary = useCallback(() => {
    if (palette.length === 0) {
      toast({ title: "Cannot save empty palette", variant: "destructive" });
      return;
    }
    const savedPalettesJSON = localStorage.getItem('saved_palettes');
    const savedPalettes = savedPalettesJSON ? JSON.parse(savedPalettesJSON) : [];
    savedPalettes.push(palette.map(p => p.hex));
    localStorage.setItem('saved_palettes', JSON.stringify(savedPalettes));
    toast({ title: "Palette Saved!", description: "View it in your library." });
  }, [palette, toast]);

  const handleColorUpdateInPalette = useCallback((id: number, newHex: string) => {
    setPalette(prev => prev.map(c => c.id === id ? { ...c, hex: newHex } : c));
  }, []);

  const handleLockToggle = useCallback((id: number) => {
    setPalette(prev => prev.map(c => c.id === id ? { ...c, locked: !c.locked } : c));
  }, []);

  const handleRemoveColor = useCallback((id: number) => {
    if (palette.length <= 2) {
        toast({ title: "Minimum 2 colors required.", variant: "destructive" });
        return;
    }
    setPalette(palette.filter(c => c.id !== id));
  }, [palette.length, toast]);

  const handleAddColorAtIndex = useCallback((index: number) => {
    setPalette(prev => {
        if (prev.length >= 10) {
            toast({ title: "Maximum 10 colors reached.", variant: "destructive" });
            return prev;
        }

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
  }, [toast]);

  const handleReset = useCallback(() => {
    setPalette([]);
    setTimeout(() => regeneratePalette(true), 0);
    toast({ title: "Palette Reset" });
  }, [regeneratePalette, toast]);

  const colorName = colord(mainColor).toName({ closest: true });
  const colorCmyk = colord(mainColor).toCmyk();
  const colorLch = colord(mainColor).toLch();
  const colorLab = colord(mainColor).toLab();

  const paletteHexes = useMemo(() => palette.map(p => p.hex), [palette]);

  const analysisSourcePalette = useMemo(() => {
    if (paletteHexes.length < 2) return paletteHexes;
    if (!useBezier && !correctLightness) {
        return paletteHexes;
    }
    const interpolator = useBezier ? chroma.bezier(paletteHexes) : paletteHexes;
    let scale = chroma.scale(interpolator).mode('lch');
    if (correctLightness) {
      scale = scale.correctLightness();
    }
    return scale.colors(paletteHexes.length);
  }, [paletteHexes, useBezier, correctLightness]);
  
  const simulatedPalette = useMemo(() => {
    if (analysisSourcePalette.length === 0) return [];
    const source = (useBezier || correctLightness) ? analysisSourcePalette : paletteHexes;
    return source.map(color => simulate(color, simulationType));
  }, [analysisSourcePalette, paletteHexes, simulationType, useBezier, correctLightness]);
  
  const graphData = useMemo(() => getGraphData(analysisSourcePalette), [analysisSourcePalette]);
  
  const { isPaletteColorblindSafe, adjustedPalette } = useMemo(() => {
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

  // Using useCallback for setters to stabilize useEffect dependency array
  const stableSetUseBezier = useCallback(setUseBezier, []);
  const stableSetCorrectLightness = useCallback(setCorrectLightness, []);
  const stableSetSimulationType = useCallback(setSimulationType, []);

  const analysisPanel = useMemo(() => (
    <div className="space-y-6">
        <h3 className="text-lg font-semibold">Palette Analysis</h3>
        <div className="flex flex-col gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="useBezier" checked={useBezier} onCheckedChange={(checked) => stableSetUseBezier(!!checked)} />
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
                <Checkbox id="correctLightness" checked={correctLightness} onCheckedChange={(checked) => stableSetCorrectLightness(!!checked)} />
                <Label htmlFor="correctLightness">Correct lightness</Label>
            </div>
            <div className="flex flex-col items-start gap-2">
                <Label className="text-sm">Simulate:</Label>
                <RadioGroup defaultValue="normal" value={simulationType} onValueChange={(value) => stableSetSimulationType(value as SimulationType)} className="flex flex-wrap items-center gap-1 border rounded-md p-1">
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
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
            <div className="flex h-16 w-full overflow-hidden rounded-md border">
                {simulatedPalette.map((color, index) => (
                <div key={index} style={{ backgroundColor: color }} className="flex-1" />
                ))}
            </div>
            <div className="grid grid-cols-1 gap-8 pt-4">
                <ChartDisplay data={graphData.lightness} title="Lightness" color="hsl(var(--chart-1))" description="How light or dark the color is, from black (0) to white (100)." />
                <ChartDisplay data={graphData.saturation} title="Saturation" color="hsl(var(--chart-2))" description="The intensity of the color, from gray (0) to a pure, vivid color." />
                <ChartDisplay data={graphData.hue} title="Hue" color="hsl(var(--chart-3))" description="The color's position on the color wheel, measured in degrees (0-360)." />
            </div>
        </motion.div>
    </div>
  ), [
      useBezier, stableSetUseBezier, 
      correctLightness, stableSetCorrectLightness,
      simulationType, stableSetSimulationType,
      isPaletteColorblindSafe, simulatedPalette, graphData
  ]);

  useEffect(() => {
    setExtension(analysisPanel);
    return () => {
      setExtension(null);
    };
  }, [analysisPanel, setExtension]);


  return (
    <main className="flex-1 w-full p-4 md:p-8 flex flex-col gap-8">
      {/* Top Section: Picker and Active Color Details */}
      <section className="grid grid-cols-1 lg:grid-cols-3 lg:items-stretch gap-8 w-full max-w-7xl mx-auto">
        <div className="w-full flex flex-col justify-center lg:justify-start gap-4">
            <ColorPickerClient 
              color={mainColor} 
              onChange={handleColorChange}
              className="w-full max-w-sm h-full"
            />
        </div>

        <div className="w-full flex justify-center">
            <Card className="w-full max-w-sm h-full flex flex-col">
                <CardHeader>
                    <Button
                        onClick={() => setIsContrastMode(prev => !prev)}
                        variant="outline"
                        className="w-full"
                    >
                        <Contrast className="mr-2 h-4 w-4" />
                        {isContrastMode ? 'Back to Builder' : 'Check Contrast'}
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow">
                    <div 
                      className="w-full h-24 rounded-md border flex items-center justify-center text-center p-4"
                      style={{ backgroundColor: mainColor, color: isContrastMode ? contrastTextColor : 'inherit' }}
                    >
                      {isContrastMode && (
                        <div className="select-none">
                            <h2 className="text-3xl font-bold">Aa</h2>
                            <p className="text-sm">Sample Text</p>
                        </div>
                      )}
                    </div>
                    
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={isContrastMode ? 'contrast' : 'details'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isContrastMode ? (
                          <WCAGDisplay bgColor={mainColor} textColor={contrastTextColor} />
                        ) : (
                          <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                  <span className="text-muted-foreground">Name</span>
                                  <span className="font-mono font-semibold capitalize">{colorName}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="text-muted-foreground">HEX</span>
                                  <span className="font-mono font-semibold">{mainColor.toUpperCase()}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="text-muted-foreground">RGB</span>
                                  <span className="font-mono font-semibold">{colord(mainColor).toRgbString()}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="text-muted-foreground">HSL</span>
                                  <span className="font-mono font-semibold">{colord(mainColor).toHslString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">CMYK</span>
                                <span className="font-mono font-semibold">{`cmyk(${colorCmyk.c}, ${colorCmyk.m}, ${colorCmyk.y}, ${colorCmyk.k})`}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">LCH</span>
                                <span className="font-mono font-semibold">{`lch(${colorLch.l}, ${colorLch.c}, ${colorLch.h})`}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">CIELAB</span>
                                <span className="font-mono font-semibold">{`lab(${colorLab.l}, ${colorLab.a}, ${colorLab.b})`}</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleAddColorToPalette} className="w-full" disabled={isContrastMode}>
                      Add to Current Palette
                  </Button>
                </CardFooter>
            </Card>
        </div>

        <div className="w-full flex justify-center lg:justify-end">
            <AnimatePresence mode="wait">
              <motion.div
                key={isContrastMode ? 'text-picker' : 'generator'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-sm h-full"
              >
                  {isContrastMode ? (
                      <Card className="w-full h-full flex flex-col">
                          <CardHeader>
                              <CardTitle>Text Color</CardTitle>
                          </CardHeader>
                          <CardContent className="flex-grow">
                              <ColorPickerClient 
                                color={contrastTextColor} 
                                onChange={(c) => setContrastTextColor(c.hex)}
                                className="w-full border-0 shadow-none p-0"
                              />
                          </CardContent>
                      </Card>
                  ) : (
                      <PaletteGenerator
                          onRandomize={() => regeneratePalette(true)}
                          onReset={handleReset}
                          generationType={generationType}
                          setGenerationType={setGenerationType}
                          isGenerationLocked={isGenerationLocked}
                          className="w-full max-w-sm h-full flex flex-col"
                      />
                  )}
              </motion.div>
            </AnimatePresence>
        </div>
      </section>
      
      {/* Palette Display Section */}
      <section className="w-full max-w-7xl mx-auto flex-grow flex flex-col min-h-[200px]">
        <Palette
          palette={palette}
          onColorChange={handleColorUpdateInPalette}
          onLockToggle={handleLockToggle}
          onRemoveColor={handleRemoveColor}
          onAddColor={handleAddColorAtIndex}
          onColorClick={(c) => setMainColor(c.hex)}
          actions={<Button onClick={handleSaveToLibrary}>Save to Library</Button>}
        />
        <div className="text-center text-sm text-muted-foreground mt-4">
            Detected Harmony: <span className="font-semibold text-foreground">{detectedHarmony}</span>
        </div>
      </section>
    </main>
  );
}
