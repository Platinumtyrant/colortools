
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Saturation, Hue, HexColorInput } from 'react-colorful';
import chroma from 'chroma-js';
import { colord } from 'colord';
import { useToast } from "@/hooks/use-toast";

import { generatePalette, getRandomColor, type GenerationType, adjustForColorblindSafety } from '@/lib/palette-generator';
import type { PaletteColor } from '@/lib/palette-generator';
import { simulate, type SimulationType } from '@/lib/colorblind';
import { getTints, getShades, getTones, getComplementary, getAnalogous, getSplitComplementary, getTriadic, getSquare, getRectangular } from '@/lib/colors';

import { Palette } from '@/components/palettes/Palette';
import { ColorList } from '@/components/colors/ColorList';

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Dices, RotateCcw, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Helper to get graph data for analysis
const getGraphData = (colors: string[]) => {
  if (!colors || colors.length === 0) return { lightness: [], saturation: [], hue: [] };
  const lch = colors.map(c => chroma(c).lch());
  return {
    lightness: lch.map((c, i) => ({ name: i + 1, value: c[0] })),
    saturation: lch.map((c, i) => ({ name: i + 1, value: c[1] })),
    hue: lch.map((c, i) => ({ name: i + 1, value: isNaN(c[2]) ? 0 : c[2] })),
  };
};

