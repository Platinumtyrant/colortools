
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Library } from 'lucide-react';

type SavedPalette = string[];

interface SavedPalettesProps {
  onLoadPalette: (colors: string[]) => void;
}

export function SavedPalettes({ onLoadPalette }: SavedPalettesProps) {
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedPalettesJSON = localStorage.getItem('saved_palettes');
      if (savedPalettesJSON) {
        setSavedPalettes(JSON.parse(savedPalettesJSON));
      }
    } catch (error) {
      console.error("Failed to load palettes", error);
    }
  }, []);

  const handleDeletePalette = useCallback((e: React.MouseEvent, indexToDelete: number) => {
    e.stopPropagation();
    const newPalettes = savedPalettes.filter((_, index) => index !== indexToDelete);
    setSavedPalettes(newPalettes);
    localStorage.setItem('saved_palettes', JSON.stringify(newPalettes));
    toast({ title: "Palette Deleted" });
  }, [savedPalettes, toast]);
  
  const handleLoadPalette = (palette: SavedPalette) => {
    onLoadPalette(palette);
    toast({ title: "Palette Loaded!" });
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle>My Library</CardTitle>
        <CardDescription>Click a palette to load it.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        {savedPalettes.length > 0 ? (
          <ScrollArea className="h-full max-h-[400px]">
            <div className="space-y-2 pr-4">
              {savedPalettes.map((palette, index) => (
                <div key={index} className="group relative">
                  <div
                    className="flex h-16 w-full cursor-pointer overflow-hidden rounded-md border transition-all hover:border-primary/80"
                    onClick={() => handleLoadPalette(palette)}
                  >
                    {palette.map((color) => (
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
                        className="absolute top-1/2 right-2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-white bg-black/30 hover:bg-black/50"
                        onClick={(e) => handleDeletePalette(e, index)}
                        title="Delete Palette"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 text-center">
            <Library className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Library is empty</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Save a palette using the button below to see it here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
