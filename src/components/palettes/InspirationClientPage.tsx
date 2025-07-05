
'use client';

import React from 'react';
import type { CategorizedPalette } from '@/lib/palette-parser';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InspirationClientPageProps {
  allPalettes: CategorizedPalette[];
}

export function InspirationClientPage({ allPalettes }: InspirationClientPageProps) {
  const { toast } = useToast();

  const handleSavePalette = (palette: { name: string; colors: string[] }) => {
    try {
      const savedPalettesJSON = localStorage.getItem('saved_palettes');
      let savedPalettes = savedPalettesJSON ? JSON.parse(savedPalettesJSON) : [];

      // Check if a palette with the same name already exists
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
            {palettesByCategory[category].map((palette, index) => (
                <div className="group" key={`${palette.name}-${index}`} onClick={() => handleSavePalette(palette)}>
                    <p className="text-sm font-medium mb-2 truncate" title={palette.name}>{palette.name}</p>
                    <div className="flex flex-wrap h-16 w-full cursor-pointer overflow-hidden rounded-md border-2 border-transparent transition-all group-hover:border-primary">
                        {palette.colors.map((color, colorIndex) => (
                            <div
                                key={colorIndex}
                                className="w-[10%]"
                                style={{
                                    backgroundColor: color,
                                    height: palette.colors.length > 10 ? '50%' : '100%',
                                }}
                            />
                        ))}
                    </div>
                </div>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
