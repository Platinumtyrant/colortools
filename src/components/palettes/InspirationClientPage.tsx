
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const brandKeywords = [
    'gucci', 'discord', 'windows', 'material design', 'bootstrap', 'cyberpunk', 'miku', 'trello', 'spotify', 'facebook', 
    'instagram', 'twitch', 'joomla', 'netflix', 'microsoft', 'apple', 'bmw', 'amazon', 'fedex', 
    'google', 'telegram', 'steam', 'valorant', 'rolex', 'samsung', 'logitech', 'figma', 
    'whatsapp', 'vs code', 'visual studio', 'typescript', 'javascript', 'php', 'java', 
    'shell', 'kpmg', 'dr. pepper', 'reese\'s', 'dunkin', 'red bull', 'm&m', 'coca-cola', 'pepsi', 
    'snapchat', 'youtube', 'illustrator', 'us dollar',
    'rubik\'s cube', 'tetris', 'harry potter', 'washington commanders', 'blender', 'flat ui'
];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function getBrandFromPaletteName(name: string): string | null {
  const lowerName = name.toLowerCase();

  // Specific mappings first to consolidate brands
  if (lowerName.includes('windows') || lowerName.includes('visual studio') || lowerName.includes('vs code') || lowerName.includes('microsoft')) return 'Microsoft';
  if (lowerName.includes('apple') || lowerName.includes('ios')) return 'Apple';
  if (lowerName.includes('material design') || lowerName.includes('chrome music lab')) return 'Google';
  if (lowerName.includes('bootstrap')) return 'Bootstrap';
  if (lowerName.includes('rubik\'s cube')) return 'Rubik\'s Cube';
  if (lowerName.includes('tetris')) return 'Tetris';
  if (lowerName.includes('harry potter')) return 'Harry Potter';
  if (lowerName.includes('washington commanders')) return 'Washington Commanders';
  if (lowerName.includes('blender')) return 'Blender';
  if (lowerName.includes('flat ui')) return 'Flat UI';


  // Keywords that have been explicitly mapped above
  const handledKeywords = [
      'windows', 'visual studio', 'vs code', 'microsoft',
      'material design', 'bootstrap', 'rubik\'s cube', 'tetris',
      'harry potter', 'washington commanders', 'blender', 'flat ui'
  ];

  for (const keyword of brandKeywords) {
    if (handledKeywords.includes(keyword)) continue;
    
    if (lowerName.includes(keyword)) {
        return keyword.split(' ').map(capitalize).join(' ');
    }
  }

  return null;
}


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

  const renderPalette = (palette: CategorizedPalette, paletteIndex: number) => (
      <div className="group/palette" key={`${palette.name}-${paletteIndex}`}>
          <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium truncate cursor-pointer" title={palette.name} onClick={() => handleSavePalette(palette)}>{palette.name}</p>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover/palette:opacity-100 transition-opacity"
                                onClick={() => handleSavePalette(palette)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Save this palette to your library</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
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
  );

  return (
    <Tabs defaultValue={orderedCategories[0]} className="w-full">
      <TabsList className="h-auto flex-wrap justify-start">
        {orderedCategories.map(category => (
          <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
        ))}
      </TabsList>
      
      {orderedCategories.map(category => {
        if (category === 'Brands') {
            const brands = palettesByCategory[category].reduce((acc, palette) => {
              const brandName = getBrandFromPaletteName(palette.name) || 'Other Brands';
              if (!acc[brandName]) {
                acc[brandName] = [];
              }
              acc[brandName].push(palette);
              return acc;
            }, {} as Record<string, CategorizedPalette[]>);
    
            const sortedBrands = Object.keys(brands).sort((a, b) => {
                if (a === 'Other Brands') return 1;
                if (b === 'Other Brands') return -1;
                return a.localeCompare(b);
            });

            return (
                <TabsContent key={category} value={category} className="mt-6">
                    <div className="space-y-10">
                        {sortedBrands.map(brandName => (
                            <div key={brandName}>
                                <h3 className="text-xl font-semibold mb-4 border-b pb-2">{brandName}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                                    {brands[brandName].map(renderPalette)}
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>
            )
        }
        
        return (
            <TabsContent key={category} value={category} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                {palettesByCategory[category].map(renderPalette)}
              </div>
            </TabsContent>
        )
      })}
    </Tabs>
  );
}
