
'use client';

import React, { useState, useRef } from 'react';
import type { CategorizedPalette } from '@/lib/palette-parser';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { colord } from 'colord';
import { getDescriptiveColorName } from '@/lib/colors';

interface InspirationClientPageProps {
  allPalettes: CategorizedPalette[];
}

export function InspirationClientPage({ allPalettes }: InspirationClientPageProps) {
  const { toast } = useToast();
  // State to manage which popover is open based on hover
  const [openPopoverKey, setOpenPopoverKey] = useState<string | null>(null);
  const popoverTimeoutRef = useRef<number | null>(null);

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

  const handleCopy = (e: React.MouseEvent, text: string, type: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
        toast({ title: `${type} copied: ${text}` });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
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

  const handleMouseEnter = (key: string) => {
    if (popoverTimeoutRef.current) {
      clearTimeout(popoverTimeoutRef.current);
      popoverTimeoutRef.current = null;
    }
    setOpenPopoverKey(key);
  };

  const handleMouseLeave = () => {
    popoverTimeoutRef.current = window.setTimeout(() => {
      setOpenPopoverKey(null);
    }, 200); // Add a small delay to allow moving mouse to popover content
  };

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
                <div className="group" key={`${palette.name}-${paletteIndex}`}>
                    <p className="text-sm font-medium mb-2 truncate cursor-pointer" title={palette.name} onClick={() => handleSavePalette(palette)}>{palette.name}</p>
                    <div 
                      className="flex flex-wrap w-full cursor-pointer overflow-hidden rounded-md border-2 border-transparent transition-all group-hover:border-primary"
                      onClick={() => handleSavePalette(palette)}
                    >
                        {palette.colors.map((color, colorIndex) => {
                          const popoverKey = `${category}-${paletteIndex}-${colorIndex}`;
                          const hex = colord(color).toHex();
                          const rgb = colord(color).toRgb();
                          const hsl = colord(color).toHsl();
                          const name = getDescriptiveColorName(hex);
                          return (
                            <Popover key={popoverKey} open={openPopoverKey === popoverKey} onOpenChange={(isOpen) => setOpenPopoverKey(isOpen ? popoverKey : null)}>
                                <PopoverTrigger asChild>
                                    <div
                                        onMouseEnter={() => handleMouseEnter(popoverKey)}
                                        onMouseLeave={handleMouseLeave}
                                        className="w-[10%] flex-grow"
                                        style={{
                                            backgroundColor: color,
                                            height: palette.colors.length > 10 ? '2rem' : '4rem',
                                        }}
                                        title="Hover for details, click to save palette"
                                    />
                                </PopoverTrigger>
                                <PopoverContent 
                                    className="w-64"
                                    onMouseEnter={() => handleMouseEnter(popoverKey)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <h4 className="font-medium leading-none capitalize">{name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                            Click a value to copy it.
                                            </p>
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between items-center cursor-pointer p-1 -m-1 hover:bg-muted rounded-sm" onClick={(e) => handleCopy(e, hex, 'HEX')}>
                                                <span className="text-muted-foreground">HEX</span>
                                                <span className="font-mono font-semibold text-right break-all">{hex}</span>
                                            </div>
                                            <div className="flex justify-between items-center cursor-pointer p-1 -m-1 hover:bg-muted rounded-sm" onClick={(e) => handleCopy(e, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'RGB')}>
                                                <span className="text-muted-foreground">RGB</span>
                                                <span className="font-mono font-semibold text-right break-all">{`${rgb.r}, ${rgb.g}, ${rgb.b}`}</span>
                                            </div>
                                            <div className="flex justify-between items-center cursor-pointer p-1 -m-1 hover:bg-muted rounded-sm" onClick={(e) => handleCopy(e, `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 'HSL')}>
                                                <span className="text-muted-foreground">HSL</span>
                                                <span className="font-mono font-semibold text-right break-all">{`${hsl.h}, ${hsl.s}%, ${hsl.l}%`}</span>
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                          )
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
