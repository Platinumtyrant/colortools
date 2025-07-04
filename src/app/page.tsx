"use client";

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { colord, type HsvColor } from 'colord';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';

const ColorPickerClient = dynamic(() => import('@/components/colors/ColorPickerClient'), {
  ssr: false,
  loading: () => (
      <div className="w-full max-w-3xl p-4">
          <Skeleton className="w-full h-[360px]" />
      </div>
  )
});

export default function ColorPaletteBuilderPage() {
  const [mainColor, setMainColor] = useState('#BED3F3');
  const [previousColor, setPreviousColor] = useState('#204E4A');
  const [hsv, setHsv] = useState<HsvColor>(colord(mainColor).toHsv());
  const [paletteColors, setPaletteColors] = useState<string[]>([]);
  
  const { toast } = useToast();

  const updateColor = useCallback((newColor: string | HsvColor) => {
    const newHex = colord(newColor).toHex();
    // Check if color is actually different to avoid flicker
    if (newHex !== mainColor) {
      setPreviousColor(mainColor);
      setMainColor(newHex);
      setHsv(colord(newHex).toHsv());
    } else if (typeof newColor !== 'string') {
      // Allow HSV to update even if hex is the same (e.g., for black/white/grays)
      setHsv(colord(newColor).toHsv());
    }
  }, [mainColor]);

  const rgb = colord(mainColor).toRgb();
  const hex = colord(mainColor).toHex();
  const hsl = colord(mainColor).toHsl();
  
  const handleValueChange = (
    model: 'rgb' | 'hsl',
    key: 'r' | 'g' | 'b' | 'h' | 's' | 'l',
    value: string
  ) => {
    const val = parseInt(value, 10);
    if (!isNaN(val)) {
      if (model === 'rgb') {
        updateColor({ ...rgb, [key]: val });
      } else if (model === 'hsl') {
        updateColor({ ...hsl, [key]: val });
      }
    }
  };

  const handleHexChange = (value: string) => {
    const newHex = `#${value.replace(/[^0-9a-fA-F]/g, '')}`;
    if (colord(newHex).isValid()) {
      updateColor(newHex);
    }
  };

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

  return (
    <main className="flex-1 w-full p-4 md:p-8 flex items-start justify-center bg-gray-100">
      <ColorPickerClient
        mainColor={mainColor}
        previousColor={previousColor}
        hsv={hsv}
        paletteColors={paletteColors}
        rgb={rgb}
        hsl={hsl}
        hex={hex}
        updateColor={updateColor}
        handleAddCurrentColorToPalette={handleAddCurrentColorToPalette}
        handleSaveToLibrary={handleSaveToLibrary}
        handleHexChange={handleHexChange}
        handleValueChange={handleValueChange}
      />
    </main>
  );
}
