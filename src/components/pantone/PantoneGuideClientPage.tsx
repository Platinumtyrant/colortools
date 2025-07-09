
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PantoneColor } from '@/lib/pantone-colors';
import { sortPantoneNumerically } from '@/lib/pantone-colors';
import { ColorBox } from '@/components/colors/ColorBox';
import { useToast } from '@/hooks/use-toast';
import { usePaletteBuilder } from '@/contexts/PaletteBuilderContext';
import { colord } from 'colord';
import { saveColorToLibrary, removeColorFromLibrary } from '@/lib/colors';
import { Skeleton } from '@/components/ui/skeleton';
import { FixedSizeGrid as Grid } from 'react-window';

interface PantoneGuideClientPageProps {
  pmsColors: PantoneColor[];
  fhiColors: PantoneColor[];
}

const useContainerSize = (ref: React.RefObject<HTMLElement>) => {
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateSize = () => {
            if (ref.current) {
                setSize({
                    width: ref.current.offsetWidth,
                    height: ref.current.offsetHeight,
                });
            }
        };

        const resizeObserver = new ResizeObserver(updateSize);
        if (ref.current) {
            resizeObserver.observe(ref.current);
            updateSize(); // Initial size
        }
        
        return () => resizeObserver.disconnect();
    }, [ref]);

    return size;
};


const ColorCell = ({ columnIndex, rowIndex, style, data }: { columnIndex: number, rowIndex: number, style: React.CSSProperties, data: any }) => {
    const { colors, columnCount, handleToggleLibrary, handleAddToPalette, handleRemoveFromPalette, libraryHexes, paletteHexes } = data;
    const index = rowIndex * columnCount + columnIndex;
    if (index >= colors.length) return null;

    const color = colors[index];
    const normalizedColor = colord(color.hex).toHex();
    const isInLibrary = libraryHexes.has(normalizedColor);
    const isInPalette = paletteHexes.has(normalizedColor);

    return (
        <div style={style} className="flex items-center justify-center">
             <div className="w-40">
                <ColorBox
                    color={color.hex}
                    name={color.name}
                    variant="compact"
                    onAddToLibrary={!isInLibrary ? () => handleToggleLibrary(color.hex) : undefined}
                    onRemoveFromLibrary={isInLibrary ? () => handleToggleLibrary(color.hex) : undefined}
                    onAddToPalette={!isInPalette ? () => handleAddToPalette(color.hex) : undefined}
                    onRemoveFromPalette={isInPalette ? () => handleRemoveFromPalette(color.hex) : undefined}
                />
            </div>
        </div>
    );
};


export function PantoneGuideClientPage({ pmsColors, fhiColors }: PantoneGuideClientPageProps) {
  const { toast } = useToast();
  const { palette, setPalette } = usePaletteBuilder();
  const [libraryColors, setLibraryColors] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const { width } = useContainerSize(gridContainerRef);


  const paletteHexes = React.useMemo(() => new Set(palette.map(p => colord(p.hex).toHex())), [palette]);
  const libraryHexes = React.useMemo(() => new Set(libraryColors.map(c => colord(c).toHex())), [libraryColors]);

  useEffect(() => {
    setIsClient(true);
    try {
      const savedColorsJSON = localStorage.getItem('saved_individual_colors');
      if (savedColorsJSON) {
        setLibraryColors(JSON.parse(savedColorsJSON));
      }
    } catch (e) { console.error(e); }
  }, []);

  const handleToggleLibrary = useCallback((color: string) => {
    const normalizedColor = colord(color).toHex();
    const isInLibrary = libraryHexes.has(normalizedColor);
    
    const result = isInLibrary ? removeColorFromLibrary(color) : saveColorToLibrary(color);
    toast({ title: result.message, variant: result.success ? 'default' : 'destructive' });

    if (result.success) {
        const newLibrary = isInLibrary
            ? libraryColors.filter(c => colord(c).toHex() !== normalizedColor)
            : [...libraryColors, normalizedColor];
        setLibraryColors(newLibrary);
    }
  }, [libraryColors, libraryHexes, toast]);

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

  const sortedPmsColors = useMemo(() => pmsColors.sort(sortPantoneNumerically), [pmsColors]);
  const sortedFhiColors = useMemo(() => fhiColors.sort(sortPantoneNumerically), [fhiColors]);
  
  const renderColorGrid = (colors: PantoneColor[]) => {
    const columnWidth = 176; // w-40 (160px) + gap-4 (16px)
    const rowHeight = 88; // h-9 (36px) + p-2 (8*2=16px) + text + gap-4 = ~88px
    
    const columnCount = Math.max(1, Math.floor(width / columnWidth));
    const rowCount = Math.ceil(colors.length / columnCount);

    if (!isClient || width === 0) {
        return (
            <div className="flex flex-wrap gap-4">
                {[...Array(50)].map((_, i) => (
                    <Skeleton key={i} className="w-40 h-[72px] rounded-md" />
                ))}
            </div>
        );
    }
    
    return (
        <Grid
            className="virtual-grid"
            height={600} // A reasonable default height
            width={width}
            columnCount={columnCount}
            columnWidth={columnWidth}
            rowCount={rowCount}
            rowHeight={rowHeight}
            itemData={{
                colors,
                columnCount,
                handleToggleLibrary,
                handleAddToPalette,
                handleRemoveFromPalette,
                libraryHexes,
                paletteHexes,
            }}
        >
            {ColorCell}
        </Grid>
    );
  }

  return (
    <div className="flex-1 w-full p-4 md:p-8 flex flex-col">
        <div className="flex-grow flex flex-col">
            <CardHeader className="p-0 mb-8 space-y-2">
                <CardTitle className="text-3xl">Pantone Color Guides</CardTitle>
                <CardDescription>Browse official Pantone color systems. PMS is for print, while FHI is for fashion, home, and interiors.</CardDescription>
            </CardHeader>

            <Tabs defaultValue="pms" className="w-full flex flex-col flex-grow">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pms">PMS (Print)</TabsTrigger>
                    <TabsTrigger value="fhi">FHI (Fashion, Home + Interiors)</TabsTrigger>
                </TabsList>

                <div ref={gridContainerRef} className="flex-grow mt-6 min-h-[600px]">
                  <TabsContent value="pms" className="h-full">
                      {sortedPmsColors.length > 0 ? renderColorGrid(sortedPmsColors) : <p>No PMS color data available.</p>}
                  </TabsContent>
                  <TabsContent value="fhi" className="h-full">
                      {sortedFhiColors.length > 0 ? renderColorGrid(sortedFhiColors) : <p>No FHI color data available.</p>}
                  </TabsContent>
                </div>
            </Tabs>
        </div>
      <footer className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground space-y-2">
        <p>PANTONE® Colors displayed here may not match PANTONE-identified standards. Consult current PANTONE Color Publications for accurate color.</p>
        <p>PANTONE® and other Pantone, Inc. trademarks are the property of Pantone, Inc. © Pantone, Inc., 2022. All rights reserved.</p>
      </footer>
    </div>
  );
}
