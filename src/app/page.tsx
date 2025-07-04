"use client";

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const ColorPickerClient = dynamic(() => import('@/components/colors/ColorPickerClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-[220px]">
        <Skeleton className="w-[220px] h-[320px]" />
    </div>
  )
});

export default function ColorPaletteBuilderPage() {
  const [mainColor, setMainColor] = useState('#BED3F3');
  const [paletteColors, setPaletteColors] = useState<string[]>([]);
  
  const { toast } = useToast();

  const handleColorChange = useCallback((newColor: string) => {
    setMainColor(newColor);
  }, []);

  const handleAddCurrentColorToPalette = useCallback(() => {
    setPaletteColors(prevColors => {
      if (prevColors.includes(mainColor)) {
        toast({ title: 'Color already in palette.' });
        return prevColors;
      }
      if (prevColors.length >= 20) {
        toast({ title: "Palette full", variant: "destructive" });
        return prevColors;
      }
      return [...prevColors, mainColor];
    });
    toast({ title: 'Color added to palette!' });
  }, [mainColor, toast]);
  
  const handleSaveToLibrary = useCallback(() => {
    if (paletteColors.length === 0) {
      toast({ title: "Cannot save empty palette", variant: "destructive" });
      return;
    }
    const savedPalettesJSON = localStorage.getItem('saved_palettes');
    const savedPalettes = savedPalettesJSON ? JSON.parse(savedPalettesJSON) : [];
    savedPalettes.push(paletteColors);
    localStorage.setItem('saved_palettes', JSON.stringify(savedPalettes));
    toast({ title: "Palette Saved!", description: "View it in your library." });
    setPaletteColors([]);
  }, [paletteColors, toast]);

  const handleRemoveColorFromPalette = (colorToRemove: string) => {
    setPaletteColors(prev => prev.filter(c => c !== colorToRemove));
  };

  return (
    <main className="flex-1 w-full p-4 md:p-8 flex flex-col md:flex-row items-start justify-center gap-8">
      <div className="flex flex-col gap-4 items-center">
        <ColorPickerClient color={mainColor} onChange={handleColorChange} />
        <div 
          className="w-full h-16 rounded-md border"
          style={{ backgroundColor: mainColor }}
        />
        <Button onClick={handleAddCurrentColorToPalette} className="w-full">
            Add to Current Palette
        </Button>
      </div>

      <Card className="flex-1 w-full max-w-2xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Current Palette ({paletteColors.length} / 20)</CardTitle>
            {paletteColors.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setPaletteColors([])}>Clear</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {paletteColors.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {paletteColors.map((color) => (
                <div 
                  key={color}
                  className="relative group w-20 h-20 rounded-md border cursor-pointer"
                  style={{ backgroundColor: color }}
                  title={color}
                  onClick={() => setMainColor(color)}
                >
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveColorFromPalette(color);
                    }}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove color"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
                <p>Your palette is empty.</p>
                <p className="text-sm">Use the color picker to add colors.</p>
            </div>
          )}
        </CardContent>
        {paletteColors.length > 0 && (
          <CardFooter>
            <Button onClick={handleSaveToLibrary} className="w-full">
                Save Palette to Library
            </Button>
          </CardFooter>
        )}
      </Card>
    </main>
  );
}
