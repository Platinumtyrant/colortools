"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { PaletteGenerator } from '@/components/palettes/PaletteGenerator';
import { Palette } from '@/components/palettes/Palette';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generatePaletteFromLibrary, type GenerationType } from '@/lib/palette-generator';
import { Save } from 'lucide-react';

export default function PaletteGeneratorPage() {
  const [baseColor, setBaseColor] = useState('#007bff');
  const [numColors, setNumColors] = useState(5);
  const [generationType, setGenerationType] = useState<GenerationType>('analogous');
  const [currentPalette, setCurrentPalette] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setError(null);
    try {
      const result = generatePaletteFromLibrary({ baseColor, numColors, type: generationType });
      setCurrentPalette(result);
    } catch (e: any) {
      setError(e.message);
      toast({
        title: "Error Generating Palette",
        description: e.message,
        variant: "destructive",
      });
    }
  }, [baseColor, numColors, generationType, toast]);

  const handleSavePalette = useCallback(() => {
    if (currentPalette.length === 0) {
      toast({ title: "Cannot save an empty palette", variant: "destructive" });
      return;
    }
    try {
      const savedPalettesJSON = localStorage.getItem('saved_palettes');
      const savedPalettes = savedPalettesJSON ? JSON.parse(savedPalettesJSON) : [];
      savedPalettes.push(currentPalette);
      localStorage.setItem('saved_palettes', JSON.stringify(savedPalettes));
      toast({
        title: "Palette Saved!",
        description: "Your new palette has been saved to the library.",
      });
    } catch (error) {
      console.error("Failed to save palette:", error);
      toast({
        title: "Error Saving Palette",
        variant: "destructive",
      });
    }
  }, [currentPalette, toast]);

  return (
    <main className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8 flex flex-col h-full">
      <PaletteGenerator 
        baseColor={baseColor}
        setBaseColor={setBaseColor}
        numColors={numColors}
        setNumColors={setNumColors}
        generationType={generationType}
        setGenerationType={setGenerationType}
      />
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {currentPalette.length > 0 && (
         <div className="flex-grow min-h-[40vh]">
            <Palette 
                palette={currentPalette}
                actions={
                <Button variant="outline" onClick={handleSavePalette}>
                    <Save className="mr-2 h-4 w-4" />
                    Save to Library
                </Button>
                }
            />
         </div>
      )}
    </main>
  );
}
