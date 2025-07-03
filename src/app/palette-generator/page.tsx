
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import chroma from 'chroma-js';
import { useToast } from '@/hooks/use-toast';
import { generatePalette, getRandomColor, type GenerationType } from '@/lib/palette-generator';
import { simulate, type SimulationType } from '@/lib/colorblind';
import { Palette } from '@/components/palettes/Palette';
import { PaletteGenerator } from '@/components/palettes/PaletteGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';


export interface PaletteColor {
  id: number;
  hex: string;
  locked: boolean;
}

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


export default function PaletteGeneratorPage() {
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [numColors, setNumColors] = useState(5);
  const [generationType, setGenerationType] = useState<GenerationType>('analogous');
  const [generationCycle, setGenerationCycle] = useState<GenerationType[]>(['analogous', 'triadic', 'complementary', 'tints', 'shades']);
  const { toast } = useToast();

  const [simulationType, setSimulationType] = useState<SimulationType>('normal');
  const [correctLightness, setCorrectLightness] = useState(true);
  
  const isGenerationLocked = useMemo(() => palette.every(c => c.locked), [palette]);

  const regeneratePalette = useCallback((isRandomizing = false) => {
    setPalette(prevPalette => {
      const lockedColors = prevPalette.filter(c => c.locked);
      const lockedHexes = lockedColors.map(c => c.hex);

      let currentType = generationType;
      if (isRandomizing && lockedHexes.length > 0) {
        const nextType = generationCycle[0];
        setGenerationCycle(prevCycle => [...prevCycle.slice(1), prevCycle[0]]);
        setGenerationType(nextType);
        currentType = nextType;
      }
      
      const newHexes = generatePalette({ 
        numColors, 
        type: currentType, 
        lockedColors: lockedHexes.length > 0 ? lockedHexes : [getRandomColor()] 
      });

      const finalPalette = Array.from({ length: numColors }, (_, i) => {
        const lockedColorInPosition = lockedColors.find(lc => prevPalette.findIndex(p => p.id === lc.id) === i);
        if (lockedColorInPosition) {
          return lockedColorInPosition;
        }
        
        // Find an unlocked color from the new palette that hasn't been used yet.
        const newColorHex = newHexes[i];
        let id = i + 1;
        const existingColor = prevPalette.find(p => p.id === id);
        if(existingColor && !existingColor.locked) {
            return { ...existingColor, hex: newColorHex };
        }
        
        return {
            id: Date.now() + i, // Ensure unique ID
            hex: newColorHex,
            locked: false
        };
      });

      return finalPalette.slice(0, numColors);
    });
  }, [numColors, generationType, generationCycle]);

  useEffect(() => {
    // Initial generation
    regeneratePalette(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNumColorsChange = (newNumColors: number) => {
    const currentNumColors = palette.length;

    if (newNumColors > currentNumColors) {
      const numToAdd = newNumColors - currentNumColors;
      const newColors: PaletteColor[] = Array.from({ length: numToAdd }, (_, i) => ({
        id: Date.now() + i,
        hex: getRandomColor(),
        locked: false,
      }));
      setPalette(prev => [...prev, ...newColors]);
    } else if (newNumColors < currentNumColors) {
      const numToRemove = currentNumColors - newNumColors;
      setPalette(prev => prev.slice(0, prev.length - numToRemove));
    }
    setNumColors(newNumColors);
  };

  const handleReset = useCallback(() => {
    setPalette([]);
    setNumColors(5);
    // Use a timeout to ensure the state is cleared before regenerating
    setTimeout(() => regeneratePalette(true), 0);
    toast({ title: "Palette Reset" });
  }, [regeneratePalette, toast]);

  const handleColorChange = (id: number, newHex: string) => {
    setPalette(prev => prev.map(c => c.id === id ? { ...c, hex: newHex } : c));
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
    setNumColors(newPalette.length);
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
    if (paletteHexes.length === 0) {
      return [];
    }
    let scale = chroma.scale(paletteHexes).mode('lch');
    if (correctLightness) {
      scale = scale.correctLightness();
    }
    return scale.colors(paletteHexes.length);
  }, [paletteHexes, correctLightness]);

  const simulatedPalette = useMemo(() => {
    return (correctLightness ? processedPalette : paletteHexes).map(color => simulate(color, simulationType));
  }, [processedPalette, paletteHexes, simulationType, correctLightness]);
  
  const graphData = useMemo(() => getGraphData(correctLightness ? processedPalette : paletteHexes), [processedPalette, paletteHexes, correctLightness]);
  
  const isColorblindSafe = useMemo(() => {
    if (simulatedPalette.length < 2) return true;
    for (let i = 0; i < simulatedPalette.length - 1; i++) {
        const contrast = chroma.contrast(simulatedPalette[i], simulatedPalette[i+1]);
        if (contrast < 1.1) return false;
    }
    return true;
  }, [simulatedPalette]);


  return (
    <div className="w-full h-[calc(100vh-theme(spacing.14))] flex flex-col p-4 md:p-8 gap-8">
        <div className="flex-shrink-0">
            <PaletteGenerator
              onRandomize={() => regeneratePalette(true)}
              onReset={handleReset}
              numColors={numColors}
              setNumColors={handleNumColorsChange}
              generationType={generationType}
              setGenerationType={setGenerationType}
              isGenerationLocked={isGenerationLocked}
            />
        </div>
        <div className="flex-grow flex flex-col min-h-0 min-w-0">
             <Palette
              palette={palette}
              onColorChange={handleColorChange}
              onLockToggle={handleLockToggle}
              onRemoveColor={handleRemoveColor}
              actions={<Button onClick={handleSavePalette}>Save to Library</Button>}
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
                            <Checkbox id="correctLightness" checked={correctLightness} onCheckedChange={(checked) => setCorrectLightness(!!checked)} />
                            <Label htmlFor="correctLightness">Correct lightness</Label>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {isColorblindSafe && <span className="flex items-center text-sm text-green-500"><CheckCircle2 className="mr-2 h-4 w-4" /> This palette is colorblind-safe.</span>}
                        <Label className="text-sm">Simulate:</Label>
                        <RadioGroup defaultValue="normal" value={simulationType} onValueChange={(value) => setSimulationType(value as SimulationType)} className="flex items-center border rounded-md p-0.5">
                            <RadioGroupItem value="normal" id="normal" className="sr-only" />
                            <Label htmlFor="normal" className={cn("px-3 py-1 cursor-pointer text-sm", simulationType === 'normal' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Normal</Label>
                            
                            <RadioGroupItem value="deutan" id="deutan" className="sr-only" />
                            <Label htmlFor="deutan" className={cn("px-3 py-1 cursor-pointer text-sm", simulationType === 'deutan' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Deut.</Label>
                            
                            <RadioGroupItem value="protan" id="protan" className="sr-only" />
                            <Label htmlFor="protan" className={cn("px-3 py-1 cursor-pointer text-sm", simulationType === 'protan' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Prot.</Label>

                            <RadioGroupItem value="tritan" id="tritan" className="sr-only" />
                            <Label htmlFor="tritan" className={cn("px-3 py-1 cursor-pointer text-sm", simulationType === 'tritan' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Trit.</Label>
                        </RadioGroup>
                    </div>
                </div>
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
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

    