"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Download, Library as LibraryIcon } from 'lucide-react';
import { colord } from 'colord';
import { ColorList } from '@/components/colors/ColorList';
import { cn } from '@/lib/utils';

type Palette = string[];

export default function LibraryPage() {
  const [savedPalettes, setSavedPalettes] = useState<Palette[]>([]);
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const selectedPalette = selectedPaletteIndex !== null ? savedPalettes[selectedPaletteIndex] : null;

  useEffect(() => {
    try {
      const savedPalettesJSON = localStorage.getItem('saved_palettes');
      if (savedPalettesJSON) {
        const palettes = JSON.parse(savedPalettesJSON);
        setSavedPalettes(palettes);
        if (palettes.length > 0) {
          setSelectedPaletteIndex(0);
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

  const handleDeletePalette = useCallback(() => {
    if (selectedPaletteIndex === null) return;

    const newPalettes = savedPalettes.filter((_, index) => index !== selectedPaletteIndex);
    setSavedPalettes(newPalettes);
    localStorage.setItem('saved_palettes', JSON.stringify(newPalettes));
    toast({ title: "Palette Deleted" });

    if (newPalettes.length > 0) {
      const newIndex = Math.max(0, selectedPaletteIndex - 1);
      setSelectedPaletteIndex(newIndex);
    } else {
      setSelectedPaletteIndex(null);
    }
  }, [savedPalettes, selectedPaletteIndex, toast]);

  const exportPaletteAsSvg = useCallback((palette: Palette | null) => {
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

  const handleCopySuccess = useCallback((message: string) => {
    toast({ title: message });
  }, [toast]);

  return (
    <main className="flex-1 w-full p-4 md:p-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow max-w-3xl">
          {selectedPalette ? (
            <Card className="bg-card">
                <CardHeader>
                    <CardTitle>Palette Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <ColorList 
                        colors={selectedPalette} 
                        title="" 
                        onSetActiveColor={() => {}} 
                        onCopySuccess={handleCopySuccess}
                        gridClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    />
                </CardContent>
                <CardFooter className="justify-end gap-2">
                    <Button variant="outline" onClick={handleDeletePalette}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Palette
                    </Button>
                    <Button onClick={() => exportPaletteAsSvg(selectedPalette)}>
                      <Download className="mr-2 h-4 w-4" />
                      Export as SVG
                    </Button>
                </CardFooter>
            </Card>
          ) : (
             <div className="flex h-full min-h-[60vh] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
                <LibraryIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">
                  {savedPalettes.length > 0 ? 'Select a palette' : 'Library is empty'}
                </h3>
                <p className="mb-4 mt-2 text-sm text-muted-foreground">
                  {savedPalettes.length > 0 
                    ? 'Choose a palette from the sidebar to see its details.' 
                    : 'Go to the Palette Builder to create and save your first one.'
                  }
                </p>
              </div>
          )}
        </div>
        
        <aside className="lg:w-1/3 lg:max-w-sm flex-shrink-0">
            <div className="sticky top-20">
                <h2 className="text-2xl font-bold mb-4">My Library</h2>
                {savedPalettes.length > 0 ? (
                    <div className="space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
                    {savedPalettes.map((palette, index) => (
                        <Card 
                            key={index} 
                            className={cn(
                                "overflow-hidden bg-card cursor-pointer transition-all hover:border-primary/80",
                                selectedPaletteIndex === index ? "border-primary" : "border-border"
                            )}
                            onClick={() => setSelectedPaletteIndex(index)}
                        >
                        <CardContent className="p-0">
                            <div className="flex h-20">
                            {palette.map((color) => (
                                <div
                                key={color}
                                className="flex-1"
                                style={{ backgroundColor: color }}
                                />
                            ))}
                            </div>
                            <div className="p-3">
                                <p className="text-sm font-medium">Palette {index + 1}</p>
                                <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                                    {palette.map((color) => (
                                        <span key={color} className="font-mono text-xs text-muted-foreground">{color.toUpperCase()}</span>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                        </Card>
                    ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-sm mt-4">No saved palettes yet.</p>
                )}
            </div>
        </aside>
      </div>
    </main>
  );
}
