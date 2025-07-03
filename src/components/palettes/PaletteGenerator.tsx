
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ColorPicker } from "./ColorPicker";
import { Wand2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GenerationType } from "@/lib/palette-generator";

interface PaletteGeneratorProps {
  baseColor: string;
  setBaseColor: (color: string) => void;
  numColors: number;
  setNumColors: (num: number) => void;
  generationType: GenerationType;
  setGenerationType: (type: GenerationType) => void;
  handleGenerate: () => void;
}

export const PaletteGenerator = ({
  baseColor,
  setBaseColor,
  numColors,
  setNumColors,
  generationType,
  setGenerationType,
  handleGenerate,
}: PaletteGeneratorProps) => {
  return (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader>
        <CardTitle>Generate a New Palette</CardTitle>
        <CardDescription>
          Pick a base color, choose how many colors you want, and we&apos;ll generate a beautiful palette for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <Label htmlFor="baseColor">Base Color</Label>
            <ColorPicker color={baseColor} setColor={setBaseColor} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="generationType">Generation Type</Label>
            <Select value={generationType} onValueChange={(value) => setGenerationType(value as GenerationType)}>
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
            <Wand2 className="mr-2 h-4 w-4" />
            Generate Palette
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
