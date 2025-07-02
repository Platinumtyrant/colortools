"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ColorPicker } from "./ColorPicker";
import { Sparkles } from "lucide-react";

interface PaletteGeneratorProps {
  baseColor: string;
  setBaseColor: (color: string) => void;
  numColors: number;
  setNumColors: (num: number) => void;
  handleGenerate: () => void;
}

export const PaletteGenerator = ({
  baseColor,
  setBaseColor,
  numColors,
  setNumColors,
  handleGenerate,
}: PaletteGeneratorProps) => {
  return (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader>
        <CardTitle>Generate a New Palette</CardTitle>
        <CardDescription>
          Pick a base color, choose how many colors you want, and we'll generate a beautiful palette for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <Label htmlFor="baseColor">Base Color</Label>
            <ColorPicker color={baseColor} setColor={setBaseColor} />
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
            />
          </div>

          <Button size="lg" onClick={handleGenerate} className="w-full lg:w-auto justify-self-stretch lg:justify-self-end">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Palette
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
