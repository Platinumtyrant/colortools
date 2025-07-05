
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Download, Library as LibraryIcon, PlusCircle } from 'lucide-react';
import { colord } from 'colord';
import { prebuiltPalettes, type PrebuiltPalette } from '@/lib/prebuilt-palettes';

type SavedPalette = {
  id: number;
  name: string;
  colors: string[];
};

const migratePalettes = (palettes: any): SavedPalette[] => {
  if (!palettes || !Array.isArray(palettes)) return [];
  if (palettes.length > 0 && typeof palettes[0] === 'object' && palettes[0] !== null && 'id' in palettes[0]) {
    return palettes as SavedPalette[];
  }
  // Data is in the old format (string[][])
  return (palettes as string[][]).map((colors, index) => ({
    id: Date.now() + index,
    name: `My Palette ${index + 1}`,
    colors,
  }));
};

export default function LibraryPage() {
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedPalettesJSON = localStorage.getItem('saved_palettes');
      if (savedPalettesJSON) {
        const palettes = JSON.parse(savedPalettesJSON);
        const migrated = migratePalettes(palettes);
        setSavedPalettes(migrated);
        // If migration happened, save the new structure back
        if (JSON.stringify(migrated) !== JSON.stringify(palettes)) {
          localStorage.setItem('saved_palettes', JSON.stringify(migrated));
        }
      }
    } catch (error) {
      console.error("Failed to parse saved palettes from localStorage", error);
      toast({
        title: "Error loading palettes",
        description: "Could not load your saved palettes.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleDeletePalette = useCallback((idToDelete: number) => {
    const newPalettes = savedPalettes.filter(({ id }) => id !== idToDelete);
    setSavedPalettes(newPalettes);
    localStorage.setItem('saved_palettes', JSON.stringify(newPalettes));
    toast({ title: "Palette Deleted" });
  }, [savedPalettes, toast]);
  
  const handleAddPrebuiltPalette = useCallback((palette: PrebuiltPalette) => {
    setSavedPalettes(prev => {
      const newPalette: SavedPalette = {
        id: Date.now(),
        name: palette.name,
        colors: palette.colors,
      };
      const newPalettes = [...prev, newPalette];
      localStorage.setItem('saved_palettes', JSON.stringify(newPalettes));
      return newPalettes;
    });
    toast({ title: "Palette Added!", description: `"${palette.name}" has been added to your library.`});
  }, []);

  const exportPaletteAsSvg = useCallback((palette: {name: string, colors: string[]}) => {
    if (!palette || !palette.colors) return;
    
    const swatchWidth = 150;
    const swatchHeight = 250;
    const padding = 20;
    const spacing = 20;

    const svgWidth = padding * 2 + (palette.colors.length * swatchWidth) + (palette.colors.length > 1 ? (palette.colors.length - 1) * spacing : 0);
    const svgHeight = padding * 2 + swatchHeight;

    let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" style="background-color: #1E1E1E;">`;

    palette.colors.forEach((color, index) => {
      const xPos = padding + index * (swatchWidth + spacing);
      const colorInstance = colord(color);
      const textColor = colorInstance.isLight() ? '#000000' : '#FFFFFF';
      
      const rgb = colorInstance.toRgb();
      const hsl = colorInstance.toHsl();

      svgContent += `<rect x="${xPos}" y="${padding}" width="${swatchWidth}" height="${swatchHeight}" fill="${color}" />`;
      
      const textX = xPos + 15;
      let textY = padding + swatchHeight - 15;

      svgContent += `<text x="${textX}" y="${textY}" fill="${textColor}" font-size="14">HSL: ${hsl.h}, ${hsl.s}%, ${hsl.l}%</text>`;
      textY -= 20;
      
      svgContent += `<text x="${textX}" y="${textY}" fill="${textColor}" font-size="14">RGB: ${rgb.r}, ${rgb.g}, ${rgb.b}</text>`;
      textY -= 20;

      svgContent += `<text x="${textX}" y="${textY}" fill="${textColor}" font-size="14" font-weight="bold">HEX: ${color.toUpperCase()}</text>`;
    });

    svgContent += `</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${palette.name.replace(/ /g, '_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: "Palette Exported as SVG!" });
  }, [toast]);

  const NoPalettesState = () => (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
      <LibraryIcon className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-medium">
        Library is empty
      </h3>
      <p className="mb-4 mt-2 text-sm text-muted-foreground">
        Go to the Palette Builder to create and save your first one.
      </p>
    </div>
  );

  return (
    <main className="flex-1 w-full p-4 md:p-8">
       <CardHeader className="p-0 mb-8">
        <CardTitle className="text-3xl">Library</CardTitle>
        <CardDescription>Browse your saved palettes or explore pre-built collections.</CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="my-library" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="my-library">My Library</TabsTrigger>
          <TabsTrigger value="pre-built">Pre-built</TabsTrigger>
        </TabsList>
        <TabsContent value="my-library">
          {savedPalettes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {savedPalettes.map((palette) => (
                <Card key={palette.id} className="overflow-hidden bg-card flex flex-col">
                  <CardContent className="p-0 flex-grow">
                    <div className="flex h-24">
                      {palette.colors.map((color) => (
                        <div
                          key={color}
                          className="flex-1"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="p-4">
                      <p className="text-md font-semibold truncate" title={palette.name}>{palette.name}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                        {palette.colors.map((color) => (
                          <span key={color} className="font-mono text-xs text-muted-foreground">{color.toUpperCase()}</span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end gap-2 p-4 pt-0">
                      <Button variant="outline" size="sm" onClick={() => handleDeletePalette(palette.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                      <Button size="sm" onClick={() => exportPaletteAsSvg(palette)}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <NoPalettesState />
          )}
        </TabsContent>
        <TabsContent value="pre-built">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {prebuiltPalettes.map((palette, index) => (
                <Card key={index} className="overflow-hidden bg-card flex flex-col">
                   <CardContent className="p-0 flex-grow">
                    <div className="flex h-24">
                      {palette.colors.map((color) => (
                        <div
                          key={color}
                          className="flex-1"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="p-4">
                      <p className="text-md font-semibold truncate" title={palette.name}>{palette.name}</p>
                       <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                        {palette.colors.map((color) => (
                          <span key={color} className="font-mono text-xs text-muted-foreground">{color.toUpperCase()}</span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                   <CardFooter className="justify-end gap-2 p-4 pt-0">
                      <Button size="sm" onClick={() => handleAddPrebuiltPalette(palette)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add to Library
                      </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
