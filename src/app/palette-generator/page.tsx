
"use client";

import React, { useState, useCallback } from 'react';
import { PaletteGenerator } from '@/components/palettes/PaletteGenerator';
import { Palette } from '@/components/palettes/Palette';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { generatePaletteFromLibrary, type GenerationType } from '@/lib/palette-generator';

export default function PaletteGeneratorPage() {
  const [baseColor, setBaseColor] = useState('#007bff');
  const [numColors, setNumColors] = useState(5);
  const [generationType, setGenerationType] = useState<GenerationType>('analogous');
  const [generatedPalettes, setGeneratedPalettes] = useState<string[][]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGeneratePalette = useCallback(() => {
    setError(null);
    try {
      const result = generatePaletteFromLibrary({ baseColor, numColors, type: generationType });
      setGeneratedPalettes(prev => [result, ...prev]);
    } catch (e: any) {
      setError(e.message);
      toast({
        title: "Error Generating Palette",
        description: e.message,
        variant: "destructive",
      });
    }
  }, [baseColor, numColors, generationType, toast]);

  const handleSavePalette = (palette: string[]) => {
    try {
      const savedPalettesJSON = localStorage.getItem('saved_palettes');
      const savedPalettes = savedPalettesJSON ? JSON.parse(savedPalettesJSON) : [];
      savedPalettes.push(palette);
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
  };

  const handleDeletePalette = (index: number) => {
    setGeneratedPalettes(prev => prev.filter((_, i) => i !== index));
    toast({ title: "Palette Removed" });
  };

  return (
    <main className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <PaletteGenerator 
        baseColor={baseColor}
        setBaseColor={setBaseColor}
        numColors={numColors}
        setNumColors={setNumColors}
        generationType={generationType}
        setGenerationType={setGenerationType}
        handleGenerate={handleGeneratePalette}
      />
      
      {error && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {generatedPalettes.map((palette, index) => (
          <Palette 
            key={index}
            palette={palette}
            actions={
              <>
                <Button variant="outline" onClick={() => handleSavePalette(palette)}>Save</Button>
                <Button variant="destructive" onClick={() => handleDeletePalette(index)}>Delete</Button>
              </>
            }
          />
        ))}
      </div>
    </main>
  );
}
