"use client";

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import cmykPlugin from 'colord/plugins/cmyk';
import lchPlugin from 'colord/plugins/lch';
import labPlugin from 'colord/plugins/lab';

extend([namesPlugin, cmykPlugin, lchPlugin, labPlugin]);

const ColorPickerClient = dynamic(() => import('@/components/colors/ColorPickerClient'), {
  ssr: false,
  loading: () => (
    <Skeleton className="w-full max-w-[256px] h-[325px]" />
  )
});

export default function ColorPaletteBuilderPage() {
  const [mainColor, setMainColor] = useState('#FF9800');
  const [paletteColors, setPaletteColors] = useState<string[]>([]);
  
  const { toast } = useToast();

  const handleColorChange = useCallback((newColor: any) => {
    setMainColor(newColor.hex);
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
  
  const colorName = colord(mainColor).toName({ closest: true });
  const colorCmyk = colord(mainColor).toCmyk();
  const colorLch = colord(mainColor).toLch();
  const colorLab = colord(mainColor).toLab();

  return (
    <main className="flex-1 w-full p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start justify-items-center gap-8 max-w-7xl mx-auto">
      <div className="w-full max-w-[256px]">
        <ColorPickerClient 
          color={mainColor} 
          onChange={handleColorChange}
        />
      </div>

      <Card className="w-full max-w-sm">
          <CardHeader>
              <CardTitle>Active Color</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <div 
                className="w-full h-24 rounded-md border"
                style={{ backgroundColor: mainColor }}
              />
              <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-mono font-semibold capitalize">{colorName}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">HEX</span>
                      <span className="font-mono font-semibold">{mainColor.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">RGB</span>
                      <span className="font-mono font-semibold">{colord(mainColor).toRgbString()}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">HSL</span>
                      <span className="font-mono font-semibold">{colord(mainColor).toHslString()}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">CMYK</span>
                      <span className="font-mono font-semibold">{`cmyk(${colorCmyk.c}, ${colorCmyk.m}, ${colorCmyk.y}, ${colorCmyk.k})`}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">LCH</span>
                      <span className="font-mono font-semibold">{`lch(${colorLch.l}, ${colorLch.c}, ${colorLch.h})`}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">CIELAB</span>
                      <span className="font-mono font-semibold">{`lab(${colorLab.l}, ${colorLab.a}, ${colorLab.b})`}</span>
                  </div>
              </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddCurrentColorToPalette} className="w-full">
                Add to Current Palette
            </Button>
          </CardFooter>
      </Card>

      <Card className="w-full max-w-sm md:col-span-2 lg:col-span-1">
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
