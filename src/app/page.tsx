
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ColorPaletteBuilderPage() {
  const [mainColor, setMainColor] = useState('#ff0000');
  const [paletteColors, setPaletteColors] = useState<string[]>([]);
  
  const [activeTab, setActiveTab] = useState('palette-builder');
  const [activeSwatchTab, setActiveSwatchTab] = useState('green');
  const [activeHarmonyType, setActiveHarmonyType] = useState('complementary');
  const [tintSteps, setTintSteps] = useState(5);
  const [shadeSteps, setShadeSteps] = useState(5);
  const [toneSteps, setToneSteps] = useState(5);
  const [openVariations, setOpenVariations] = useState(['tints']);

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

  const handleAddColorToPalette = useCallback(() => {
    setPaletteColors(prevColors => {
      if (prevColors.includes(mainColor)) {
        handleCopySuccess('Color already in palette.');
        return prevColors;
      }
      const newColors = [...prevColors];
      if (newColors.length >= 10) {
        toast({ title: "Palette full", description: "You can have a maximum of 10 colors.", variant: "destructive" });
        return prevColors;
      }
      newColors.push(mainColor);
      return newColors;
    });
    handleCopySuccess('Color added to palette!');
  }, [mainColor, handleCopySuccess, toast]);

  const handleRemoveColorFromPalette = useCallback((colorToRemove: string) => {
    setPaletteColors(prevColors => prevColors.filter(color => color !== colorToRemove));
    handleCopySuccess('Color removed from palette!');
  }, [handleCopySuccess]);

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

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
      <div className="flex flex-col gap-8">
        
        <div className="bg-card p-6 shadow-xl">
          <div className="flex border-b border-gray-700 mb-4 overflow-x-auto">
            <button
              className={`py-2 px-4 text-sm font-medium flex-shrink-0 ${activeTab === 'palette-builder' ? 'text-white border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('palette-builder')}
            >
              Palette Builder
            </button>
            <button
              className={`py-2 px-4 text-sm font-medium flex-shrink-0 ${activeTab === 'swatches' ? 'text-white border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('swatches')}
            >
              Swatches
            </button>
          </div>

          {activeTab === 'swatches' && (
            <div>
              <div className="flex border-b border-gray-700 mb-4 overflow-x-auto">
                {Object.keys(swatches).map(hue => (
                  <button
                    key={hue}
                    className={`py-2 px-4 text-xs sm:text-sm font-medium capitalize flex-shrink-0 ${activeSwatchTab === hue ? 'text-white border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
                    onClick={() => setActiveSwatchTab(hue)}
                  >
                    {hue}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1">
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
          )}

          {activeTab === 'palette-builder' && (
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-full md:w-1/2 flex flex-col gap-4">
                  <div className="w-full">
                    <HexColorPicker color={mainColor} onChange={setMainColor} className="w-full"/>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Current Palette</label>
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
                    <Button onClick={handleAddColorToPalette} className="w-full">
                      Add to Palette ({paletteColors.length}/10)
                    </Button>
                    <Button onClick={handleSaveToLibrary} variant="secondary" className="w-full">
                      Save to Library
                    </Button>
                  </div>
              </div>

              <div className="w-full md:w-1/2 grid grid-cols-1 gap-4">
                
                <div className="flex gap-4 items-center p-2 border rounded-md">
                    <div className="w-16 h-16 rounded-md" style={{ backgroundColor: mainColor }}/>
                    <div className="text-white text-sm flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">HEX:</span>
                            <span className="font-semibold text-left font-mono">{hex}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">RGB:</span>
                            <span className="font-semibold text-left font-mono">{`${rgb.r}, ${rgb.g}, ${rgb.b}`}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">HSL:</span>
                            <span className="font-semibold text-left font-mono">{`${hsl.h}, ${hsl.s}%, ${hsl.l}%`}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-400">HSL</label>
                  <div className="flex gap-2">
                    <input type="number" min="0" max="359" value={hsl.h} onChange={(e) => handleHslChange('h', parseInt(e.target.value))} className="w-1/3 p-2  bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="number" min="0" max="100" value={hsl.s} onChange={(e) => handleHslChange('s', parseInt(e.target.value))} className="w-1/3 p-2  bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="number" min="0" max="100" value={hsl.l} onChange={(e) => handleHslChange('l', parseInt(e.target.value))} className="w-1/3 p-2  bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-400">RGB</label>
                  <div className="flex gap-2">
                    <input type="number" min="0" max="255" value={rgb.r} onChange={(e) => handleRgbChange('r', parseInt(e.target.value))} className="w-1/3 p-2  bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="number" min="0" max="255" value={rgb.g} onChange={(e) => handleRgbChange('g', parseInt(e.target.value))} className="w-1/3 p-2  bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="number" min="0" max="255" value={rgb.b} onChange={(e) => handleRgbChange('b', parseInt(e.target.value))} className="w-1/3 p-2  bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-400">HEX</label>
                  <HexColorInput color={hex} onChange={handleHexChange} className="w-full p-2  bg-gray-700 border border-gray-600 text-white uppercase focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <Accordion type="multiple" value={openVariations} onValueChange={setOpenVariations} className="w-full space-y-4">
              <AccordionItem value="tints" className="border-none group">
              <div className="bg-card p-4 shadow-xl flex justify-between items-center">
                <AccordionTrigger className="p-0 text-xl font-bold text-white flex-1 hover:no-underline">
                  <span>Tints ({currentTints.length} colors)</span>
                </AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-normal text-muted-foreground mr-2">Steps:</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTintSteps(s => Math.max(1, s - 1))} disabled={tintSteps <= 1}>-</Button>
                    <Input type="number" value={tintSteps} onChange={(e) => setTintSteps(Math.max(1, Math.min(40, parseInt(e.target.value) || 1)))} className="w-20 h-10 text-center" min="1" max="40"/>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setTintSteps(s => Math.min(40, s + 1))} disabled={tintSteps >= 40}>+</Button>
                </div>
              </div>
              <AccordionContent className="p-6 pt-4 bg-card rounded-b-lg -mt-2">
                <ColorList colors={currentTints} title="" onSetActiveColor={setMainColor} onCopySuccess={handleCopySuccess} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="shades" className="border-none group">
              <div className="bg-card p-4 shadow-xl flex justify-between items-center">
                  <AccordionTrigger className="p-0 text-xl font-bold text-white flex-1 hover:no-underline">
                  <span>Shades ({currentShades.length} colors)</span>
                  </AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-normal text-muted-foreground mr-2">Steps:</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setShadeSteps(s => Math.max(1, s - 1))} disabled={shadeSteps <= 1}>-</Button>
                    <Input type="number" value={shadeSteps} onChange={(e) => setShadeSteps(Math.max(1, Math.min(40, parseInt(e.target.value) || 1)))} className="w-20 h-10 text-center" min="1" max="40"/>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setShadeSteps(s => Math.min(40, s + 1))} disabled={shadeSteps >= 40}>+</Button>
                </div>
              </div>
              <AccordionContent className="p-6 pt-4 bg-card rounded-b-lg -mt-2">
                <ColorList colors={currentShades} title="" onSetActiveColor={setMainColor} onCopySuccess={handleCopySuccess} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="tones" className="border-none group">
              <div className="bg-card p-4 shadow-xl flex justify-between items-center">
                  <AccordionTrigger className="p-0 text-xl font-bold text-white flex-1 hover:no-underline">
                  <span>Tones ({currentTones.length} colors)</span>
                  </AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-normal text-muted-foreground mr-2">Steps:</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setToneSteps(s => Math.max(1, s - 1))} disabled={toneSteps <= 1}>-</Button>
                    <Input type="number" value={toneSteps} onChange={(e) => setToneSteps(Math.max(1, Math.min(40, parseInt(e.target.value) || 1)))} className="w-20 h-10 text-center" min="1" max="40"/>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setToneSteps(s => Math.min(40, s + 1))} disabled={toneSteps >= 40}>+</Button>
                </div>
              </div>
              <AccordionContent className="p-6 pt-4 bg-card rounded-b-lg -mt-2">
                <ColorList colors={currentTones} title="" onSetActiveColor={setMainColor} onCopySuccess={handleCopySuccess} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <section className="bg-card p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4">Color Harmonies</h2>
          <div className="flex border-b border-gray-700 mb-4 overflow-x-auto pb-2">
            {['complementary', 'analogous', 'split-complementary', 'triad', 'square', 'rectangle'].map(harmony => (
              <button
                key={harmony}
                className={`py-2 px-4 text-sm font-medium capitalize flex-shrink-0 ${activeHarmonyType === harmony ? 'text-white border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveHarmonyType(harmony)}
              >
                {harmony.replace('-', ' ')}
              </button>
            ))}
          </div>
          <ColorList colors={currentHarmonyColors} title="" onSetActiveColor={setMainColor} onCopySuccess={handleCopySuccess} />
        </section>
      </div>
    </main>
  );
}
