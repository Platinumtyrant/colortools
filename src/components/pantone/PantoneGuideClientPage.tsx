
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PantoneCategory, PantoneColor } from '@/lib/pantone-colors';
import { sortPantoneNumerically } from '@/lib/pantone-colors';
import { ColorBox } from '@/components/colors/ColorBox';
import { useToast } from '@/hooks/use-toast';
import { usePaletteBuilder } from '@/contexts/PaletteBuilderContext';
import { colord } from 'colord';
import { saveColorToLibrary, removeColorFromLibrary } from '@/lib/colors';
import { Skeleton } from '@/components/ui/skeleton';

interface PantoneGuideClientPageProps {
  pmsCategories: PantoneCategory[];
  fhiCategories: PantoneCategory[];
}

export function PantoneGuideClientPage({ pmsCategories, fhiCategories }: PantoneGuideClientPageProps) {
  const { toast } = useToast();
  const { palette, setPalette } = usePaletteBuilder();
  const [libraryColors, setLibraryColors] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  const paletteHexes = React.useMemo(() => new Set(palette.map(p => colord(p.hex).toHex())), [palette]);
  const libraryHexes = React.useMemo(() => new Set(libraryColors.map(c => colord(c).toHex())), [libraryColors]);

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

  const allPmsColors = useMemo(() => 
    pmsCategories.flatMap(c => c.colors).sort(sortPantoneNumerically), 
    [pmsCategories]
  );
  
  const allFhiColors = useMemo(() => 
    fhiCategories.flatMap(c => c.colors).sort(sortPantoneNumerically), 
    [fhiCategories]
  );
  
  const renderColorGrid = (colors: PantoneColor[]) => (
    <div className="flex flex-wrap gap-4">
        {colors.map((color, index) => {
            if (!isClient) {
              return <Skeleton key={index} className="w-40 h-[72px] rounded-md" />;
            }

            const normalizedColor = colord(color.hex).toHex();
            const isInLibrary = libraryHexes.has(normalizedColor);
            const isInPalette = paletteHexes.has(normalizedColor);
            return (
                <div className="w-40" key={`${color.name}-${index}`}>
                    <ColorBox
                        color={color.hex}
                        name={color.name}
                        info={color.cmyk}
                        variant="compact"
                        onAddToLibrary={!isInLibrary ? () => handleToggleLibrary(color.hex) : undefined}
                        onRemoveFromLibrary={isInLibrary ? () => handleToggleLibrary(color.hex) : undefined}
                        onAddToPalette={!isInPalette ? () => handleAddToPalette(color.hex) : undefined}
                        onRemoveFromPalette={isInPalette ? () => handleRemoveFromPalette(color.hex) : undefined}
                    />
                </div>
            )
        })}
    </div>
  );

  return (
    <div className="flex-1 w-full p-4 md:p-8 flex flex-col">
        <div className="flex-grow">
            <CardHeader className="p-0 mb-8 space-y-2">
                <CardTitle className="text-3xl">Pantone Color Guides</CardTitle>
                <CardDescription>Browse official Pantone color systems. PMS is for print, while FHI is for fashion, home, and interiors.</CardDescription>
            </CardHeader>

            <Tabs defaultValue="pms" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pms">PMS (Print)</TabsTrigger>
                    <TabsTrigger value="fhi">FHI (Fashion, Home + Interiors)</TabsTrigger>
                </TabsList>

                <TabsContent value="pms" className="mt-6">
                    {allPmsColors.length > 0 ? renderColorGrid(allPmsColors) : <p>No PMS color data available.</p>}
                </TabsContent>
                <TabsContent value="fhi" className="mt-6">
                    {allFhiColors.length > 0 ? renderColorGrid(allFhiColors) : <p>No FHI color data available.</p>}
                </TabsContent>
            </Tabs>
        </div>
      <footer className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground space-y-2">
        <p>PANTONE® Colors displayed here may not match PANTONE-identified standards. Consult current PANTONE Color Publications for accurate color.</p>
        <p>PANTONE® and other Pantone, Inc. trademarks are the property of Pantone, Inc. © Pantone, Inc., 2005. All rights reserved.</p>
      </footer>
    </div>
  );
}
