
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { CategorizedPalette } from '@/lib/palette-parser';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { usePaletteBuilder } from '@/contexts/PaletteBuilderContext';
import { colord } from 'colord';
import { ColorBox } from '../colors/ColorBox';
import { saveColorToLibrary, removeColorFromLibrary } from '@/lib/colors';

interface InspirationClientPageProps {
  allPalettes: CategorizedPalette[];
}

export function InspirationClientPage({ allPalettes }: InspirationClientPageProps) {
  const { toast } = useToast();
  const { palette, setPalette } = usePaletteBuilder();
  const [libraryColors, setLibraryColors] = useState<string[]>([]);

  const paletteHexes = React.useMemo(() => new Set(palette.map(p => colord(p.hex).toHex())), [palette]);
  const libraryHexes = React.useMemo(() => new Set(libraryColors.map(c => colord(c).toHex())), [libraryColors]);

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


  const handleSavePalette = (palette: { name: string; colors: string[] }) => {
    try {
      const savedPalettesJSON = localStorage.getItem('saved_palettes');
      let savedPalettes = savedPalettesJSON ? JSON.parse(savedPalettesJSON) : [];

      const isDuplicate = savedPalettes.some((p: { name: string; }) => p.name.toLowerCase() === palette.name.toLowerCase());

      if (isDuplicate) {
        toast({
          title: 'Palette Already in Library',
          description: `A palette named "${palette.name}" already exists.`,
        });
        return;
      }

      const newPalette = {
        id: Date.now(),
        name: palette.name,
        colors: palette.colors,
      };

      savedPalettes.push(newPalette);
      localStorage.setItem('saved_palettes', JSON.stringify(savedPalettes));
      toast({
        title: 'Saved to Library',
        description: `"${palette.name}" has been added to your library.`,
      });
    } catch (e) {
      console.error("Could not save palette to local storage", e);
      toast({
        title: 'Error',
        description: 'There was a problem saving the palette.',
        variant: 'destructive'
      })
    }
  };
  
  const palettesByCategory = allPalettes.reduce((acc, palette) => {
    const category = palette.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(palette);
    return acc;
  }, {} as Record<string, CategorizedPalette[]>);

  const categoryOrder = ['Red', 'Orange', 'Yellow', 'Green', 'Cyan', 'Blue', 'Purple', 'Monochrome', 'Multicolor', 'Brands', 'Flags'];
  const orderedCategories = categoryOrder.filter(cat => palettesByCategory[cat]);

  return (
    <Tabs defaultValue={orderedCategories[0]} className="w-full">
      <TabsList className="grid w-full grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11">
        {orderedCategories.map(category => (
          <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
        ))}
      </TabsList>
      
      {orderedCategories.map(category => (
        <TabsContent key={category} value={category} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            {palettesByCategory[category].map((palette, paletteIndex) => (
                <div className="group/palette" key={`${palette.name}-${paletteIndex}`}>
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium truncate cursor-pointer" title={palette.name} onClick={() => handleSavePalette(palette)}>{palette.name}</p>
                         <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover/palette:opacity-100 transition-opacity"
                          onClick={() => handleSavePalette(palette)}
                          title="Save this palette"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                     <div className="flex flex-wrap gap-2">
                        {palette.colors.map((color, index) => {
                           const normalizedColor = colord(color).toHex();
                           const isInLibrary = libraryHexes.has(normalizedColor);
                           const isInPalette = paletteHexes.has(normalizedColor);
                           return (
                                <div key={`${color}-${index}`} className="w-40">
                                    <ColorBox
                                        color={color}
                                        variant="compact"
                                        onAddToLibrary={!isInLibrary ? () => handleToggleLibrary(color) : undefined}
                                        onRemoveFromLibrary={isInLibrary ? () => handleToggleLibrary(color) : undefined}
                                        onAddToPalette={!isInPalette ? () => handleAddToPalette(color) : undefined}
                                        onRemoveFromPalette={isInPalette ? () => handleRemoveFromPalette(color) : undefined}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
