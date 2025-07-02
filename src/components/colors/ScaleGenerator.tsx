"use client";

import React, { useState, useMemo } from 'react';
import chroma from 'chroma-js';
import { ColorList } from './ColorList';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScaleGeneratorProps {
  onSetActiveColor: (color: string) => void;
  onCopySuccess: (message: string) => void;
}

export const ScaleGenerator = ({ onSetActiveColor, onCopySuccess }: ScaleGeneratorProps) => {
  const [keyColors, setKeyColors] = useState<string[]>(['#00429d', '#96ffea', '#ffffe0']);
  const [numColors, setNumColors] = useState(9);
  const { toast } = useToast();

  const handleKeyColorChange = (index: number, newColor: string) => {
    const newKeyColors = [...keyColors];
    if (/^#[0-9a-f]{6}$/i.test(newColor) || /^#[0-9a-f]{3}$/i.test(newColor)) {
      newKeyColors[index] = newColor;
      setKeyColors(newKeyColors);
    }
  };
  
  const handleKeyColorBlur = (index: number, newColor: string) => {
    const newKeyColors = [...keyColors];
    if (chroma.valid(newColor)) {
        newKeyColors[index] = chroma(newColor).hex();
        setKeyColors(newKeyColors);
    } else {
        // revert to old color if invalid
        const revertedColors = [...keyColors];
        setKeyColors(revertedColors);
    }
  }


  const addKeyColor = () => {
    if (keyColors.length >= 8) {
      toast({ title: "Maximum of 8 key colors reached."});
      return;
    }
    setKeyColors([...keyColors, '#ffffff']);
  };

  const removeKeyColor = (index: number) => {
    if (keyColors.length <= 2) {
      toast({ title: "A minimum of 2 key colors is required."});
      return;
    }
    const newKeyColors = keyColors.filter((_, i) => i !== index);
    setKeyColors(newKeyColors);
  };

  const generatedPalette = useMemo(() => {
    try {
      if (keyColors.some(c => !chroma.valid(c))) return [];
      return chroma.scale(keyColors).mode('lch').colors(numColors);
    } catch (e) {
      console.error("Error generating color scale:", e);
      return [];
    }
  }, [keyColors, numColors]);

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-2 block">Key Colors</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {keyColors.map((color, index) => (
            <div key={index} className="flex items-center gap-2 relative group">
              <Input
                type="color"
                value={color}
                onChange={(e) => handleKeyColorChange(index, e.target.value)}
                className="w-10 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => handleKeyColorChange(index, e.target.value)}
                onBlur={(e) => handleKeyColorBlur(index, e.target.value)}
                className="font-mono uppercase"
                placeholder="#000000"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeKeyColor(index)}
                className="h-6 w-6"
                disabled={keyColors.length <= 2}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex items-center">
            <Button variant="outline" onClick={addKeyColor} disabled={keyColors.length >= 8} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Color
            </Button>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="numColors" className="text-base font-medium">Number of Colors: {numColors}</Label>
        <Slider
          id="numColors"
          min={2}
          max={24}
          step={1}
          value={[numColors]}
          onValueChange={(value) => setNumColors(value[0])}
        />
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-4">Generated Palette</h3>
        <ColorList
          colors={generatedPalette}
          title=""
          onSetActiveColor={onSetActiveColor}
          onCopySuccess={onCopySuccess}
        />
      </div>
    </div>
  );
};