// Graph Component for analysis
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
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [activeColorHex, setActiveColorHex] = useState('#1E90FF');
  const [activePaletteColorId, setActivePaletteColorId] = useState<number | null>(null);

  // Generator state
  const [generationType, setGenerationType] = useState<GenerationType>('analogous');
  const [generationCycle, setGenerationCycle] = useState<GenerationType[]>(['analogous', 'triadic', 'complementary', 'tints', 'shades']);
  const [simulationType, setSimulationType] = useState<SimulationType>('normal');
  
  // Builder state
  const [activeHarmonyType, setActiveHarmonyType] = useState('complementary');
  const [tintSteps, setTintSteps] = useState(5);
  const [shadeSteps, setShadeSteps] = useState(5);
  const [toneSteps, setToneSteps] = useState(5);

  const { toast } = useToast();
  
  const isGenerationLocked = useMemo(() => palette.every(c => c.locked), [palette]);

  // --- Core Palette Logic ---
  const regeneratePalette = useCallback((isMixing = false) => {
    setPalette(prevPalette => {
      const lockedColors = prevPalette.filter(c => c.locked);
      const lockedHexes = lockedColors.map(c => c.hex);
      const numColors = prevPalette.length || 5;

      let currentType = generationType;
      if (isMixing) {
        const nextType = generationCycle[0];
        setGenerationCycle(prevCycle => [...prevCycle.slice(1), prevCycle[0]]);
        setGenerationType(nextType);
        currentType = nextType;
      }
      
      const newHexes = generatePalette({ 
        numColors, 
        type: currentType, 
        lockedColors: lockedHexes.length > 0 ? lockedHexes : [activeColorHex],
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
      
      const safePalette = adjustForColorblindSafety(newPalette);
      if (safePalette.length > 0) {
        setActiveColorHex(safePalette[0].hex);
        setActivePaletteColorId(safePalette[0].id);
      }
      return safePalette;
    });
  }, [generationType, generationCycle, activeColorHex]);

  useEffect(() => {
    // Initial generation
    regeneratePalette(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Handlers ---
  const handleActiveColorClick = useCallback((color: PaletteColor) => {
    setActiveColorHex(color.hex);
    setActivePaletteColorId(color.id);
  }, []);

  const handleActiveColorChange = useCallback((newHex: string) => {
    setActiveColorHex(newHex);
    if (activePaletteColorId !== null) {
      setPalette(prev => adjustForColorblindSafety(
        prev.map(c => c.id === activePaletteColorId ? { ...c, hex: newHex } : c)
      ));
    }
  }, [activePaletteColorId]);

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
            newHex = chroma(after).set('lch.l', '*1.2').hex();
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
  
  const handleAddColorFromSwatch = useCallback((hex: string) => {
    setPalette(prev => {
      if (prev.length >= 10) {
        toast({ title: "Maximum 10 colors reached.", variant: "destructive" });
        return prev;
      }
      const newColor: PaletteColor = { id: Date.now(), hex, locked: false };
      return adjustForColorblindSafety([...prev, newColor]);
    });
    toast({ title: "Color Added!" });
  }, [toast]);


  const handleReset = useCallback(() => {
    setPalette([]);
    setTimeout(() => regeneratePalette(false), 0);
    toast({ title: "Palette Reset" });
  }, [regeneratePalette, toast]);

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

  // --- Memoized Derived State ---
  const hsv = useMemo(() => colord(activeColorHex).toHsv(), [activeColorHex]);
  const paletteHexes = useMemo(() => palette.map(p => p.hex), [palette]);
  const simulatedPalette = useMemo(() => {
    if (paletteHexes.length === 0) return [];
    return paletteHexes.map(color => simulate(color, simulationType));
  }, [paletteHexes, simulationType]);
  
  const graphData = useMemo(() => getGraphData(paletteHexes), [paletteHexes]);
  
  const isPaletteColorblindSafe = useMemo(() => {
    if (simulatedPalette.length < 2) return true;
    for (let i = 0; i < simulatedPalette.length - 1; i++) {
        const contrast = chroma.contrast(simulatedPalette[i], simulatedPalette[i+1]);
        if (contrast < 1.1) return false;
    }
    return true;
  }, [simulatedPalette]);

  const hsl = colord(activeColorHex).toHsl();
  const rgb = colord(activeColorHex).toRgb();

  const currentTints = getTints(activeColorHex, tintSteps);
  const currentShades = getShades(activeColorHex, shadeSteps);
  const currentTones = getTones(activeColorHex, toneSteps);

  const currentHarmonyColors = useMemo(() => {
    switch (activeHarmonyType) {
      case 'complementary': return getComplementary(activeColorHex);
      case 'analogous': return getAnalogous(activeColorHex);
      case 'split-complementary': return getSplitComplementary(activeColorHex);
      case 'triad': return getTriadic(activeColorHex);
      case 'square': return getSquare(activeColorHex);
      case 'rectangle': return getRectangular(activeColorHex);
      default: return getComplementary(activeColorHex);
    }
  }, [activeColorHex, activeHarmonyType]);

  const responsiveGridClasses = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5";


  return (
    <div className="w-full flex flex-col p-4 md:p-8 gap-8">
        <div className="flex-grow flex flex-col min-h-0">
            <Palette
              palette={palette}
              onColorChange={(id, hex) => {
                setActivePaletteColorId(id);
                handleActiveColorChange(hex);
              }}
              onColorClick={handleActiveColorClick}
              onLockToggle={handleLockToggle}
              onRemoveColor={handleRemoveColor}
              onAddColor={handleAddColor}
              actions={<Button onClick={handleSavePalette}>Save to Library</Button>}
            />
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* --- Left Column: Editor & Swatches --- */}
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Active Color Editor</CardTitle>
                        <CardDescription>Click a color in the palette above to edit it.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-full md:w-1/2 flex flex-col gap-4">
                           <div className="w-full space-y-3">
                                <Saturation
                                    hsv={hsv}
                                    onChange={(newSV) => handleActiveColorChange(colord({ ...hsv, ...newSV }).toHex())}
                                    className="w-full aspect-video rounded-lg border-border border cursor-pointer"
                                />
                                <Hue
                                    hue={hsv.h}
                                    onChange={(newHue) => handleActiveColorChange(colord({ ...hsv, h: newHue }).toHex())}
                                    className="w-full h-4 rounded-lg border-border border cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-1/2 flex flex-col gap-4">
                             <div className="flex items-center gap-4">
                                <Label htmlFor="hex-input" className="w-10 text-muted-foreground text-right">HEX</Label>
                                <HexColorInput id="hex-input" color={activeColorHex} onChange={handleActiveColorChange} className={cn("flex-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", "uppercase")} />
                            </div>
                             <div className="flex items-center gap-4">
                                <Label htmlFor="rgb-r" className="w-10 text-muted-foreground text-right">RGB</Label>
                                <div className="flex flex-1 gap-2">
                                    <Input id="rgb-r" type="number" min="0" max="255" value={rgb.r} onChange={(e) => handleActiveColorChange(colord({...rgb, r: +e.target.value}).toHex())} className="w-1/3" aria-label="Red" />
                                    <Input type="number" min="0" max="255" value={rgb.g} onChange={(e) => handleActiveColorChange(colord({...rgb, g: +e.target.value}).toHex())} className="w-1/3" aria-label="Green" />
                                    <Input type="number" min="0" max="255" value={rgb.b} onChange={(e) => handleActiveColorChange(colord({...rgb, b: +e.target.value}).toHex())} className="w-1/3" aria-label="Blue" />
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Label htmlFor="hsl-h" className="w-10 text-muted-foreground text-right">HSL</Label>
                                <div className="flex flex-1 gap-2">
                                    <Input id="hsl-h" type="number" min="0" max="359" value={hsl.h} onChange={(e) => handleActiveColorChange(colord({...hsl, h: +e.target.value}).toHex())} className="w-1/3" aria-label="Hue" />
                                    <Input type="number" min="0" max="100" value={hsl.s} onChange={(e) => handleActiveColorChange(colord({...hsl, s: +e.target.value}).toHex())} className="w-1/3" aria-label="Saturation" />
                                    <Input type="number" min="0" max="100" value={hsl.l} onChange={(e) => handleActiveColorChange(colord({...hsl, l: +e.target.value}).toHex())} className="w-1/3" aria-label="Lightness" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                        <CardTitle>Color Variations</CardTitle>
                        <CardDescription>Based on the active color. Click to add to palette.</CardDescription>
                    </CardHeader>
                    <Card asChild>
                        <Tabs defaultValue="tints" className="w-full">
                            <CardHeader>
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="tints">Tints</TabsTrigger>
                                    <TabsTrigger value="shades">Shades</TabsTrigger>
                                    <TabsTrigger value="tones">Tones</TabsTrigger>
                                </TabsList>
                            </CardHeader>
                            <TabsContent value="tints">
                                <CardContent>
                                    <ColorList colors={currentTints} title="" onSetActiveColor={setActiveColorHex} onCopySuccess={(msg) => toast({ title: msg })} onAdd={handleAddColorFromSwatch} gridClassName={responsiveGridClasses} />
                                </CardContent>
                            </TabsContent>
                            <TabsContent value="shades">
                                <CardContent>
                                    <ColorList colors={currentShades} title="" onSetActiveColor={setActiveColorHex} onCopySuccess={(msg) => toast({ title: msg })} onAdd={handleAddColorFromSwatch} gridClassName={responsiveGridClasses} />
                                </CardContent>
                            </TabsContent>
                            <TabsContent value="tones">
                                <CardContent>
                                    <ColorList colors={currentTones} title="" onSetActiveColor={setActiveColorHex} onCopySuccess={(msg) => toast({ title: msg })} onAdd={handleAddColorFromSwatch} gridClassName={responsiveGridClasses} />
                                </CardContent>
                            </TabsContent>
                        </Tabs>
                    </Card>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Color Harmonies</CardTitle>
                        <CardDescription>Based on the active color. Click to add to palette.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border-b border-border mb-4 overflow-x-auto">
                        {['complementary', 'analogous', 'split-complementary', 'triad', 'square', 'rectangle'].map(harmony => (
                            <button
                            key={harmony}
                            className={cn(
                                "py-2 px-4 text-sm font-medium capitalize flex-shrink-0 border-b-2",
                                activeHarmonyType === harmony 
                                ? 'text-foreground border-primary' 
                                : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
                            )}
                            onClick={() => setActiveHarmonyType(harmony)}
                            >
                            {harmony.replace('-', ' ')}
                            </button>
                        ))}
                        </div>
                        <ColorList colors={currentHarmonyColors} title="" onSetActiveColor={setActiveColorHex} onCopySuccess={(msg) => toast({ title: msg })} onAdd={handleAddColorFromSwatch} gridClassName={responsiveGridClasses} />
                    </CardContent>
                </Card>
            </div>


            {/* --- Right Column: Generator & Analysis --- */}
            <div className="space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Palette Generation</CardTitle>
                        <CardDescription>Use an algorithm to generate colors. Lock any colors you want to keep.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-center">
                            <div className="space-y-2">
                                <Label>Actions</Label>
                                <div className="flex gap-2">
                                <Button onClick={() => regeneratePalette(true)} className="w-full">
                                    <Dices className="mr-2 h-4 w-4" />
                                    Mix
                                </Button>
                                <Button onClick={handleReset} variant="outline" className="w-full">
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="generationType">Generation Type</Label>
                                <div className="relative">
                                <Select 
                                    value={generationType} 
                                    onValueChange={(value) => setGenerationType(value as GenerationType)}
                                    disabled={isGenerationLocked}
                                    >
                                    <SelectTrigger id="generationType">
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
                                {isGenerationLocked && <p className="text-xs text-muted-foreground mt-1 h-4 absolute -bottom-4">Unlock colors to change strategy.</p>}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Palette Analysis</CardTitle>
                         <CardDescription>Simulate color vision deficiencies and view color distribution.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
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
    </div>
  );
}

    

    