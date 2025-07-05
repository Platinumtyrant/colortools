
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { CategorizedPalette } from '@/lib/palette-parser';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InspirationClientPageProps {
  allPalettes: CategorizedPalette[];
}

export function InspirationClientPage({ allPalettes }: InspirationClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handleLoadPalette = (palette: { name: string; colors: string[] }) => {
    const newPaletteData = {
      id: Date.now(),
      name: palette.name,
      colors: palette.colors,
    };
    localStorage.setItem('palette_to_load', JSON.stringify(newPaletteData));
    toast({
      title: 'Palette Ready!',
      description: `"${palette.name}" sent to the Palette Builder.`,
    });
    router.push('/?from_inspiration=true');
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
                <div className="group" key={`${palette.name}-${index}`} onClick={() => handleLoadPalette(palette)}>
                    <p className="text-sm font-medium mb-2 truncate" title={palette.name}>{palette.name}</p>
                    <div className="flex h-16 w-full cursor-pointer overflow-hidden rounded-md border-2 border-transparent transition-all group-hover:border-primary">
                    {palette.colors.map((color, colorIndex) => (
                        <div key={colorIndex} className="flex-1" style={{ backgroundColor: color }} />
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
