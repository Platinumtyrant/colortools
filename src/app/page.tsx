
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
import { analyzePalette } from '@/lib/palette-analyzer';
import { Palette } from '@/components/palettes/Palette';
import { Tooltip as ShadTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dices, Pencil, Sparkles, Pipette, Unlock, Lock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { ColorBox } from '@/components/colors/ColorBox';
import { Slider } from '@/components/ui/slider';
import type { ColorResult } from 'react-color';
import { Separator } from '@/components/ui/separator';
import { usePaletteBuilder } from '@/contexts/PaletteBuilderContext';
import { saveColorToLibrary, removeColorFromLibrary } from '@/lib/colors';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

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

extend([hwbPlugin, cmykPlugin, lchPlugin, labPlugin, namesPlugin]);

const ColorWheel = dynamic(() => import('@uiw/react-color-wheel').then(mod => mod.default), {
  ssr: false,
  loading: () => (
      <div className="flex justify-center items-center w-[280px] h-[280px]">
        <Skeleton className="w-full h-full rounded-full" />
      </div>
  )
});

const allGenerationTypes: GenerationType[] = ['analogous', 'triadic', 'complementary', 'tints', 'shades'];

function PaletteBuilderPage() {
    const { 
        mainColor, setMainColor, 
        palette, setPalette, 
        generationType, setGenerationType,
        isHarmonyLocked, setIsHarmonyLocked,
        paletteToLoad, loadPalette, clearPaletteToLoad
    } = usePaletteBuilder();
    
    const [inputValue, setInputValue] = useState(mainColor);
    
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [newPaletteName, setNewPaletteName] = useState("");
    const [editingPaletteId, setEditingPaletteId] = useState<number | null>(null);
    const [editingColorId, setEditingColorId] = useState<number | null>(null);
    const [libraryColors, setLibraryColors] = useState<string[]>([]);
    const [isClient, setIsClient] = useState(false);
    const libraryHexes = useMemo(() => new Set(libraryColors.map(c => colord(c).toHex())), [libraryColors]);

    const { toast } = useToast();
    const router = useRouter();
    const isInitialLoad = useRef(true);

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
                    <DialogHeader>
                        <DialogTitle>{editingPaletteId ? 'Update Palette' : 'Save Palette'}</DialogTitle>
                        <DialogDescription>
                            Give your palette a name. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <form id="save-palette-form" onSubmit={handleSaveToLibrary}>
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
                    </form>
                    <DialogFooter>
                        <Button type="submit" form="save-palette-form">{editingPaletteId ? 'Update' : 'Save'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 p-4 md:p-8 overflow-y-auto">
                <div className="flex flex-col items-center justify-center gap-8">
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
                                 {isClient ? (
                                     <ColorBox
                                        variant="default"
                                        color={mainColor}
                                        onAddToLibrary={!libraryHexes.has(colord(mainColor).toHex()) ? () => handleToggleLibrary(mainColor) : undefined}
                                        onRemoveFromLibrary={libraryHexes.has(colord(mainColor).toHex()) ? () => handleToggleLibrary(mainColor) : undefined}
                                    />
                                 ) : (
                                    <Skeleton className="w-full h-[450px] max-w-sm" />
                                 )}
                            </div>
                        </div>
                    </section>
                </div>
                
                <section className="flex flex-col min-h-0 lg:min-h-full">
                    {isClient ? (
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
                    ) : (
                        <Card className="bg-card/50 overflow-hidden flex flex-col h-full">
                            <CardHeader className="p-4 border-b">
                                <Skeleton className="h-10 w-full max-w-xs" />
                                <Skeleton className="h-9 w-40" />
                            </CardHeader>
                            <CardContent className="p-4 flex flex-col flex-grow min-w-0">
                                 <div className="flex flex-wrap gap-x-4 gap-y-6 content-start">
                                    {[...Array(5)].map((_, i) => (
                                        <Skeleton key={i} className="w-40 h-[72px] rounded-md" />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </section>
            </main>
        </div>
    );
}

export default PaletteBuilderPage;
