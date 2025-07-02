"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { suggestPaletteColors } from "@/ai/flows/suggest-palette-colors";
import type { SuggestPaletteColorsOutput } from "@/ai/flows/suggest-palette-colors";

import { PaletteGenerator } from "@/components/palettes/PaletteGenerator";
import { Palette } from "@/components/palettes/Palette";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Heart, Trash2, Share2, Copy } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const [baseColor, setBaseColor] = useState<string>("#FF9800");
  const [numColors, setNumColors] = useState<number>(5);
  const [generatedPalettes, setGeneratedPalettes] = useState<string[][]>([]);
  const [savedPalettes, setSavedPalettes] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result: SuggestPaletteColorsOutput = await suggestPaletteColors({ baseColor, numColors });
      if (result && result.colors) {
        setGeneratedPalettes(prev => [result.colors, ...prev]);
      }
    } catch (error) {
      console.error("AI generation failed:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with the AI generation.",
      });
    } finally {
      setIsLoading(false);
    }
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
            Create stunning color palettes with the power of AI.
          </p>
        </header>

        <PaletteGenerator 
          baseColor={baseColor}
          setBaseColor={setBaseColor}
          numColors={numColors}
          setNumColors={setNumColors}
          handleGenerate={handleGenerate}
          isLoading={isLoading}
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
          {isLoading && generatedPalettes.length === 0 && (
             <div className="text-center text-muted-foreground pt-10">Generating your masterpiece...</div>
          )}
        </div>
      </main>
    </div>
  );
}
