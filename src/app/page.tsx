"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

import { PaletteGenerator } from "@/components/palettes/PaletteGenerator";
import { Palette } from "@/components/palettes/Palette";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Heart, Trash2, Share2, Copy } from "lucide-react";

// Color generation utilities
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return { r: 255 * f(0), g: 255 * f(8), b: 255 * f(4) };
}

function rgbToHex(r: number, g: number, b: number): string {
  return ('#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('')).toUpperCase();
}

function generatePalette(baseColor: string, numColors: number): string[] {
    const rgb = hexToRgb(baseColor);
    if (!rgb) return Array(numColors).fill(baseColor.toUpperCase());

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const palette: string[] = [];
    const hueStep = 360 / numColors;

    for (let i = 0; i < numColors; i++) {
        const newHue = (hsl.h + i * hueStep) % 360;
        const newRgb = hslToRgb(newHue, hsl.s, hsl.l);
        palette.push(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    }
    
    palette[0] = baseColor.toUpperCase();
    
    return palette;
}

export default function Home() {
  const { toast } = useToast();
  const [baseColor, setBaseColor] = useState<string>("#FF9800");
  const [numColors, setNumColors] = useState<number>(5);
  const [generatedPalettes, setGeneratedPalettes] = useState<string[][]>([]);
  const [savedPalettes, setSavedPalettes] = useState<string[][]>([]);

  useEffect(() => {
    try {
      const storedPalettes = localStorage.getItem("savedPalettes");
      if (storedPalettes) {
        setSavedPalettes(JSON.parse(storedPalettes));
      }
    } catch (error) {
      console.error("Failed to parse saved palettes from localStorage", error);
    }
  }, []);

  const handleGenerate = () => {
    const newPalette = generatePalette(baseColor, numColors);
    setGeneratedPalettes(prev => [newPalette, ...prev]);
  };

  const updateLocalStorage = (palettes: string[][]) => {
    try {
      localStorage.setItem("savedPalettes", JSON.stringify(palettes));
    } catch (error) {
      console.error("Failed to save palettes to localStorage", error);
    }
  };

  const handleSavePalette = (palette: string[]) => {
    const newSavedPalettes = [palette, ...savedPalettes];
    setSavedPalettes(newSavedPalettes);
    updateLocalStorage(newSavedPalettes);
    toast({ title: "Palette saved!", description: "Your new palette has been saved." });
  };

  const handleDeletePalette = (index: number) => {
    const newSavedPalettes = savedPalettes.filter((_, i) => i !== index);
    setSavedPalettes(newSavedPalettes);
    updateLocalStorage(newSavedPalettes);
    toast({ title: "Palette deleted.", variant: "destructive" });
  };
  
  const toCss = (palette: string[]) => palette.map((color, index) => `--color-${index + 1}: ${color};`).join('\n');
  const toJson = (palette: string[]) => JSON.stringify(palette, null, 2);

  const handleCopy = (content: string, format: string) => {
    navigator.clipboard.writeText(content).then(() => {
      toast({
        title: `${format} copied!`,
        description: "The palette has been copied to your clipboard.",
      });
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Could not copy palette to clipboard.",
      });
    });
  };

  const isPaletteSaved = (palette: string[]) => {
    return savedPalettes.some(saved => JSON.stringify(saved) === JSON.stringify(palette));
  };

  return (
    <div className="flex min-h-screen w-full font-sans">
      <aside className="w-[320px] border-r border-border p-6 hidden lg:flex flex-col gap-6 fixed h-full">
        <h2 className="text-2xl font-bold text-primary">Saved Palettes</h2>
        <div className="overflow-y-auto flex-1 pr-2 space-y-4">
          {savedPalettes.length > 0 ? (
            savedPalettes.map((p, index) => (
              <Palette
                key={index}
                palette={p}
                actions={
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Copy className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleCopy(toCss(p), 'CSS')}>Copy CSS</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopy(toJson(p), 'JSON')}>Copy JSON</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeletePalette(index)}><Trash2 className="h-4 w-4" /></Button>
                  </>
                }
              />
            ))
          ) : (
            <div className="text-center text-muted-foreground pt-10">You have no saved palettes yet.</div>
          )}
        </div>
      </aside>

      <main className="flex-1 lg:ml-[320px] p-4 sm:p-6 md:p-10">
        <header className="mb-10">
          <h1 className="text-5xl font-bold text-primary font-headline">Palette Prodigy</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Create stunning color palettes with ease.
          </p>
        </header>

        <PaletteGenerator 
          baseColor={baseColor}
          setBaseColor={setBaseColor}
          numColors={numColors}
          setNumColors={setNumColors}
          handleGenerate={handleGenerate}
        />
        
        <div className="mt-12">
          {generatedPalettes.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {generatedPalettes.map((p, index) => (
                 <Palette
                  key={index}
                  palette={p}
                  actions={
                    <>
                      <Button variant="ghost" onClick={() => handleSavePalette(p)} disabled={isPaletteSaved(p)}>
                        <Heart className={`mr-2 h-4 w-4 ${isPaletteSaved(p) ? 'fill-primary text-primary' : ''}`} />
                        {isPaletteSaved(p) ? 'Saved' : 'Save'}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline"><Share2 className="mr-2 h-4 w-4" /> Export</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleCopy(toCss(p), 'CSS')}>Copy CSS</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopy(toJson(p), 'JSON')}>Copy JSON</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
