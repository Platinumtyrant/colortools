"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, Download, Library as LibraryIcon } from 'lucide-react';
import { colord } from 'colord';

type Palette = string[];

export default function LibraryPage() {
  const [savedPalettes, setSavedPalettes] = useState<Palette[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedPalettesJSON = localStorage.getItem('saved_palettes');
      if (savedPalettesJSON) {
        const palettes = JSON.parse(savedPalettesJSON);
        setSavedPalettes(palettes);
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

  const handleDeletePalette = useCallback((indexToDelete: number) => {
    const newPalettes = savedPalettes.filter((_, index) => index !== indexToDelete);
    setSavedPalettes(newPalettes);
    localStorage.setItem('saved_palettes', JSON.stringify(newPalettes));
    toast({ title: "Palette Deleted" });
  }, [savedPalettes, toast]);

  const exportPaletteAsSvg = useCallback((palette: Palette) => {
    if (!palette) return;
    
    const swatchWidth = 150;
    const swatchHeight = 250;
    const padding = 20;
    const spacing = 20;

    const svgWidth = padding * 2 + (palette.length * swatchWidth) + (palette.length > 1 ? (palette.length - 1) * spacing : 0);
    const svgHeight = padding * 2 + swatchHeight;

    let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" style="background-color: #1E1E1E;">`;

    palette.forEach((color, index) => {
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
    link.download = 'palette.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: "Palette Exported as SVG!" });
  }, [toast]);

  return (
    <main className="flex-1 w-full p-4 md:p-8">
       <CardHeader className="p-0 mb-8">
        <CardTitle className="text-3xl">My Library</CardTitle>
        <CardDescription>All your saved palettes are here. Go to the Palette Builder to create a new one.</CardDescription>
      </CardHeader>
      
      {savedPalettes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {savedPalettes.map((palette, index) => (
            <Card key={index} className="overflow-hidden bg-card flex flex-col">
              <CardContent className="p-0 flex-grow">
                <div className="flex h-24">
                  {palette.map((color) => (
                    <div
                      key={color}
                      className="flex-1"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="p-4">
                  <p className="text-md font-semibold">Palette {index + 1}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    {palette.map((color) => (
                      <span key={color} className="font-mono text-xs text-muted-foreground">{color.toUpperCase()}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end gap-2 p-4 pt-0">
                  <Button variant="outline" size="sm" onClick={() => handleDeletePalette(index)}>
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
        <div className="flex h-full min-h-[60vh] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
          <LibraryIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">
            Library is empty
          </h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            Go to the Palette Builder to create and save your first one.
          </p>
        </div>
      )}
    </main>
  );
}
