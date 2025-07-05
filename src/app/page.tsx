
"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tooltip as ShadTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, Contrast, Dices, RotateCcw, Pencil, Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WCAGDisplay } from '@/components/colors/WCAGDisplay';
import { useSidebarExtension } from '@/contexts/SidebarExtensionContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SavedPalettes } from '@/components/palettes/SavedPalettes';

extend([namesPlugin, cmykPlugin, lchPlugin, labPlugin]);

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
  const [libraryUpdateKey, setLibraryUpdateKey] = useState(0);

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newPaletteName, setNewPaletteName] = useState("");
  const [editingPaletteId, setEditingPaletteId] = useState<number | null>(null);

  const { toast } = useToast();
  const { setExtension } = useSidebarExtension();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInitialLoad = useRef(true);

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

  // Handle loading palettes from Library or Inspiration pages
  useEffect(() => {
    const editIdStr = searchParams.get('edit');
    const paletteToLoadJSON = localStorage.getItem('palette_to_load');

    if (editIdStr) {
      const id = parseInt(editIdStr, 10);
      const savedPalettesJSON = localStorage.getItem('saved_palettes');
      if (savedPalettesJSON) {
        const savedPalettes = JSON.parse(savedPalettesJSON) as { id: number; name: string; colors: string[] }[];
        const paletteToEdit = savedPalettes.find(p => p.id === id);
        if (paletteToEdit) {
          setEditingPaletteId(id);
          setPalette(paletteToEdit.colors.map((hex, i) => ({ id: Date.now() + i, hex, locked: false })));
          setMainColor(paletteToEdit.colors[0] || '#FF9800');
          setNewPaletteName(paletteToEdit.name);
          toast({ title: "Editing Palette", description: `Loaded "${paletteToEdit.name}" for editing.` });
          router.replace('/', { scroll: false });
        }
      }
    } else if (paletteToLoadJSON) {
      // This logic will now be triggered reliably by the query param from the inspiration page
      localStorage.removeItem('palette_to_load'); // Remove immediately
      try {
          const paletteToLoad = JSON.parse(paletteToLoadJSON);
          if (paletteToLoad && paletteToLoad.colors) {
            setEditingPaletteId(null);
            setPalette(paletteToLoad.colors.map((hex: string, i: number) => ({ id: Date.now() + i, hex, locked: false })));
            setMainColor(paletteToLoad.colors[0] || '#FF9800');
            setNewPaletteName(paletteToLoad.name || 'New Palette');
            toast({ title: "Palette Loaded", description: `Loaded "${paletteToLoad.name}" from Inspiration.` });
          }
      } catch (e) {
          console.error("Failed to parse palette from storage", e);
      }
      // Clean up the URL after loading
      if(searchParams.has('from_inspiration')) {
        router.replace('/', { scroll: false });
      }
    } else if (isInitialLoad.current) {
      isInitialLoad.current = false;
      regeneratePalette();
    }
  }, [searchParams, router, toast, regeneratePalette]);


  const handleColorChange = useCallback((newColor: any) => {
    setMainColor(newColor.hex);
  }, []);

  const handleAddColorToPalette = useCallback(() => {
    setPalette(prevColors => {
      if (prevColors.some(p => p.hex === mainColor)) {
        toast({ title: 'Color already in palette.' });
        return prevColors;
      }
      const newColor: PaletteColor = { id: Date.now(), hex: mainColor, locked: false };
      return [...prevColors, newColor];
    });
    toast({ title: 'Color added to palette!' });
  }, [mainColor, toast]);
  
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
    
    setLibraryUpdateKey(k => k + 1);
    setIsSaveDialogOpen(false);
    setNewPaletteName("");
    setEditingPaletteId(null);
  }, [palette, newPaletteName, toast, editingPaletteId]);
  
  const handleLoadPaletteFromLibrary = useCallback((colors: string[]) => {
    if (colors.length < 1) {
        toast({ title: "Invalid palette to load.", variant: "destructive" });
        return;
    }
    setEditingPaletteId(null); // Loading from library is not editing
    setPalette(colors.map((hex, i) => ({ id: Date.now() + i, hex, locked: false })));
    setMainColor(colors[0]);
  }, [toast]);

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
  }, []);

  const handleReset = useCallback(() => {
    setEditingPaletteId(null);
    setPalette([]);
    setTimeout(() => regeneratePalette(true), 0);
    toast({ title: "Palette Reset" });
  }, [regeneratePalette, toast]);

  const handleApplyAnalyzedPalette = useCallback((newHexes: string[]) => {
    setPalette(newHexes.map((hex, i) => ({ 
        id: palette[i]?.id || Date.now() + i, 
        hex, 
        locked: false
    })));
    toast({ title: "Palette Updated", description: "The analyzed palette has been applied to the editor." });
  }, [palette, toast]);


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
            <div className="relative group">
              <div className="flex h-16 w-full overflow-hidden rounded-md border">
                  {simulatedPalette.map((color, index) => (
                  <div key={index} style={{ backgroundColor: color }} className="flex-1" />
                  ))}
              </div>
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                  <Button onClick={() => handleApplyAnalyzedPalette(simulatedPalette)} variant="secondary">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Use This Palette
                  </Button>
              </div>
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
      isPaletteColorblindSafe, simulatedPalette, graphData,
      handleApplyAnalyzedPalette
  ]);

  useEffect(() => {
    setExtension(analysisPanel);
    return () => {
      setExtension(null);
    };
  }, [analysisPanel, setExtension]);

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
      
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
            Detected Harmony: <span className="font-semibold text-foreground">{detectedHarmony}</span>
        </div>
        <Button onClick={handleOpenSaveDialog}>
          {editingPaletteId ? <Pencil className="mr-2 h-4 w-4" /> : null}
          {editingPaletteId ? 'Update Palette' : 'Save to Library'}
        </Button>
      </div>
    </div>
  );


  return (
    <main className="flex-1 w-full p-4 md:p-8 flex flex-col gap-8">
      {/* Save Dialog */}
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
                    <Button type="submit">{editingPaletteId ? 'Update' : 'Save'} palette</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      
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
                      className="relative group w-full h-24 rounded-md border flex items-center justify-center text-center p-4"
                      style={{ backgroundColor: mainColor, color: isContrastMode ? contrastTextColor : 'inherit' }}
                    >
                       {!isContrastMode && (
                          <Button
                              onClick={handleAddColorToPalette}
                              size="icon"
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full h-12 w-12 bg-black/30 text-white backdrop-blur-sm hover:bg-black/50"
                              title="Add color to palette"
                          >
                              <Plus className="h-6 w-6" />
                          </Button>
                      )}
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
            </Card>
        </div>

        <div className="w-full flex justify-center lg:justify-end">
            <AnimatePresence mode="wait">
              {isContrastMode ? (
                <motion.div
                  key="text-picker"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-sm h-full"
                >
                    <Card className="w-full h-full flex flex-col">
                        <CardContent className="flex-grow p-4">
                            <ColorPickerClient 
                              color={contrastTextColor} 
                              onChange={(c) => setContrastTextColor(c.hex)}
                              className="w-full border-0 shadow-none p-0 h-full"
                            />
                        </CardContent>
                    </Card>
                </motion.div>
              ) : (
                <motion.div
                    key="library-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-sm h-full"
                >
                    <SavedPalettes key={libraryUpdateKey} onLoadPalette={handleLoadPaletteFromLibrary} />
                </motion.div>
              )}
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
          actions={paletteActions}
        />
      </section>
    </main>
  );
}
