
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, Download, Library as LibraryIcon, Pencil, Palette } from 'lucide-react';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import cmykPlugin from 'colord/plugins/cmyk';
import lchPlugin from 'colord/plugins/lch';
import labPlugin from 'colord/plugins/lab';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from '@/components/ui/input';
import { ColorBox } from '@/components/colors/ColorBox';
import { usePaletteBuilder } from '@/contexts/PaletteBuilderContext';
import { removeColorFromLibrary } from '@/lib/colors';
import { Skeleton } from '@/components/ui/skeleton';
import { usePantone } from '@/contexts/SidebarExtensionContext';
import type { ColorLookupEntry } from '@/lib/pantone-colors';
import namer from 'color-namer';


extend([namesPlugin, cmykPlugin, lchPlugin, labPlugin]);

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

const capitalize = (str: string) => {
    if (!str) return '';
    return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

const getAllColorNames = (hexColor: string, lookup: Map<string, ColorLookupEntry> | null): { source: string; name: string }[] => {
    const allNames: { source: string; name: string }[] = [];

    if (!colord(hexColor).isValid()) {
        return [{ name: "Invalid Color", source: 'HEX' }];
    }

    const lowerHex = colord(hexColor).toHex().toLowerCase();

    // 1. Pantone & USAF Lookup
    if (lookup && lookup.has(lowerHex)) {
        const entry = lookup.get(lowerHex)!;
        allNames.push({ source: entry.source, name: entry.name });
    }

    // 2. Namer (NTC & Basic)
    try {
        const names = namer(lowerHex);
        const ntcName = names.ntc[0]?.name;
        if (ntcName) {
            allNames.push({ source: 'NTC', name: capitalize(ntcName) });
        }
        const basicName = names.basic[0]?.name;
        if (basicName) {
            allNames.push({ source: 'Basic', name: capitalize(basicName) });
        }
    } catch (e) {
        console.error("Error getting color name from color-namer:", e);
    }

    // 3. Colord
    const colordName = colord(lowerHex).toName({ closest: true });
    if (colordName) {
        allNames.push({ source: 'Colord', name: capitalize(colordName) });
    }
    
    // Deduplicate names, giving priority to earlier sources
    const uniqueNames = allNames.reduce((acc, current) => {
        if (!acc.find(item => item.name.toLowerCase() === current.name.toLowerCase())) {
            acc.push(current);
        }
        return acc;
    }, [] as { source: string; name: string }[]);


    if (uniqueNames.length > 0) {
        return uniqueNames;
    }

    return [{ name: lowerHex.toUpperCase(), source: 'HEX' }];
};


const createSvgContent = (palette: { name: string; colors: string[] }, lookup: Map<string, ColorLookupEntry> | null) => {
    if (!lookup) {
        return { svgContent: '<svg width="100" height="50" xmlns="http://www.w3.org/2000/svg"><text x="10" y="30" fill="red">Error: Data not loaded.</text></svg>', svgWidth: 100, svgHeight: 50 };
    }

    const swatchSize = 220;
    const padding = 20;
    const spacing = 20;
    const cornerRadius = 16;
    
    const numColors = palette.colors.length;
    const numCols = Math.ceil(Math.sqrt(numColors));
    const numRows = Math.ceil(numColors / numCols);

    const svgWidth = padding * 2 + numCols * swatchSize + (numCols > 1 ? (numCols - 1) * spacing : 0);
    const svgHeight = padding * 2 + numRows * swatchSize + (numRows > 1 ? (numRows - 1) * spacing : 0);
    
    const escapeXml = (unsafe: string) => {
        return unsafe.replace(/[<>&'"]/g, function (c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    };

    let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="background-color: #1E1E1E;">`;

    palette.colors.forEach((color, index) => {
        const col = index % numCols;
        const row = Math.floor(index / numCols);
        const xPos = padding + col * (swatchSize + spacing);
        const yPos = padding + row * (swatchSize + spacing);
        
        const colorInstance = colord(color);
        const textColor = colorInstance.isLight() ? '#000000' : '#FFFFFF';
        
        const rgb = colorInstance.toRgb();
        const hsl = colorInstance.toHsl();
        const cmykObj = colorInstance.toCmyk();
        const cmyk = `cmyk(${cmykObj.c}, ${cmykObj.m}, ${cmykObj.y}, ${cmykObj.k})`;
        const lchObj = colorInstance.toLch();
        const lch = `lch(${lchObj.l.toFixed(0)}, ${lchObj.c.toFixed(0)}, ${lchObj.h.toFixed(0)})`;
        const allNames = getAllColorNames(color, lookup);
        
        svgContent += `<rect x="${xPos}" y="${yPos}" width="${swatchSize}" height="${swatchSize}" fill="${color}" rx="${cornerRadius}" />`;
        
        const textXStart = xPos + 16;
        let textY = yPos + 30; // Start from top

        const renderLine = (text: string, options: { fontSize?: number, fontWeight?: string, yOffset?: number, family?: string } = {}) => {
             const { fontSize = 12, fontWeight = 'normal', yOffset = 18, family = 'sans-serif' } = options;
             const content = `<text x="${textXStart}" y="${textY}" fill="${textColor}" font-size="${fontSize}" font-weight="${fontWeight}" style="font-family: ${family};">${escapeXml(text)}</text>`;
             textY += yOffset;
             return content;
        }

        const renderValue = (label: string, value: string) => {
            const content = `<text x="${textXStart}" y="${textY}" fill="${textColor}" font-size="12" style="font-family: monospace;">
                <tspan font-weight="bold">${label}:</tspan> ${escapeXml(value)}
            </text>`;
            textY += 18;
            return content;
        }

        // Primary Name
        if(allNames.length > 0) {
            svgContent += renderLine(allNames[0].name, { fontSize: 16, fontWeight: 'bold', yOffset: 24 });
        }

        // Color Values
        textY += 5;
        svgContent += renderValue('HEX', color.toUpperCase());
        svgContent += renderValue('RGB', `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
        svgContent += renderValue('HSL', `hsl(${hsl.h.toFixed(0)}, ${hsl.s.toFixed(0)}%, ${hsl.l.toFixed(0)}%)`);
        svgContent += renderValue('CMYK', cmyk);
        svgContent += renderValue('LCH', lch);
        
        // Other Names
        if (allNames.length > 1) {
            textY += 10;
            svgContent += renderLine("Other Names", { fontSize: 10, fontWeight: 'bold', yOffset: 16 });
            allNames.slice(1).forEach(nameObj => {
                 svgContent += renderLine(`${nameObj.name} (${nameObj.source})`, { fontSize: 12, yOffset: 16 });
            });
        }
    });

    svgContent += `</svg>`;
    return { svgContent, svgWidth, svgHeight };
}

export default function LibraryPage() {
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);
  const [savedIndividualColors, setSavedIndividualColors] = useState<string[]>([]);
  const [editingPaletteId, setEditingPaletteId] = useState<number | null>(null);
  const [newPaletteName, setNewPaletteName] = useState('');
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const { palette, setPalette, loadPalette } = usePaletteBuilder();
  const router = useRouter();

  const pantoneLookup = usePantone();

  const paletteHexes = React.useMemo(() => new Set(palette.map(p => colord(p.hex).toHex())), [palette]);

  useEffect(() => {
    setIsClient(true);
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
      
      const savedColorsJSON = localStorage.getItem('saved_individual_colors');
      if (savedColorsJSON) {
          setSavedIndividualColors(JSON.parse(savedColorsJSON));
      }

    } catch (error) {
      console.error("Failed to parse saved items from localStorage", error);
      toast({
        title: "Error loading items",
        description: "Could not load your saved palettes or colors.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleLoadForEditing = useCallback((palette: SavedPalette) => {
    loadPalette({ colors: palette.colors, name: palette.name, id: palette.id });
    router.push('/');
  }, [loadPalette, router]);

  const handleDeleteIndividualColor = useCallback((colorToDelete: string) => {
    const result = removeColorFromLibrary(colorToDelete);
    if(result.success) {
      setSavedIndividualColors(current => current.filter(c => colord(c).toHex() !== colord(colorToDelete).toHex()));
    }
    toast({ title: result.message, variant: result.success ? 'default' : 'destructive' });
  }, [toast]);

  const handleAddToPalette = useCallback((color: string) => {
    if (palette.length >= 20) {
        toast({ title: "Palette is full (20 colors max).", variant: "destructive" });
        return;
    }
    const newPaletteColor = { id: Date.now(), hex: color, locked: false };
    setPalette(p => [...p, newPaletteColor]);
    toast({ title: "Color added to palette!" });
  }, [palette.length, setPalette, toast]);

  const handleRemoveFromPalette = useCallback((color: string) => {
    const normalizedColor = colord(color).toHex();
    setPalette(currentPalette => currentPalette.filter(p => colord(p.hex).toHex() !== normalizedColor));
    toast({ title: 'Color removed from palette.' });
  }, [setPalette, toast]);

  const handleUpdateName = useCallback((idToUpdate: number) => {
    if (!newPaletteName.trim()) {
      toast({
        title: "Name cannot be empty",
        variant: "destructive",
      });
      setEditingPaletteId(null);
      return;
    }

    const newPalettes = savedPalettes.map((p) =>
      p.id === idToUpdate ? { ...p, name: newPaletteName.trim() } : p
    );
    setSavedPalettes(newPalettes);
    localStorage.setItem('saved_palettes', JSON.stringify(newPalettes));
    toast({ title: "Palette Renamed" });
    setEditingPaletteId(null);
    setNewPaletteName('');
  }, [newPaletteName, savedPalettes, toast]);

  const handleDeletePalette = useCallback((idToDelete: number) => {
    if (editingPaletteId === idToDelete) {
        setEditingPaletteId(null);
    }
    const newPalettes = savedPalettes.filter(({ id }) => id !== idToDelete);
    setSavedPalettes(newPalettes);
    localStorage.setItem('saved_palettes', JSON.stringify(newPalettes));
    toast({ title: "Palette Deleted" });
  }, [savedPalettes, toast, editingPaletteId]);


  const exportPaletteAsSvg = useCallback((palette: {name: string, colors: string[]}) => {
    if (!palette || !palette.colors) return;
    
    const { svgContent } = createSvgContent(palette, pantoneLookup);
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
  }, [toast, pantoneLookup]);

  const exportPaletteAsPng = useCallback((palette: { name: string, colors: string[] }) => {
    if (!palette || !palette.colors) return;
    
    const { svgContent, svgWidth, svgHeight } = createSvgContent(palette, pantoneLookup);
    if (!svgContent) return;

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
  }, [toast, pantoneLookup]);

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


  const NoItemsState = () => (
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
  
  const hasItems = isClient && (savedPalettes.length > 0 || savedIndividualColors.length > 0);

  if (!isClient) {
    return (
      <main className="flex-1 w-full p-4 md:p-8 space-y-8">
        <CardHeader className="p-0">
          <CardTitle className="text-3xl">My Library</CardTitle>
          <CardDescription>Browse and manage your saved palettes and colors. Find pre-built collections on the Inspiration page.</CardDescription>
        </CardHeader>
        <div className="space-y-10">
          <div>
            <Skeleton className="h-8 w-64 mb-4" />
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-[72px] w-40" />
              <Skeleton className="h-[72px] w-40" />
              <Skeleton className="h-[72px] w-40" />
            </div>
          </div>
          <div>
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-60 w-full" />
              <Skeleton className="h-60 w-full" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full p-4 md:p-8 space-y-8">
       <CardHeader className="p-0">
        <CardTitle className="text-3xl">My Library</CardTitle>
        <CardDescription>Browse and manage your saved palettes and colors. Find pre-built collections on the Inspiration page.</CardDescription>
      </CardHeader>
      
      {!hasItems ? (
        <NoItemsState />
      ) : (
        <>
            {savedIndividualColors.length > 0 && (
                 <section>
                    <h2 className="text-2xl font-semibold mb-4">My Individual Colors</h2>
                    <div className="flex flex-wrap gap-4">
                        {savedIndividualColors.map(color => {
                            const normalizedColor = colord(color).toHex();
                            const isInPalette = paletteHexes.has(normalizedColor);
                            return (
                                <div key={color} className="w-40">
                                    <ColorBox 
                                        color={color}
                                        variant="compact"
                                        onRemoveFromLibrary={() => handleDeleteIndividualColor(color)}
                                        onAddToPalette={!isInPalette ? () => handleAddToPalette(color) : undefined}
                                        onRemoveFromPalette={isInPalette ? () => handleRemoveFromPalette(color) : undefined}
                                    />
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}

            {savedPalettes.length > 0 && (
                <section>
                    <h2 className="text-2xl font-semibold mb-4">My Palettes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {savedPalettes.map((palette) => (
                          <Card key={palette.id} className="bg-card flex flex-col justify-between">
                            <div>
                                <CardHeader className="flex flex-row items-center justify-between p-4">
                                  <div className="flex-1 min-w-0">
                                    {editingPaletteId === palette.id ? (
                                        <Input
                                            value={newPaletteName}
                                            onChange={(e) => setNewPaletteName(e.target.value)}
                                            onBlur={() => handleUpdateName(palette.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleUpdateName(palette.id);
                                                else if (e.key === 'Escape') setEditingPaletteId(null);
                                            }}
                                            autoFocus
                                            className="h-8 w-full"
                                        />
                                    ) : (
                                        <CardTitle className="text-lg truncate" title={palette.name}>{palette.name}</CardTitle>
                                    )}
                                  </div>
                                    
                                    <div className="flex items-center shrink-0">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => {
                                                            if (editingPaletteId === palette.id) handleUpdateName(palette.id);
                                                            else {
                                                                setEditingPaletteId(palette.id);
                                                                setNewPaletteName(palette.name);
                                                            }
                                                        }}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Edit Name</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => exportPaletteAsSvg(palette)}>SVG</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => exportPaletteAsPng(palette)}>PNG</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => exportPaletteAsJson(palette)}>Tokens (JSON)</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeletePalette(palette.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Delete Palette</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-4 pt-0">
                                    <div className="flex flex-wrap gap-2">
                                        {palette.colors.map((color, index) => {
                                            const normalizedColor = colord(color).toHex();
                                            const isInPalette = paletteHexes.has(normalizedColor);
                                            return (
                                                <div key={`${color}-${index}`} className="w-40">
                                                    <ColorBox
                                                        color={color}
                                                        variant="compact"
                                                        onAddToPalette={!isInPalette ? () => handleAddToPalette(color) : undefined}
                                                        onRemoveFromPalette={isInPalette ? () => handleRemoveFromPalette(color) : undefined}
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </div>
                            <CardFooter className="p-4">
                                <Button className="w-full" onClick={() => handleLoadForEditing(palette)}>
                                    <Palette className="mr-2 h-4 w-4" />
                                    Load in Builder
                                </Button>
                            </CardFooter>
                          </Card>
                        ))}
                    </div>
                </section>
            )}
        </>
      )}
    </main>
  );
}
