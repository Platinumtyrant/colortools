
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GenerationType } from "@/lib/palette-generator";
import { Button } from "@/components/ui/button";
import { Dices, RotateCcw } from "lucide-react";

interface PaletteGeneratorProps {
  onRandomize: () => void;
  onReset: () => void;
  generationType: GenerationType;
  setGenerationType: (type: GenerationType) => void;
  isGenerationLocked: boolean;
}

export const PaletteGenerator = ({
  onRandomize,
  onReset,
  generationType,
  setGenerationType,
  isGenerationLocked,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-center">
          <div className="space-y-2">
            <Label>Actions</Label>
            <div className="flex gap-2">
              <Button onClick={onRandomize} className="w-full">
                  <Dices className="mr-2 h-4 w-4" />
                  Randomize
              </Button>
              <Button onClick={onReset} variant="outline" className="w-full">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="generationType">Generation Type</Label>
            <div className="relative">
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
               {isGenerationLocked && <p className="text-xs text-muted-foreground mt-1 h-4 absolute -bottom-4">Unlock all colors to change strategy.</p>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
