
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import hwbPlugin from 'colord/plugins/hwb';
import lchPlugin from 'colord/plugins/lch';
import labPlugin from 'colord/plugins/lab';
import chroma from 'chroma-js';
import { usePaletteBuilder } from '@/contexts/PaletteBuilderContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip as ShadTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { simulate, type SimulationType } from '@/lib/colorblind';
import { WCAGDisplay } from '@/components/colors/WCAGDisplay';
import { ContrastGrid } from '@/components/colors/ContrastGrid';
import ColorPickerClient from '@/components/colors/ColorPickerClient';
import { CheckCircle2, AlertTriangle, LineChart as LineChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';


extend([hwbPlugin, a11yPlugin, lchPlugin, labPlugin]);

type SavedPalette = {
  id: number;
  name: string;
  colors: string[];
};

type ColorSpace = 'lch' | 'lab' | 'hsl' | 'hwb' | 'srgb';

const colorSpaceInfo: Record<ColorSpace, { name: string; components: string[]; descriptions: string[] }> = {
  lch: { name: 'LCH', components: ['L', 'C', 'H'], descriptions: ['Lightness (0-100)', 'Chroma (0-150)', 'Hue (0-360)'] },
  lab: { name: 'Lab', components: ['L*', 'a*', 'b*'], descriptions: ['Lightness', 'Green-Red', 'Blue-Yellow'] },
  hsl: { name: 'HSL', components: ['H', 'S', 'L'], descriptions: ['Hue (0-360)', 'Saturation (0-1)', 'Lightness (0-1)'] },
  hwb: { name: 'HWB', components: ['H', 'W', 'B'], descriptions: ['Hue (0-360)', 'Whiteness (0-100)', 'Blackness (0-100)'] },
  srgb: { name: 'sRGB', components: ['R', 'G', 'B'], descriptions: ['Red (0-255)', 'Green (0-255)', 'Blue (0-255)'] },
};

const getGraphData = (colors: string[], space: ColorSpace) => {
    if (!colors || colors.length === 0) return [];
    
    let components: [number, number, number][] = [];
    switch (space) {
        case 'lch':   components = colors.map(c => chroma(c).lch()); break;
        case 'lab':   components = colors.map(c => chroma(c).lab()); break;
        case 'hsl':   components = colors.map(c => chroma(c).hsl()); break;
        case 'hwb':   components = colors.map(c => colord(c).toHwb()).map(o => [o.h, o.w, o.b]); break;
        case 'srgb':  components = colors.map(c => chroma(c).rgb()); break;
        default:      components = colors.map(c => chroma(c).lch());
    }

    return components[0].map((_, i) => ({
      data: components.map((c, j) => ({
        name: j + 1,
        value: isNaN(c[i]) ? 0 : c[i]
      })),
      title: colorSpaceInfo[space].components[i],
      description: colorSpaceInfo[space].descriptions[i]
    }));
};

const ChartDisplay = ({ data, title, color, description }: { data: { name: number; value: number }[], title: string, color: string, description: string }) => (
  <div>
    <TooltipProvider>
      <ShadTooltip>
        <TooltipTrigger asChild>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 cursor-help underline decoration-dotted decoration-from-font">{title}</h3>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{description}</p>
        </TooltipContent>
      </ShadTooltip>
    </TooltipProvider>
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis 
          stroke="hsl(var(--muted-foreground))" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          domain={['dataMin', 'dataMax']}
          tickFormatter={(value) => typeof value === 'number' ? value.toFixed(1) : value}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
          }}
          formatter={(value: number) => value.toFixed(2)}
        />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: color, fill: color }}  />
      </LineChart>
    </ResponsiveContainer>
  </div>
);


