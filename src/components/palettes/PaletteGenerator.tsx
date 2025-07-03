
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ColorPicker } from "./ColorPicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GenerationType } from "@/lib/palette-generator";
import { Button } from "@/components/ui/button";

interface PaletteGeneratorProps {
  baseColor: string;
  setBaseColor: (color: string) => void;
  numColors: number;
  setNumColors: (num: number) => void;
  generationType: GenerationType;
  setGenerationType: (type: GenerationType) => void;
}

export const PaletteGenerator = ({
  baseColor,
  setBaseColor,
  numColors,
  setNumColors,
  generationType,
  setGenerationType,
}: PaletteGeneratorProps) => {
  return (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader>
        <CardTitle>Generate a New Palette</CardTitle>
        <CardDescription>
          Adjust the controls below to generate a palette in real-time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6 items-end">
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
