"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ColorPicker } from "./ColorPicker";
import { Sparkles, Loader2 } from "lucide-react";

interface PaletteGeneratorProps {
  baseColor: string;
  setBaseColor: (color: string) => void;
  numColors: number;
  setNumColors: (num: number) => void;
  handleGenerate: () => void;
  isLoading: boolean;
}

export const PaletteGenerator = ({
  baseColor,
  setBaseColor,
  numColors,
  setNumColors,
  handleGenerate,
  isLoading,
}: PaletteGeneratorProps) => {
  return (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader>
        <CardTitle>Generate a New Palette</CardTitle>
        <CardDescription>
          Pick a base color, choose how many colors you want, and let our AI do the rest.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <Label htmlFor="baseColor">Base Color</Label>
            <ColorPicker color={baseColor} setColor={setBaseColor} disabled={isLoading} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numColors">Number of Colors: {numColors}</Label>
            <Slider
              id="numColors"
              min={2}
              max={10}
              step={1}
              value={[numColors]}
              onValueChange={(value) => setNumColors(value[0])}
              disabled={isLoading}
            />
          </div>

          <Button size="lg" onClick={handleGenerate} disabled={isLoading} className="w-full lg:w-auto justify-self-stretch lg:justify-self-end">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate Palette
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
