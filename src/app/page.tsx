
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
import { Palette } from '@/components/palettes/Palette';
import { PaletteGenerator } from '@/components/palettes/PaletteGenerator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

extend([namesPlugin, cmykPlugin, lchPlugin, labPlugin]);

const ColorPickerClient = dynamic(() => import('@/components/colors/ColorPickerClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-xs space-y-3 rounded-lg border bg-card p-4 text-card-foreground">
        <div className="flex gap-3">
            <Skeleton className="relative h-40 flex-1 cursor-pointer" />
            <Skeleton className="relative h-40 w-5 cursor-pointer" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-3 gap-3">
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
const ChartDisplay = ({ data, title, color }: { data: { name: number; value: number }[], title: string, color: string }) => (
  <div>
    <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin', 'dataMax']} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
          }}
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
  const [simulationType, setSimulationType] = useState<SimulationType>('normal');
  const [correctLightness, setCorrectLightness] = useState(true);
  const [useBezier, setUseBezier] = useState(true);
  
  const { toast } = useToast();

  const isGenerationLocked = useMemo(() => palette.every(c => c.locked), [palette]);

  const regeneratePalette = useCallback((isRandomizing = false) => {
    const lockedColors = palette.filter(c => c.locked).map(c => c.hex);
    const baseColors = lockedColors.length > 0 ? lockedColors : [mainColor];
    const numColors = palette.length > 1 ? palette.length : 5;
    
    const newHexes = generatePalette({ 
      numColors, 
      type: generationType, 
      lockedColors: baseColors,
    });

    let newPalette: PaletteColor[] = [];
    let newHexIndex = 0;
    
    for (let i = 0; i < numColors; i++) {
      const originalColor = palette[i];
      if (originalColor?.locked) {
          newPalette.push(originalColor);
      } else {
          const newId = originalColor?.id || Date.now() + Math.random();
          newPalette.push({ id: newId, hex: newHexes[newHexIndex++], locked: false });
      }
    }
    
    setPalette(adjustForColorblindSafety(newPalette));

  }, [generationType, palette, mainColor]);

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

  const handleColorUpdateInPalette = (id: number, newHex: string) => {
    setPalette(prev => adjustForColorblindSafety(prev.map(c => c.id === id ? { ...c, hex: newHex } : c)));
  };

  const handleLockToggle = (id: number) => {
    setPalette(prev => prev.map(c => c.id === id ? { ...c, locked: !c.locked } : c));
  };

  const handleRemoveColor = (id: number) => {
    if (palette.length <= 2) {
        toast({ title: "Minimum 2 colors required.", variant: "destructive" });
        return;
    }
    setPalette(palette.filter(c => c.id !== id));
  };

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
    setTimeout(() => regeneratePalette(), 0);
    toast({ title: "Palette Reset" });
  }, [regeneratePalette, toast]);

  const colorName = colord(mainColor).toName({ closest: true });
  const colorCmyk = colord(mainColor).toCmyk();
  const colorLch = colord(mainColor).toLch();
  const colorLab = colord(mainColor).toLab();

  const paletteHexes = useMemo(() => palette.map(p => p.hex), [palette]);
  const processedPalette = useMemo(() => {
    if (paletteHexes.length < 2) return paletteHexes;
    const interpolator = useBezier ? chroma.bezier(paletteHexes) : paletteHexes;
    let scale = chroma.scale(interpolator).mode('lch');
    if (correctLightness) {
      scale = scale.correctLightness();
    }
    return scale.colors(paletteHexes.length);
  }, [paletteHexes, correctLightness, useBezier]);

  const simulatedPalette = useMemo(() => {
    if (paletteHexes.length === 0) return [];
    return (correctLightness ? processedPalette : paletteHexes).map(color => simulate(color, simulationType));
  }, [processedPalette, paletteHexes, simulationType, correctLightness]);
  
  const graphData = useMemo(() => getGraphData(correctLightness ? processedPalette : paletteHexes), [processedPalette, paletteHexes, correctLightness]);
  
  const isPaletteColorblindSafe = useMemo(() => {
    if (simulatedPalette.length < 2) return true;
    for (let i = 0; i < simulatedPalette.length - 1; i++) {
        const contrast = chroma.contrast(simulatedPalette[i], simulatedPalette[i+1]);
        if (contrast < 1.1) return false;
    }
    return true;
  }, [simulatedPalette]);

  return (
    <main className="flex-1 w-full p-4 md:p-8 flex flex-col gap-8">
      {/* Top Section: Picker and Active Color Details */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start justify-items-center gap-8 w-full max-w-7xl mx-auto">
        <div className="w-full flex justify-center">
            <ColorPickerClient 
              color={mainColor} 
              onChange={handleColorChange}
            />
        </div>

        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>Active Color</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div 
                  className="w-full h-24 rounded-md border"
                  style={{ backgroundColor: mainColor }}
                />
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
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddColorToPalette} className="w-full">
                  Add to Current Palette
              </Button>
            </CardFooter>
        </Card>

        {/* This card is a placeholder to balance the grid */}
        <div className="hidden lg:block w-full max-w-sm" />
      </section>

      {/* Mid Section: Generator Controls */}
      <section className="w-full max-w-7xl mx-auto">
        <PaletteGenerator
          onRandomize={regeneratePalette}
          onReset={handleReset}
          generationType={generationType}
          setGenerationType={setGenerationType}
          isGenerationLocked={isGenerationLocked}
        />
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
      </section>
      
      {/* Bottom Section: Analysis */}
      <section className="w-full max-w-7xl mx-auto">
        <Card>
            <CardHeader>
                <CardTitle>Palette Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="useBezier" checked={useBezier} onCheckedChange={(checked) => setUseBezier(!!checked)} />
                        <Label htmlFor="useBezier">Bezier interpolation</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="correctLightness" checked={correctLightness} onCheckedChange={(checked) => setCorrectLightness(!!checked)} />
                        <Label htmlFor="correctLightness">Correct lightness</Label>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Label className="text-sm">Simulate:</Label>
                    <RadioGroup defaultValue="normal" value={simulationType} onValueChange={(value) => setSimulationType(value as SimulationType)} className="flex flex-wrap items-center gap-1 border rounded-md p-1">
                        <RadioGroupItem value="normal" id="normal" className="sr-only" />
                        <Label htmlFor="normal" className={cn("px-3 py-1 cursor-pointer text-sm rounded-sm", simulationType === 'normal' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Normal</Label>
                        <RadioGroupItem value="deutan" id="deutan" className="sr-only" />
                        <Label htmlFor="deutan" className={cn("px-3 py-1 cursor-pointer text-sm rounded-sm", simulationType === 'deutan' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Deuteranopia</Label>
                        <RadioGroupItem value="deuteranomaly" id="deuteranomaly" className="sr-only" />
                        <Label htmlFor="deuteranomaly" className={cn("px-3 py-1 cursor-pointer text-sm rounded-sm", simulationType === 'deuteranomaly' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Deuteranomaly</Label>
                        <RadioGroupItem value="protan" id="protan" className="sr-only" />
                        <Label htmlFor="protan" className={cn("px-3 py-1 cursor-pointer text-sm rounded-sm", simulationType === 'protan' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Protanopia</Label>
                        <RadioGroupItem value="tritan" id="tritan" className="sr-only" />
                        <Label htmlFor="tritan" className={cn("px-3 py-1 cursor-pointer text-sm rounded-sm", simulationType === 'tritan' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Tritanopia</Label>
                    </RadioGroup>
                </div>
            </div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {isPaletteColorblindSafe && <span className="flex items-center text-sm text-green-500"><CheckCircle2 className="mr-2 h-4 w-4" /> This palette is colorblind-safe.</span>}
                <div className="flex h-16 w-full overflow-hidden rounded-md border">
                    {simulatedPalette.map((color, index) => (
                    <div key={index} style={{ backgroundColor: color }} className="flex-1" />
                    ))}
                </div>
                <div className="grid md:grid-cols-3 gap-8 pt-4">
                    <ChartDisplay data={graphData.lightness} title="Lightness" color="hsl(var(--chart-1))" />
                    <ChartDisplay data={graphData.saturation} title="Saturation" color="hsl(var(--chart-2))" />
                    <ChartDisplay data={graphData.hue} title="Hue" color="hsl(var(--chart-3))" />
                </div>
            </motion.div>
            </CardContent>
        </Card>
      </section>
    </main>
  );
}

    