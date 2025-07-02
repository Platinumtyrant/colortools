"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Trash2, Download } from 'lucide-react';
import { colord } from 'colord';

type Palette = string[];

export default function LibraryPage() {
  const [savedPalettes, setSavedPalettes] = useState<Palette[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const savedPalettesJSON = localStorage.getItem('saved_palettes');
    if (savedPalettesJSON) {
      setSavedPalettes(JSON.parse(savedPalettesJSON));
    }
  }, []);

  const handleDeletePalette = useCallback((indexToDelete: number) => {
    const newPalettes = savedPalettes.filter((_, index) => index !== indexToDelete);
    setSavedPalettes(newPalettes);
    localStorage.setItem('saved_palettes', JSON.stringify(newPalettes));
    toast({ title: "Palette Deleted" });
  }, [savedPalettes, toast]);

  const exportPaletteAsSvg = useCallback((palette: Palette) => {
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

      // Background rectangle for the swatch
      svgContent += `<rect x="${xPos}" y="${padding}" width="${swatchWidth}" height="${swatchHeight}" fill="${color}" />`;
      
      // Text inside the swatch, aligned to the bottom
      const textX = xPos + 15;
      let textY = padding + swatchHeight - 15; // Start from bottom, with padding

      // HSL
      svgContent += `<text x="${textX}" y="${textY}" fill="${textColor}" font-size="14">HSL: ${hsl.h}, ${hsl.s}%, ${hsl.l}%</text>`;
      textY -= 20;
      
      // RGB
      svgContent += `<text x="${textX}" y="${textY}" fill="${textColor}" font-size="14">RGB: ${rgb.r}, ${rgb.g}, ${rgb.b}</text>`;
      textY -= 20;

      // HEX
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
    <main className="w-full max-w-7xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Palette Library</h1>
      {savedPalettes.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border">
            <h3 className="text-xl font-medium">Your Library is Empty</h3>
            <p className="text-muted-foreground mt-2">Go to the Palette Builder to create and save your first palette.</p>
        </div>
      ) : (
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
          {savedPalettes.map((palette, index) => (
            <Card key={index} className="overflow-hidden bg-card">
              <CardContent className="p-0">
                <div className="flex h-32">
                  {palette.map((color) => (
                    <div
                      key={color}
                      className="flex-1"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="grid p-4 gap-2" style={{ gridTemplateColumns: `repeat(${palette.length}, 1fr)` }}>
                  {palette.map((color) => (
                    <div key={color} className="text-center font-mono text-xs text-muted-foreground">
                      {color.toUpperCase()}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="justify-end gap-2 p-4 pt-0 bg-card">
                <Button variant="ghost" size="icon" onClick={() => handleDeletePalette(index)} title="Delete Palette">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button onClick={() => exportPaletteAsSvg(palette)}>
                  <Download className="mr-2 h-4 w-4" />
                  Export as SVG
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
