
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import chroma from 'chroma-js';
import { useToast } from '@/hooks/use-toast';
import { generatePalette, getRandomColor, type GenerationType, adjustForColorblindSafety } from '@/lib/palette-generator';
import type { PaletteColor } from '@/lib/palette-generator';
import { simulate, type SimulationType } from '@/lib/colorblind';
import { Palette } from '@/components/palettes/Palette';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tooltip as ShadTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, Dices, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


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


export default function PaletteGeneratorPage() {
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [generationType, setGenerationType] = useState<GenerationType>('analogous');
  const [generationCycle, setGenerationCycle] = useState<GenerationType[]>(['analogous', 'triadic', 'complementary', 'tints', 'shades']);
  const { toast } = useToast();

  const [simulationType, setSimulationType] = useState<SimulationType>('normal');
  const [correctLightness, setCorrectLightness] = useState(true);
  const [useBezier, setUseBezier] = useState(true);
  
  const isGenerationLocked = useMemo(() => palette.every(c => c.locked), [palette]);

  const regeneratePalette = useCallback((isRandomizing = false) => {
    setPalette(prevPalette => {
      const lockedColors = prevPalette.filter(c => c.locked);
      const lockedHexes = lockedColors.map(c => c.hex);
      const numColors = prevPalette.length || 5;

      let currentType = generationType;
      if (isRandomizing && lockedColors.length > 0) {
        const nextType = generationCycle[0];
        setGenerationCycle(prevCycle => [...prevCycle.slice(1), prevCycle[0]]);
        setGenerationType(nextType);
        currentType = nextType;
      }
      
      const newHexes = generatePalette({ 
        numColors, 
        type: currentType, 
        lockedColors: lockedColors.length > 0 ? lockedHexes : [getRandomColor()],
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
      
      return adjustForColorblindSafety(newPalette);
    });
  }, [generationType, generationCycle]);

  useEffect(() => {
    // Initial generation
    regeneratePalette(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddColor = useCallback((index: number) => {
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
    // Use a timeout to ensure the state is cleared before regenerating
    setTimeout(() => regeneratePalette(true), 0);
    toast({ title: "Palette Reset" });
  }, [regeneratePalette, toast]);

  const handleColorChange = (id: number, newHex: string) => {
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
    const newPalette = palette.filter(c => c.id !== id);
    setPalette(newPalette);
  };

  const handleSavePalette = () => {
    if (palette.length === 0) {
      toast({ title: "Palette is empty", variant: "destructive" });
      return;
    }
    const savedPalettesJSON = localStorage.getItem('saved_palettes');
    const savedPalettes = savedPalettesJSON ? JSON.parse(savedPalettesJSON) : [];
    savedPalettes.push(palette.map(p => p.hex));
    localStorage.setItem('saved_palettes', JSON.stringify(savedPalettes));
    toast({ title: "Palette Saved!", description: "View it in your library." });
  };
  
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

  const paletteActions = (
    <div className="flex w-full justify-between items-center gap-4 flex-wrap">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button onClick={() => regeneratePalette(true)} size="sm">
              <Dices className="mr-2 h-4 w-4" />
              Mix
          </Button>
          <Button onClick={handleReset} variant="outline" size="sm">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="generationType" className="text-xs shrink-0">Type</Label>
          <Select 
              value={generationType} 
              onValueChange={(value) => setGenerationType(value as GenerationType)}
              disabled={isGenerationLocked}
            >
            <SelectTrigger id="generationType" className="w-[150px] h-9">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="analogous">Analogous</SelectItem>
              <SelectItem value="triadic">Triadic</SelectItem>
              <SelectItem value="complementary">Complementary</SelectItem>
              <SelectItem value="tints">Tints</SelectItem>
              <SelectItem value="shades">Shades</SelectItem>
            </SelectContent>
          </Select>
          {isGenerationLocked && <p className="text-xs text-muted-foreground mt-1">Unlock all to change.</p>}
        </div>
      </div>
      
      <Button onClick={handleSavePalette}>Save to Library</Button>
    </div>
  );


  return (
    <div className="w-full h-[calc(100vh-theme(spacing.14))] flex flex-col p-4 md:p-8 gap-8">
        <div className="flex-grow flex flex-col min-h-0">
             <Palette
              palette={palette}
              onColorChange={handleColorChange}
              onLockToggle={handleLockToggle}
              onRemoveColor={handleRemoveColor}
              onAddColor={handleAddColor}
              actions={paletteActions}
            />
        </div>
         <div className="flex-shrink-0">
            <Card>
                <CardHeader>
                    <CardTitle>Palette Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-4">
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
        </div>
    </div>
  );
}
