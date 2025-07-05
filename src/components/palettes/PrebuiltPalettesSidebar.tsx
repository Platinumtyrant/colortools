
"use client";
import React from 'react';
import { prebuiltPalettes, type PrebuiltPalette } from '@/lib/prebuilt-palettes';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface PrebuiltPalettesSidebarProps {
  onAddPalette: (palette: PrebuiltPalette) => void;
}

export function PrebuiltPalettesSidebar({ onAddPalette }: PrebuiltPalettesSidebarProps) {
  return (
    <Card className="border-0 shadow-none bg-transparent">
        <CardHeader>
            <CardTitle>Pre-built Palettes</CardTitle>
            <CardDescription>Click to add a palette to your library.</CardDescription>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-4 pr-4">
                {prebuiltPalettes.map((palette, index) => (
                  <div key={index} className="group relative">
                    <p className="text-sm font-medium mb-1 truncate" title={palette.name}>{palette.name}</p>
                    <div
                      className="flex h-12 w-full cursor-pointer overflow-hidden rounded-md border transition-all hover:border-primary/80"
                      onClick={() => onAddPalette(palette)}
                    >
                      {palette.colors.map((color) => (
                        <div
                          key={color}
                          className="flex-1"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-white bg-black/30 hover:bg-black/50"
                      onClick={() => onAddPalette(palette)}
                      title="Add to Library"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
        </CardContent>
    </Card>
  );
}
