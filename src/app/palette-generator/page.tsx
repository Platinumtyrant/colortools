
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { PaletteGenerator } from '@/components/palettes/PaletteGenerator';
import { Palette } from '@/components/palettes/Palette';
import { useToast } from "@/hooks/use-toast";
import { generatePalette, getRandomColor, type GenerationType } from '@/lib/palette-generator';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GENERATION_MODES: GenerationType[] = ['analogous', 'complementary', 'triadic', 'tints', 'shades'];

export interface PaletteColor {
  id: number;
  hex: string;
  locked: boolean;
}

let nextId = 0;
const getNextId = () => {
    nextId += 1;
    return nextId;
};

export default function PaletteGeneratorPage() {
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [numColors, setNumColors] = useState(5);
  const [baseGenerationType, setBaseGenerationType] = useState<GenerationType>('analogous');
  const [generationCycleIndex, setGenerationCycleIndex] = useState(0);
  const { toast } = useToast();

  const regeneratePalette = useCallback((
    lockedHex: string[], 
    count: number,
    type: GenerationType,
    baseForGeneration: string[]
    ) => {
    const newHexPalette = generatePalette({
        numColors: count,
        type: type,
        lockedColors: baseForGeneration,
    });
    
    const finalPalette: PaletteColor[] = [];
    const usedNewHex: string[] = [];
    const lockedInPalette = palette.filter(p => p.locked);
    
    lockedInPalette.forEach(p => {
        if (finalPalette.length < count) {
            finalPalette.push(p);
            usedNewHex.push(p.hex);
        }
    });
    
    let newColorIndex = 0;
    while(finalPalette.length < count && newColorIndex < newHexPalette.length) {
        const newHex = newHexPalette[newColorIndex];
        if (!finalPalette.some(p => p.hex === newHex)) {
            finalPalette.push({ id: getNextId(), hex: newHex, locked: false });
        }
        newColorIndex++;
    }

    setPalette(finalPalette.slice(0, count));

  }, [palette]);
  
  // Effect for regeneration when numColors changes
  useEffect(() => {
    if (palette.length === 0) return; // Don't run on initial mount before palette is set

    const lockedColors = palette.filter(p => p.locked).map(p => p.hex);
    let type = baseGenerationType;
    if (lockedColors.length > 0) {
      type = GENERATION_MODES[generationCycleIndex];
    }
    const baseForGeneration = lockedColors.length > 0 ? lockedColors : [palette[0].hex];
    regeneratePalette(lockedColors, numColors, type, baseForGeneration);
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numColors]);

  // Initial generation on mount
  useEffect(() => {
    const initialHexPalette = generatePalette({ numColors: 5, type: 'analogous', lockedColors: [getRandomColor()] });
    setPalette(initialHexPalette.map(hex => ({ id: getNextId(), hex, locked: false })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRandomize = useCallback(() => {
    const lockedColors = palette.filter(p => p.locked).map(p => p.hex);
    
    let nextCycleIndex = generationCycleIndex;
    let type = baseGenerationType;

    if (lockedColors.length > 0) {
      type = GENERATION_MODES[nextCycleIndex];
      nextCycleIndex = (generationCycleIndex + 1) % GENERATION_MODES.length;
      setGenerationCycleIndex(nextCycleIndex);
    }
    
    const baseForGeneration = lockedColors.length > 0 ? lockedColors : [getRandomColor()];
    regeneratePalette(lockedColors, numColors, type, baseForGeneration);

    toast({ title: lockedColors.length > 0 ? `Generated '${type}' palette` : "Generated new random palette" });
  }, [palette, numColors, baseGenerationType, generationCycleIndex, toast, regeneratePalette]);

  const handleColorChange = (id: number, newHex: string) => {
    setPalette(p => p.map(c => c.id === id ? { ...c, hex: newHex } : c));
  };
  
  const handleLockToggle = (id: number) => {
    setPalette(p => p.map(c => c.id === id ? { ...c, locked: !c.locked } : c));
    const currentlyLockedCount = palette.filter(p => p.locked).length;
    const isTogglingLastLock = currentlyLockedCount === 1 && palette.find(p => p.id === id)?.locked;
    if (isTogglingLastLock) {
      setGenerationCycleIndex(0);
    }
  };

  const handleRemoveColor = (id: number) => {
    if (palette.length <= 2) {
      toast({ title: "Minimum 2 colors required", variant: 'destructive' });
      return;
    }
    setPalette(p => p.filter(c => c.id !== id));
    setNumColors(n => n - 1);
  };
  
  const handleSavePalette = useCallback(() => {
    const currentPaletteHex = palette.map(p => p.hex);
    if (currentPaletteHex.length === 0) {
      toast({ title: "Cannot save an empty palette", variant: "destructive" });
      return;
    }
    try {
      const savedPalettesJSON = localStorage.getItem('saved_palettes');
      const savedPalettes = savedPalettesJSON ? JSON.parse(savedPalettesJSON) : [];
      savedPalettes.push(currentPaletteHex);
      localStorage.setItem('saved_palettes', JSON.stringify(savedPalettes));
      toast({
        title: "Palette Saved!",
        description: "Your new palette has been saved to the library.",
      });
    } catch (error) {
      console.error("Failed to save palette:", error);
      toast({
        title: "Error Saving Palette",
        variant: "destructive",
      });
    }
  }, [palette, toast]);
  
  const hasLockedColors = palette.some(p => p.locked);

  return (
    <main className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8 flex flex-col h-[calc(100vh-100px)]">
      <PaletteGenerator
        onRandomize={handleRandomize}
        numColors={numColors}
        setNumColors={setNumColors}
        generationType={baseGenerationType}
        setGenerationType={setBaseGenerationType}
        isGenerationLocked={hasLockedColors}
      />
      
      {palette.length > 0 && (
         <div className="flex-grow min-h-0">
            <Palette 
                palette={palette}
                onColorChange={handleColorChange}
                onLockToggle={handleLockToggle}
                onRemoveColor={handleRemoveColor}
                actions={
                  <Button variant="outline" onClick={handleSavePalette}>
                      <Save className="mr-2 h-4 w-4" />
                      Save to Library
                  </Button>
                }
            />
         </div>
      )}
    </main>
  );
}
