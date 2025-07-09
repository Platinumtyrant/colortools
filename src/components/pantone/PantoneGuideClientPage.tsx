
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PantoneColor } from '@/lib/pantone-colors';
import { sortPantoneNumerically } from '@/lib/pantone-colors';
import { ColorBox } from '@/components/colors/ColorBox';
import { useToast } from '@/hooks/use-toast';
import { usePaletteBuilder } from '@/contexts/PaletteBuilderContext';
import { colord } from 'colord';
import { saveColorToLibrary, removeColorFromLibrary } from '@/lib/colors';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

interface PantoneGuideClientPageProps {
  pmsColors: PantoneColor[];
  fhiColors: PantoneColor[];
}

const COLORS_PER_PAGE = 63; // 7 rows of 9 colors

export function PantoneGuideClientPage({ pmsColors, fhiColors }: PantoneGuideClientPageProps) {
  const { toast } = useToast();
  const { palette, setPalette } = usePaletteBuilder();
  const [libraryColors, setLibraryColors] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [pmsCurrentPage, setPmsCurrentPage] = useState(1);
  const [fhiCurrentPage, setFhiCurrentPage] = useState(1);

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

  const validPmsColors = useMemo(() => pmsColors.filter(c => c && c.hex && colord(c.hex).isValid()).sort(sortPantoneNumerically), [pmsColors]);
  const validFhiColors = useMemo(() => fhiColors.filter(c => c && c.hex && colord(c.hex).isValid()).sort(sortPantoneNumerically), [fhiColors]);
  
  // PMS Pagination
  const pmsTotalPages = Math.ceil(validPmsColors.length / COLORS_PER_PAGE);
  const pmsPaginatedColors = useMemo(() => {
      const startIndex = (pmsCurrentPage - 1) * COLORS_PER_PAGE;
      const endIndex = startIndex + COLORS_PER_PAGE;
      return validPmsColors.slice(startIndex, endIndex);
  }, [validPmsColors, pmsCurrentPage]);

  // FHI Pagination
  const fhiTotalPages = Math.ceil(validFhiColors.length / COLORS_PER_PAGE);
  const fhiPaginatedColors = useMemo(() => {
      const startIndex = (fhiCurrentPage - 1) * COLORS_PER_PAGE;
      const endIndex = startIndex + COLORS_PER_PAGE;
      return validFhiColors.slice(startIndex, endIndex);
  }, [validFhiColors, fhiCurrentPage]);

  
  const renderColorGrid = (colors: PantoneColor[]) => {
    const gridClasses = "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-9 gap-4";
    if (!isClient) {
        return (
            <div className={gridClasses}>
                {[...Array(COLORS_PER_PAGE)].map((_, i) => (
                    <Skeleton key={i} className="h-[72px] w-full rounded-md" />
                ))}
            </div>
        );
    }
    
    return (
        <div className={gridClasses}>
            {colors.map((color) => {
                const normalizedColor = colord(color.hex).toHex();
                const isInLibrary = libraryHexes.has(normalizedColor);
                const isInPalette = paletteHexes.has(normalizedColor);

                return (
                    <div key={color.name}>
                        <ColorBox
                            color={color.hex}
                            variant="compact"
                            onAddToLibrary={!isInLibrary ? () => handleToggleLibrary(color.hex) : undefined}
                            onRemoveFromLibrary={isInLibrary ? () => handleToggleLibrary(color.hex) : undefined}
                            onAddToPalette={!isInPalette ? () => handleAddToPalette(color.hex) : undefined}
                            onRemoveFromPalette={isInPalette ? () => handleRemoveFromPalette(color.hex) : undefined}
                        />
                    </div>
                );
            })}
        </div>
    );
  }
  
  const PaginationControls = ({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-center space-x-2 mt-8">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
                <ChevronsLeft className="h-4 w-4" />
                <span className="sr-only">First page</span>
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous page</span>
            </Button>
            <span className="text-sm font-medium px-2">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next page</span>
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>
                <ChevronsRight className="h-4 w-4" />
                <span className="sr-only">Last page</span>
            </Button>
        </div>
    )
  }

  return (
    <div className="flex-1 w-full p-4 md:p-8 flex flex-col">
        <div className="flex-grow flex flex-col min-h-0">
            <CardHeader className="p-0 mb-8 space-y-2">
                <CardTitle className="text-3xl">Pantone Color Guides</CardTitle>
                <CardDescription>Browse official Pantone color systems. PMS is for print, while FHI is for fashion, home, and interiors.</CardDescription>
            </CardHeader>

            <Tabs defaultValue="pms" className="w-full flex flex-col flex-grow">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pms">PMS (Print)</TabsTrigger>
                    <TabsTrigger value="fhi">FHI (Fashion, Home + Interiors)</TabsTrigger>
                </TabsList>

                <div className="flex-grow mt-6 min-h-0">
                  <TabsContent value="pms" className="h-full w-full">
                      <ScrollArea className="h-full">
                        <div className="pr-4">
                            {validPmsColors.length > 0 ? renderColorGrid(pmsPaginatedColors) : <p>No PMS color data available.</p>}
                            {isClient && <PaginationControls currentPage={pmsCurrentPage} totalPages={pmsTotalPages} onPageChange={setPmsCurrentPage} />}
                        </div>
                      </ScrollArea>
                  </TabsContent>
                  <TabsContent value="fhi" className="h-full w-full">
                      <ScrollArea className="h-full">
                         <div className="pr-4">
                            {validFhiColors.length > 0 ? renderColorGrid(fhiPaginatedColors) : <p>No FHI color data available.</p>}
                            {isClient && <PaginationControls currentPage={fhiCurrentPage} totalPages={fhiTotalPages} onPageChange={setFhiCurrentPage} />}
                         </div>
                      </ScrollArea>
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
