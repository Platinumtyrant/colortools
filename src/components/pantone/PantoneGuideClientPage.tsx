
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PantoneCategory } from '@/lib/pantone-colors';
import { ColorBox } from '@/components/colors/ColorBox';
import { useToast } from '@/hooks/use-toast';
import { usePaletteBuilder } from '@/contexts/PaletteBuilderContext';
import { colord } from 'colord';
import { saveColorToLibrary, removeColorFromLibrary } from '@/lib/colors';
import { Badge } from '@/components/ui/badge';

interface PantoneGuideClientPageProps {
  pantoneCategories: PantoneCategory[];
}

export function PantoneGuideClientPage({ pantoneCategories }: PantoneGuideClientPageProps) {
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

  if (!pantoneCategories || pantoneCategories.length === 0) {
    return <div>No Pantone colors found.</div>;
  }

  return (
    <div className="flex-1 w-full p-4 md:p-8 flex flex-col">
      <div className="flex-grow">
        <CardHeader className="p-0 mb-8 space-y-2">
            <div className="flex items-center gap-4">
                <CardTitle className="text-3xl">Pantone Color Bridge</CardTitle>
                <Badge variant="outline">Solid Coated</Badge>
            </div>
          <CardDescription>An unofficial reference for the Pantone Color Bridge guide. It shows each solid Pantone color alongside its closest four-color process (CMYK) match. This is essential for designers to preview how spot colors will appear when printed using standard Cyan, Magenta, Yellow, and Black inks.</CardDescription>
        </CardHeader>
        <Tabs defaultValue={pantoneCategories[0].name} className="w-full">
          <div className="flex justify-center">
            <TabsList className="h-auto flex-wrap justify-center">
              {pantoneCategories.map((category) => (
                <TabsTrigger key={category.name} value={category.name}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {pantoneCategories.map(category => (
              <TabsContent key={category.name} value={category.name} className="mt-6">
                  <div className="flex flex-wrap gap-4">
                      {category.colors.map((color, index) => {
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
              </TabsContent>
          ))}
        </Tabs>
      </div>

      <footer className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground space-y-2">
        <p>PANTONE® Colors displayed here may not match PANTONE-identified standards. Consult current PANTONE Color Publications for accurate color. PANTONE® and other Pantone, Inc. trademarks are the property of Pantone, Inc. © Pantone, Inc., 2005. All rights reserved.</p>
        <p>Hardcopies of PANTONE Color Charts and reproductions thereof MAY NOT BE SOLD in any form. Pantone, Inc. is not responsible for any modifications made to such Charts which have not been approved by Pantone, Inc. PC = four-color Process (process) simulations of solid colors Coated (stock)</p>
      </footer>
    </div>
  );
}
