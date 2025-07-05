
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, Download, Library as LibraryIcon, Pencil } from 'lucide-react';
import { colord } from 'colord';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  const createSvgContent = (palette: { name: string; colors: string[] }) => {
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
    return { svgContent, svgWidth, svgHeight };
  }

  const exportPaletteAsSvg = useCallback((palette: {name: string, colors: string[]}) => {
    if (!palette || !palette.colors) return;
    
    const { svgContent } = createSvgContent(palette);
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

  const exportPaletteAsPng = useCallback((palette: { name: string, colors: string[] }) => {
    if (!palette || !palette.colors) return;
    
    const { svgContent, svgWidth, svgHeight } = createSvgContent(palette);
    const svgBlob = new Blob([svgContent], {type: 'image/svg+xml;charset=utf-8'});
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svgWidth;
      canvas.height = svgHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `${palette.name.replace(/ /g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(svgUrl);
        toast({ title: "Palette Exported as PNG!" });
      }
    };
    img.onerror = (err) => {
        console.error("Failed to load SVG for PNG conversion", err);
        toast({ title: "Failed to export as PNG", variant: 'destructive' });
        URL.revokeObjectURL(svgUrl);
    }
    img.src = svgUrl;
  }, [toast]);

  const exportPaletteAsJson = useCallback((palette: { name: string, colors: string[] }) => {
    if (!palette || !palette.colors) return;

    const tokens = {
      [palette.name.toLowerCase().replace(/ /g, '-')]: {
        colors: palette.colors.reduce((acc, color, index) => {
          acc[`color-${index + 1}`] = { value: color.toUpperCase() };
          return acc;
        }, {} as Record<string, { value: string }>)
      }
    };

    const jsonString = JSON.stringify(tokens, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${palette.name.replace(/ /g, '_')}_tokens.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: "Palette Exported as JSON Tokens!" });
  }, [toast]);


  const NoPalettesState = () => (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
      <LibraryIcon className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-medium">
        Library is empty
      </h3>
      <p className="mb-4 mt-2 text-sm text-muted-foreground">
        Go to the Palette Builder to create and save your first one, or add one from the Inspiration page.
      </p>
    </div>
  );

  return (
    <main className="flex-1 w-full p-4 md:p-8">
       <CardHeader className="p-0 mb-8">
        <CardTitle className="text-3xl">My Library</CardTitle>
        <CardDescription>Browse and manage your saved palettes. Find pre-built collections on the Inspiration page.</CardDescription>
      </CardHeader>
      
      {savedPalettes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {savedPalettes.map((palette) => (
            <Card key={palette.id} className="overflow-hidden bg-card flex flex-col">
              <CardContent className="p-0 flex-grow">
                <div className="flex flex-wrap h-24">
                  {palette.colors.map((color, index) => (
                    <div
                      key={`${color}-${index}`}
                      style={{
                        backgroundColor: color,
                        flexGrow: 1,
                        minWidth: '10px'
                      }}
                    />
                  ))}
                </div>
                <div className="p-4">
                  <p className="text-md font-semibold truncate" title={palette.name}>{palette.name}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    {palette.colors.map((color, index) => (
                      <span key={`${color}-${index}`} className="font-mono text-xs text-muted-foreground">{color.toUpperCase()}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end gap-1 p-4 pt-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/?edit=${palette.id}`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit Palette</span>
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit Palette</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePalette(palette.id)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete Palette</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Palette</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => exportPaletteAsSvg(palette)}>SVG</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportPaletteAsPng(palette)}>PNG</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportPaletteAsJson(palette)}>Tokens (JSON)</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <NoPalettesState />
      )}
    </main>
  );
}
