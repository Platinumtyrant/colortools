
"use client";

import React, { useState, useCallback } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { colord } from 'colord';
import { useToast } from "@/hooks/use-toast";
import { 
  getComplementary,
  getAnalogous,
  getSplitComplementary,
  getTriadic,
  getSquare,
  getRectangular,
  getTints,
  getShades,
  getTones,
  swatches 
} from '@/lib/colors';
import { ColorList } from '@/components/colors/ColorList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';


export default function ColorPaletteBuilderPage() {
  const [mainColor, setMainColor] = useState('#ff0000');
  const [paletteColors, setPaletteColors] = useState<string[]>([]);
  
  const [activeSwatchTab, setActiveSwatchTab] = useState('green');
  const [activeHarmonyType, setActiveHarmonyType] = useState('complementary');
  const [tintSteps, setTintSteps] = useState(5);
  const [shadeSteps, setShadeSteps] = useState(5);
  const [toneSteps, setToneSteps] = useState(5);

  const { toast } = useToast();

  const handleCopySuccess = useCallback((message: string) => {
    toast({ title: message });
  }, [toast]);
  
  const hsl = colord(mainColor).toHsl();
  const rgb = colord(mainColor).toRgb();
  const hex = colord(mainColor).toHex();

  const handleHslChange = useCallback((key: 'h' | 's' | 'l', value: number) => {
    const newHsl = { ...hsl, [key]: value };
    const newColor = colord(newHsl).toHex();
    setMainColor(newColor);
  }, [hsl]);

  const handleRgbChange = useCallback((key: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...rgb, [key]: value };
    const newColor = colord(newRgb).toHex();
    setMainColor(newColor);
  }, [rgb]);

  const handleHexChange = useCallback((value: string) => {
    if (colord(value).isValid()) {
      setMainColor(value);
    }
  }, []);

  const handleAddCurrentColorToPalette = useCallback(() => {
    setPaletteColors(prevColors => {
      if (prevColors.includes(mainColor)) {
        handleCopySuccess('Color already in palette.');
        return prevColors;
      }
      const newColors = [...prevColors];
      if (newColors.length >= 20) {
        toast({ title: "Palette full", description: "You can have a maximum of 20 colors.", variant: "destructive" });
        return prevColors;
      }
      newColors.push(mainColor);
      return newColors;
    });
    handleCopySuccess('Color added to palette!');
  }, [mainColor, handleCopySuccess, toast]);

  const handleAddSpecificColorToPalette = useCallback((color: string) => {
    setPaletteColors(prevColors => {
      if (prevColors.includes(color)) {
        toast({ title: "Color already in palette." });
        return prevColors;
      }
      if (prevColors.length >= 20) {
        toast({ title: "Palette full", description: "You can have a maximum of 20 colors.", variant: "destructive" });
        return prevColors;
      }
      const newColors = [...prevColors, color];
      return newColors;
    });
    handleCopySuccess('Color added to palette!');
  }, [toast, handleCopySuccess]);

  const handleRemoveColorFromPalette = useCallback((colorToRemove: string) => {
    setPaletteColors(prevColors => prevColors.filter(color => color !== colorToRemove));
    handleCopySuccess('Color removed from palette!');
  }, [handleCopySuccess]);

  const handleClearPalette = useCallback(() => {
    if (paletteColors.length > 0) {
      setPaletteColors([]);
      toast({ title: "Palette Cleared!" });
    }
  }, [paletteColors, toast]);

  const currentTints = getTints(mainColor, tintSteps);
  const currentShades = getShades(mainColor, shadeSteps);
  const currentTones = getTones(mainColor, toneSteps);
  const currentSwatchColors = swatches[activeSwatchTab as keyof typeof swatches] || [];

  const getActiveHarmonyColors = useCallback(() => {
    switch (activeHarmonyType) {
      case 'complementary':
        return getComplementary(mainColor);
      case 'analogous':
        return getAnalogous(mainColor);
      case 'split-complementary':
        return getSplitComplementary(mainColor);
      case 'triad':
        return getTriadic(mainColor);
      case 'square':
        return getSquare(mainColor);
      case 'rectangle':
        return getRectangular(mainColor);
      default:
        return getComplementary(mainColor);
    }
  }, [mainColor, activeHarmonyType]);

  const currentHarmonyColors = getActiveHarmonyColors();

  const handlePaletteColorClick = useCallback((color: string) => {
    setMainColor(color);
  }, []);

  const handleSaveToLibrary = useCallback(() => {
    if (paletteColors.length === 0) {
      toast({
        title: "Cannot save empty palette",
        variant: "destructive",
      });
      return;
    }
    const savedPalettesJSON = localStorage.getItem('saved_palettes');
    const savedPalettes = savedPalettesJSON ? JSON.parse(savedPalettesJSON) : [];
    savedPalettes.push(paletteColors);
    localStorage.setItem('saved_palettes', JSON.stringify(savedPalettes));
    toast({
      title: "Palette Saved!",
      description: "Your palette has been saved to the library.",
    });
    setPaletteColors([]); // Clear palette after saving
  }, [paletteColors, toast]);

  const responsiveGridClasses = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5";

  return (
    <main className="w-full flex flex-col lg:flex-row gap-8 p-4 md:p-8">
        
        <div className="flex-shrink-0 lg:w-[580px] space-y-4">
            <div className="sticky top-8 space-y-4 self-start">
                <Card>
                  <CardHeader>
                    <CardTitle>Palette Builder</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-full md:w-1/2 flex flex-col gap-4">
                            <div className="w-full">
                                <HexColorPicker color={mainColor} onChange={setMainColor} className="w-full"/>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                <label className="text-sm text-muted-foreground">Current Palette</label>
                                {paletteColors.length > 0 && (
                                    <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleClearPalette}
                                    className="h-7 w-7"
                                    title="Clear Palette"
                                    >
                                    <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                                </div>
                                <div className="flex flex-wrap w-full h-16 border rounded-md overflow-hidden bg-muted/20">
                                {paletteColors.length === 0 && <div className="flex items-center justify-center w-full text-sm text-muted-foreground">Add colors to start...</div>}
                                {paletteColors.map((color) => (
                                    <div
                                    key={color}
                                    className="relative flex h-full cursor-pointer transition-transform duration-100 group"
                                    style={{ backgroundColor: color, flexBasis: `${100 / Math.max(paletteColors.length, 1)}%`, width: `${100 / Math.max(paletteColors.length, 1)}%` }}
                                    onClick={() => handlePaletteColorClick(color)}
                                    title={`Set ${color} as active`}
                                    >
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRemoveColorFromPalette(color); }}
                                        className="absolute top-0 right-0 bg-black bg-opacity-50 text-white w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove color"
                                    >X</button>
                                    </div>
                                ))}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button onClick={handleAddCurrentColorToPalette} className="w-full">
                                Add to Palette ({paletteColors.length}/20)
                                </Button>
                                <Button onClick={handleSaveToLibrary} variant="secondary" className="w-full">
                                Save to Library
                                </Button>
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 flex flex-col gap-4">
                            
                            <Card className="p-4 bg-muted/50">
                                <div className="flex gap-4 items-center">
                                    <div className="w-16 h-16 rounded-md border" style={{ backgroundColor: mainColor }}/>
                                    <div className="text-sm flex-1 space-y-1">
                                        <div className="flex justify-between items-center whitespace-nowrap gap-2">
                                            <span className="text-muted-foreground">HEX:</span>
                                            <span className="font-semibold text-left font-mono">{hex}</span>
                                        </div>
                                        <div className="flex justify-between items-center whitespace-nowrap gap-2">
                                            <span className="text-muted-foreground">RGB:</span>
                                            <span className="font-semibold text-left font-mono">{`${rgb.r}, ${rgb.g}, ${rgb.b}`}</span>
                                        </div>
                                        <div className="flex justify-between items-center whitespace-nowrap gap-2">
                                            <span className="text-muted-foreground">HSL:</span>
                                            <span className="font-semibold text-left font-mono">{`${hsl.h}, ${hsl.s}%, ${hsl.l}%`}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div className="flex flex-col gap-2">
                            <Label className="text-sm text-muted-foreground">HSL</Label>
                            <div className="flex gap-2">
                                <Input type="number" min="0" max="359" value={hsl.h} onChange={(e) => handleHslChange('h', parseInt(e.target.value))} className="w-1/3" />
                                <Input type="number" min="0" max="100" value={hsl.s} onChange={(e) => handleHslChange('s', parseInt(e.target.value))} className="w-1/3" />
                                <Input type="number" min="0" max="100" value={hsl.l} onChange={(e) => handleHslChange('l', parseInt(e.target.value))} className="w-1/3" />
                            </div>
                            </div>
                            <div className="flex flex-col gap-2">
                            <Label className="text-sm text-muted-foreground">RGB</Label>
                            <div className="flex gap-2">
                                <Input type="number" min="0" max="255" value={rgb.r} onChange={(e) => handleRgbChange('r', parseInt(e.target.value))} className="w-1/3" />
                                <Input type="number" min="0" max="255" value={rgb.g} onChange={(e) => handleRgbChange('g', parseInt(e.target.value))} className="w-1/3" />
                                <Input type="number" min="0" max="255" value={rgb.b} onChange={(e) => handleRgbChange('b', parseInt(e.target.value))} className="w-1/3" />
                            </div>
                            </div>
                            <div className="flex flex-col gap-2">
                            <Label className="text-sm text-muted-foreground">HEX</Label>
                            <HexColorInput color={hex} onChange={handleHexChange} className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", "uppercase")} />
                            </div>
                        </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Swatches</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="border-b border-border mb-4 overflow-x-auto">
                            {Object.keys(swatches).map(hue => (
                            <button
                                key={hue}
                                className={cn(
                                    "py-2 px-4 text-xs sm:text-sm font-medium capitalize flex-shrink-0 border-b-2",
                                    activeSwatchTab === hue 
                                    ? 'text-foreground border-primary' 
                                    : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
                                )}
                                onClick={() => setActiveSwatchTab(hue)}
                            >
                                {hue}
                            </button>
                            ))}
                        </div>
                        <div className="h-[450px] overflow-y-auto">
                          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1 p-1">
                              {currentSwatchColors.map((color, index) => (
                              <div
                                  key={index}
                                  className="w-full h-12 cursor-pointer transition-transform duration-100 hover:scale-110"
                                  style={{ backgroundColor: color }}
                                  onClick={() => setMainColor(color)}
                                  title={`Set ${color} as active`}
                              ></div>
                              ))}
                          </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
        
        <div className="flex-1 space-y-8">
            <Card asChild>
                <Tabs defaultValue="tints" className="w-full">
                    <CardHeader>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="tints">Tints</TabsTrigger>
                            <TabsTrigger value="shades">Shades</TabsTrigger>
                            <TabsTrigger value="tones">Tones</TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    <TabsContent value="tints">
                        <CardContent className="space-y-4">
                             <div className="flex items-center gap-4 justify-end">
                                <span className="text-sm font-normal text-muted-foreground">Steps:</span>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTintSteps(s => Math.max(1, s - 1))} disabled={tintSteps <= 1}>-</Button>
                                <Input type="number" value={tintSteps} onChange={(e) => setTintSteps(Math.max(1, Math.min(40, parseInt(e.target.value) || 1)))} className="w-20 h-10 text-center" min="1" max="40"/>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTintSteps(s => Math.min(40, s + 1))} disabled={tintSteps >= 40}>+</Button>
                            </div>
                            <ColorList colors={currentTints} title="" onSetActiveColor={setMainColor} onCopySuccess={handleCopySuccess} onAdd={handleAddSpecificColorToPalette} gridClassName={responsiveGridClasses} />
                        </CardContent>
                    </TabsContent>
                     <TabsContent value="shades">
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 justify-end">
                                <span className="text-sm font-normal text-muted-foreground">Steps:</span>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setShadeSteps(s => Math.max(1, s - 1))} disabled={shadeSteps <= 1}>-</Button>
                                <Input type="number" value={shadeSteps} onChange={(e) => setShadeSteps(Math.max(1, Math.min(40, parseInt(e.target.value) || 1)))} className="w-20 h-10 text-center" min="1" max="40"/>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setShadeSteps(s => Math.min(40, s + 1))} disabled={shadeSteps >= 40}>+</Button>
                            </div>
                            <ColorList colors={currentShades} title="" onSetActiveColor={setMainColor} onCopySuccess={handleCopySuccess} onAdd={handleAddSpecificColorToPalette} gridClassName={responsiveGridClasses} />
                        </CardContent>
                    </TabsContent>
                    <TabsContent value="tones">
                        <CardContent className="space-y-4">
                           <div className="flex items-center gap-4 justify-end">
                                <span className="text-sm font-normal text-muted-foreground">Steps:</span>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setToneSteps(s => Math.max(1, s - 1))} disabled={toneSteps <= 1}>-</Button>
                                <Input type="number" value={toneSteps} onChange={(e) => setToneSteps(Math.max(1, Math.min(40, parseInt(e.target.value) || 1)))} className="w-20 h-10 text-center" min="1" max="40"/>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setToneSteps(s => Math.min(40, s + 1))} disabled={toneSteps >= 40}>+</Button>
                            </div>
                            <ColorList colors={currentTones} title="" onSetActiveColor={setMainColor} onCopySuccess={handleCopySuccess} onAdd={handleAddSpecificColorToPalette} gridClassName={responsiveGridClasses} />
                        </CardContent>
                    </TabsContent>
                </Tabs>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Color Harmonies</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="border-b border-border mb-4 overflow-x-auto">
                    {['complementary', 'analogous', 'split-complementary', 'triad', 'square', 'rectangle'].map(harmony => (
                        <button
                        key={harmony}
                        className={cn(
                            "py-2 px-4 text-sm font-medium capitalize flex-shrink-0 border-b-2",
                            activeHarmonyType === harmony 
                            ? 'text-foreground border-primary' 
                            : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
                        )}
                        onClick={() => setActiveHarmonyType(harmony)}
                        >
                        {harmony.replace('-', ' ')}
                        </button>
                    ))}
                    </div>
                    <ColorList colors={currentHarmonyColors} title="" onSetActiveColor={setMainColor} onCopySuccess={handleCopySuccess} onAdd={handleAddSpecificColorToPalette} gridClassName={responsiveGridClasses} />
                </CardContent>
            </Card>
        </div>
    </main>
  );
}
