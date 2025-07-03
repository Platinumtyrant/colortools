
"use client";

import React, { useState, useMemo } from 'react';
import chroma from 'chroma-js';
import { useToast } from '@/hooks/use-toast';
import { simulate, type SimulationType } from '@/lib/colorblind';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';


// Helper to get graph data
const getGraphData = (colors: string[]) => {
  if (!colors || colors.length === 0) return { lightness: [], saturation: [], hue: [] };
  const lch = colors.map(c => chroma(c).lch());
  return {
    lightness: lch.map((c, i) => ({ name: i + 1, value: c[0] })),
    saturation: lch.map((c, i) => ({ name: i + 1, value: c[1] })),
    hue: lch.map((c, i) => ({ name: i + 1, value: isNaN(c[2]) ? 0 : c[2] })),
  };
};

// Graph Component
const ChartDisplay = ({ data, title, color }: { data: { name: number; value: number }[], title: string, color: string }) => (
  <div>
    <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin', 'dataMax']} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
          }}
        />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: color, fill: color }}  />
        <Line type="linear" dataKey="value" stroke="hsl(var(--muted-foreground))" strokeWidth={1} dot={false} activeDot={false} strokeDasharray="4 4" className="opacity-50" />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default function ScalePage() {
  const [keyColors, setKeyColors] = useState<string[]>(['#00429d', '#96ffea', '#ffffe0']);
  const [numColors, setNumColors] = useState(9);
  const [simulationType, setSimulationType] = useState<SimulationType>('normal');
  const [useBezier, setUseBezier] = useState(true);
  const [correctLightness, setCorrectLightness] = useState(true);

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
      toast({ title: "Invalid Color", description: "Reverting to previous color.", variant: "destructive" });
      setKeyColors([...keyColors]);
    }
  }

  const addKeyColor = () => {
    if (keyColors.length >= 8) {
      toast({ title: "Maximum of 8 key colors reached." });
      return;
    }
    setKeyColors([...keyColors, '#ffffff']);
  };

  const removeKeyColor = (index: number) => {
    if (keyColors.length <= 2) {
      toast({ title: "A minimum of 2 key colors is required." });
      return;
    }
    const newKeyColors = keyColors.filter((_, i) => i !== index);
    setKeyColors(newKeyColors);
  };

  const generatedPalette = useMemo(() => {
    try {
      if (keyColors.some(c => !chroma.valid(c))) return [];
      
      let scale = useBezier 
        ? chroma.scale(chroma.bezier(keyColors)) 
        : chroma.scale(keyColors);

      if (correctLightness) {
        scale = scale.correctLightness();
      }
      
      return scale.mode('lch').colors(numColors);
    } catch (e) {
      console.error("Error generating color scale:", e);
      return [];
    }
  }, [keyColors, numColors, useBezier, correctLightness]);

  const simulatedPalette = useMemo(() => {
    return generatedPalette.map(color => simulate(color, simulationType));
  }, [generatedPalette, simulationType]);

  const graphData = useMemo(() => getGraphData(generatedPalette), [generatedPalette]);
  
  const isColorblindSafe = useMemo(() => {
    if (simulatedPalette.length < 2) return true;
    for (let i = 0; i < simulatedPalette.length - 1; i++) {
        const contrast = chroma.contrast(simulatedPalette[i], simulatedPalette[i+1]);
        if (contrast < 1.1) return false;
    }
    return true;
  }, [simulatedPalette]);


  return (
    <main className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Scale Generator</CardTitle>
          <CardDescription>Create beautiful, complex color scales and check them for accessibility.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium mb-4 block">1. Key Colors</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {keyColors.map((color, index) => (
                <div key={index} className="flex items-center gap-2 relative group">
                  <Input type="color" value={color} onChange={(e) => handleKeyColorChange(index, e.target.value)} className="w-10 h-10 p-1 cursor-pointer" />
                  <Input type="text" value={color} onChange={(e) => handleKeyColorChange(index, e.target.value)} onBlur={(e) => handleKeyColorBlur(index, e.target.value)} className="font-mono uppercase" />
                  <Button variant="ghost" size="icon" onClick={() => removeKeyColor(index)} className="h-6 w-6" disabled={keyColors.length <= 2}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addKeyColor} disabled={keyColors.length >= 8}>
                <Plus className="mr-2 h-4 w-4" /> Add Color
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="numColors" className="text-base font-medium">2. Number of Colors: {numColors}</Label>
            <Slider id="numColors" min={2} max={24} step={1} value={[numColors]} onValueChange={(value) => setNumColors(value[0])} />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
           <CardTitle>3. Check and configure the resulting palette</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="correctLightness" checked={correctLightness} onCheckedChange={(checked) => setCorrectLightness(!!checked)} />
                <Label htmlFor="correctLightness">Correct lightness</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="bezier" checked={useBezier} onCheckedChange={(checked) => setUseBezier(!!checked)} />
                <Label htmlFor="bezier">Bezier interpolation</Label>
              </div>
            </div>
             <div className="flex items-center gap-4">
               {isColorblindSafe && <span className="flex items-center text-sm text-green-400"><CheckCircle2 className="mr-2 h-4 w-4" /> This palette is colorblind-safe.</span>}
                <Label className="text-sm">Simulate:</Label>
                <RadioGroup defaultValue="normal" value={simulationType} onValueChange={(value) => setSimulationType(value as SimulationType)} className="flex items-center border rounded-md p-0.5">
                    <RadioGroupItem value="normal" id="normal" className="sr-only" />
                    <Label htmlFor="normal" className={cn("px-3 py-1 cursor-pointer text-sm", simulationType === 'normal' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>normal</Label>
                    
                    <RadioGroupItem value="deutan" id="deutan" className="sr-only" />
                    <Label htmlFor="deutan" className={cn("px-3 py-1 cursor-pointer text-sm", simulationType === 'deutan' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>deut.</Label>
                    
                    <RadioGroupItem value="protan" id="protan" className="sr-only" />
                    <Label htmlFor="protan" className={cn("px-3 py-1 cursor-pointer text-sm", simulationType === 'protan' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>prot.</Label>

                    <RadioGroupItem value="tritan" id="tritan" className="sr-only" />
                    <Label htmlFor="tritan" className={cn("px-3 py-1 cursor-pointer text-sm", simulationType === 'tritan' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>trit.</Label>
                </RadioGroup>
            </div>
          </div>
          <div className="flex h-16 w-full overflow-hidden rounded-md border">
            {simulatedPalette.map((color, index) => (
              <div key={index} style={{ backgroundColor: color }} className="flex-1" />
            ))}
          </div>
           <div className="grid md:grid-cols-3 gap-8 pt-4">
              <ChartDisplay data={graphData.lightness} title="Lightness" color="hsl(var(--chart-1))" />
              <ChartDisplay data={graphData.saturation} title="Saturation" color="hsl(var(--chart-2))" />
              <ChartDisplay data={graphData.hue} title="Hue" color="hsl(var(--chart-3))" />
            </div>
        </CardContent>
      </Card>

    </main>
  );
}
