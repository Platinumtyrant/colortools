
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GenerationType } from "@/lib/palette-generator";
import { Button } from "@/components/ui/button";
import { Dices } from "lucide-react";

interface PaletteGeneratorProps {
  onRandomize: () => void;
  numColors: number;
  setNumColors: (num: number) => void;
  generationType: GenerationType;
  setGenerationType: (type: GenerationType) => void;
  isGenerationLocked: boolean;
}

export const PaletteGenerator = ({
  onRandomize,
  numColors,
  setNumColors,
  generationType,
  setGenerationType,
  isGenerationLocked
}: PaletteGeneratorProps) => {
  return (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader>
        <CardTitle>Generate a New Palette</CardTitle>
        <CardDescription>
          Use the controls to generate a palette. Lock colors to preserve them during randomization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <Label htmlFor="randomizer">Randomize</Label>
             <Button onClick={onRandomize} id="randomizer" className="w-full">
                <Dices className="mr-2 h-4 w-4" />
                Generate New Palette
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="generationType">Generation Type</Label>
            <Select 
                value={generationType} 
                onValueChange={(value) => setGenerationType(value as GenerationType)}
                disabled={isGenerationLocked}
              >
              <SelectTrigger id="generationType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="analogous">Analogous</SelectItem>
                <SelectItem value="triadic">Triadic</SelectItem>
                <SelectItem value="complementary">Complementary</SelectItem>
                <SelectItem value="tints">Tints</SelectItem>
                <SelectItem value="shades">Shades</SelectItem>
              </SelectContent>
            </Select>
            {isGenerationLocked && <p className="text-xs text-muted-foreground mt-1">Unlock all colors to change strategy.</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="numColors">Number of Colors: {numColors}</Label>
            <div className="flex items-center gap-2">
                <Slider
                id="numColors"
                min={2}
                max={10}
                step={1}
                value={[numColors]}
                onValueChange={(value) => setNumColors(value[0])}
                className="flex-1"
                />
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setNumColors(numColors - 1)} disabled={numColors <= 2}>-</Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setNumColors(numColors + 1)} disabled={numColors >= 10}>+</Button>
                </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