export default function AnalysisPage() {
    const { toast } = useToast();
    const { palette: paletteFromBuilder } = usePaletteBuilder();
    const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);
    const [source, setSource] = useState<'builder' | number>('builder');
    const [isClient, setIsClient] = useState(false);

    const [simulationType, setSimulationType] = useState<SimulationType>('normal');
    const [correctLightness, setCorrectLightness] = useState(true);
    const [useBezier, setUseBezier] = useState(true);
    const [colorSpace, setColorSpace] = useState<ColorSpace>('lch');
    const [fgColor, setFgColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#FFFFFF');

    useEffect(() => {
        setIsClient(true);
        try {
            const savedPalettesJSON = localStorage.getItem('saved_palettes');
            if (savedPalettesJSON) {
                const palettes = JSON.parse(savedPalettesJSON);
                setSavedPalettes(palettes);
            }
        } catch (e) {
            toast({ title: "Could not load palettes", variant: "destructive" });
        }
    }, [toast]);

    const paletteHexes = useMemo(() => {
      if (source === 'builder') {
        return paletteFromBuilder.map(p => p.hex);
      }
      const selected = savedPalettes.find(p => p.id === source);
      return selected?.colors || [];
    }, [source, paletteFromBuilder, savedPalettes]);
    
    useEffect(() => {
      if (paletteHexes.length > 0 && fgColor === '#000000' && bgColor === '#FFFFFF') {
          setFgColor(paletteHexes[0]);
          if(paletteHexes.length > 1) {
            setBgColor(paletteHexes[1]);
          }
      }
    }, [paletteHexes, fgColor, bgColor]);

    const handleSelectSource = (id: string) => {
        setSource(id === 'builder' ? 'builder' : parseInt(id, 10));
    }

    const interpolationMode = useMemo(() => {
        if (colorSpace === 'hwb' || colorSpace === 'srgb') return 'lch';
        return colorSpace;
    }, [colorSpace]);
    
    const analysisSourcePalette = useMemo(() => {
        if (paletteHexes.length < 2) return paletteHexes;
        if (!useBezier && !correctLightness) {
            return paletteHexes;
        }
        const interpolator = useBezier ? chroma.bezier(paletteHexes) : paletteHexes;
        let scale = chroma.scale(interpolator).mode(interpolationMode as any);
        if (correctLightness) {
            scale = scale.correctLightness();
        }
        return scale.colors(paletteHexes.length);
    }, [paletteHexes, useBezier, correctLightness, interpolationMode]);
  
    const simulatedPalette = useMemo(() => {
        if (analysisSourcePalette.length === 0) return [];
        const source = (useBezier || correctLightness) ? analysisSourcePalette : paletteHexes;
        return source.map(color => simulate(color, simulationType));
    }, [analysisSourcePalette, paletteHexes, simulationType, useBezier, correctLightness]);
  
    const graphData = useMemo(() => getGraphData(analysisSourcePalette, colorSpace), [analysisSourcePalette, colorSpace]);
    
    const isPaletteColorblindSafe = useMemo(() => {
        if (paletteHexes.length < 2) return true;

        for(let i=0; i < simulatedPalette.length - 1; i++){
            if(chroma.contrast(simulatedPalette[i], simulatedPalette[i+1]) < 1.15){
                return false;
            }
        }
        return true;
    }, [paletteHexes, simulatedPalette]);

    const hasPalette = paletteHexes.length > 0;

    const renderAnalysisPanel = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="flex justify-between items-center text-sm">
                        <Label>Simulated View</Label>
                        <AnimatePresence>
                            {isPaletteColorblindSafe ? (
                                <motion.span
                                    key="safe"
                                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                    className="flex items-center text-xs text-green-500 gap-1.5"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Adjacent contrast OK
                                </motion.span>
                            ) : (
                                 <motion.span
                                    key="unsafe"
                                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                    className="flex items-center text-xs text-amber-500 gap-1.5"
                                >
                                    <AlertTriangle className="h-3.5 w-3.5" /> Low adjacent contrast
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative group/palette w-full h-16 rounded-md overflow-hidden border">
                        <div className="h-full w-full flex">
                            {simulatedPalette.map((color, index) => (
                                <div key={index} style={{ backgroundColor: color }} className="flex-1" />
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                       <div className="space-y-1.5">
                            <Label className="text-sm">Simulate Deficiency</Label>
                            <RadioGroup defaultValue="normal" value={simulationType} onValueChange={(value) => setSimulationType(value as SimulationType)} className="flex flex-wrap items-center gap-1 border rounded-md p-1">
                                <RadioGroupItem value="normal" id="sb-normal" className="sr-only" />
                                <Label htmlFor="sb-normal" className={cn("px-2 py-1 cursor-pointer text-xs rounded-sm", simulationType === 'normal' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Normal</Label>
                                <RadioGroupItem value="deutan" id="sb-deutan" className="sr-only" />
                                <Label htmlFor="sb-deutan" className={cn("px-2 py-1 cursor-pointer text-xs rounded-sm", simulationType === 'deutan' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Deutan</Label>
                                <RadioGroupItem value="deuteranomaly" id="sb-deuteranomaly" className="sr-only" />
                                <Label htmlFor="sb-deuteranomaly" className={cn("px-2 py-1 cursor-pointer text-xs rounded-sm", simulationType === 'deuteranomaly' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Deuteranomaly</Label>
                                <RadioGroupItem value="protan" id="sb-protan" className="sr-only" />
                                <Label htmlFor="sb-protan" className={cn("px-2 py-1 cursor-pointer text-xs rounded-sm", simulationType === 'protan' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Protan</Label>
                                <RadioGroupItem value="tritan" id="sb-tritan" className="sr-only" />
                                <Label htmlFor="sb-tritan" className={cn("px-2 py-1 cursor-pointer text-xs rounded-sm", simulationType === 'tritan' ? 'bg-muted text-foreground shadow-sm' : 'bg-transparent text-muted-foreground')}>Tritan</Label>
                            </RadioGroup>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm">Graph Color Space</Label>
                            <Select value={colorSpace} onValueChange={(v) => setColorSpace(v as ColorSpace)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select colorspace..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(colorSpaceInfo).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>{value.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="useBezier" checked={useBezier} onCheckedChange={(checked) => setUseBezier(!!checked)} />
                                <TooltipProvider>
                                    <ShadTooltip>
                                        <TooltipTrigger asChild>
                                            <Label htmlFor="useBezier" className="cursor-help underline decoration-dotted decoration-from-font">Bezier interpolation</Label>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="max-w-xs">Smooths the line between colors using a curve, creating a more natural transition.</p>
                                        </TooltipContent>
                                    </ShadTooltip>
                                </TooltipProvider>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="correctLightness" checked={correctLightness} onCheckedChange={(checked) => setCorrectLightness(!!checked)} />
                                <Label htmlFor="correctLightness">Correct lightness</Label>
                            </div>
                        </div>
                    </div>
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="space-y-2 pt-4">
                        {graphData.map((graph, i) => (
                            <ChartDisplay 
                                key={`${graph.title}-${i}`}
                                data={graph.data} 
                                title={graph.title} 
                                description={graph.description}
                                color={`hsl(var(--chart-${(i % 5) + 1}))`}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
    
    const renderNoPaletteState = () => (
         <div className="flex h-full min-h-[50vh] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center mt-6">
            <LineChartIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">
                No Palette Loaded
            </h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
                The current palette in the builder is empty. <br />Go build one or select a saved palette to begin analysis.
            </p>
        </div>
    );

    return (
        <main className="flex-1 w-full p-4 md:p-8">
            <CardHeader className="p-0 mb-4">
                <CardTitle className="text-3xl">Palette Analyzer</CardTitle>
                <CardDescription>Select a palette to analyze its properties, color-blind simulations, and contrast ratios.</CardDescription>
            </CardHeader>

            <div className="max-w-xs mb-8">
                <Select value={String(source)} onValueChange={handleSelectSource}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a palette..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                        <SelectItem value="builder">Current Builder Palette</SelectItem>
                        {isClient && savedPalettes.length > 0 && (
                            savedPalettes.map(p => (
                                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                            ))
                        )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
            </div>
            
             <Tabs defaultValue="palette-analysis" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="palette-analysis">Palette Analysis</TabsTrigger>
                    <TabsTrigger value="contrast-checker">Contrast Checker</TabsTrigger>
                </TabsList>
                <TabsContent value="palette-analysis" className="p-4 flex-grow min-h-0 overflow-y-auto">
                   {hasPalette ? renderAnalysisPanel() : renderNoPaletteState()}
                </TabsContent>
                <TabsContent value="contrast-checker" className="p-4 flex-grow min-h-0 overflow-y-auto">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                             {hasPalette && <ContrastGrid colors={paletteHexes} />}
                        </div>
                        <div className="space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <Label className="text-sm font-medium mb-2 block">Text Color</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="justify-start gap-2 w-full">
                                                <div className="w-4 h-4 rounded border" style={{backgroundColor: fgColor}}></div>
                                                {fgColor.toUpperCase()}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-0">
                                            <ColorPickerClient color={fgColor} onChange={(c) => setFgColor(c.hex)} />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                 <div>
                                    <Label className="text-sm font-medium mb-2 block">Background Color</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="justify-start gap-2 w-full">
                                                <div className="w-4 h-4 rounded border" style={{backgroundColor: bgColor}}></div>
                                                {bgColor.toUpperCase()}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-0">
                                            <ColorPickerClient color={bgColor} onChange={(c) => setBgColor(c.hex)} />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                             </div>
                            
                            <div
                                className="p-4 rounded-lg text-center border-2 border-dashed flex items-center justify-center h-40"
                                style={{ backgroundColor: bgColor, color: fgColor }}
                            >
                                <p className="font-bold text-[64pt]">Aa</p>
                            </div>
                            
                            <WCAGDisplay textColor={fgColor} bgColor={bgColor} />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </main>
    );
}
