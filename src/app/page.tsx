
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
import { ImagePlaceholder } from '@/components/colors/ImagePlaceholder';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

export default function ColorPaletteBuilderPage() {
  const [mainColor, setMainColor] = useState('#DB073D');
  const [paletteColors, setPaletteColors] = useState(['#DB073D', '#DBA507', '#8EC7D2', '#0D6986', '#07485B']);
  
  const [activeTab, setActiveTab] = useState('palette-builder');
  const [activeSwatchTab, setActiveSwatchTab] = useState('green');
  const [activeHarmonyType, setActiveHarmonyType] = useState('complementary');
  const [variationSteps, setVariationSteps] = useState(5);
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
      const newColors = [...prevColors];
      if (newColors.length >= 10) {
        newColors.shift();
      }
      newColors.push(mainColor);
      return [...new Set(newColors)];
    });
    handleCopySuccess('Color added to palette!');
  }, [mainColor, handleCopySuccess]);

  const handleRemoveColorFromPalette = useCallback((colorToRemove: string) => {
    setPaletteColors(prevColors => prevColors.filter(color => color !== colorToRemove));
    handleCopySuccess('Color removed from palette!');
  }, [handleCopySuccess]);

  const currentTints = getTints(mainColor, variationSteps);
  const currentShades = getShades(mainColor, variationSteps);
  const currentTones = getTones(mainColor, variationSteps);
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

  const exportPaletteAsSvg = useCallback(() => {
    const svgWidth = 1200;
    const colorBlockWidth = 100;
    const colorBlockHeight = 50;
    const textHeight = 20;
    const padding = 20;
    const spacing = 10;

    let currentY = padding;

    const numMainColors = paletteColors.length;
    const numVariations = variationSteps + 1;
    const rowHeight = colorBlockHeight + textHeight + spacing;
    const variationRowHeight = colorBlockHeight + textHeight;

    const totalSvgHeight = currentY + Math.max(
      (colorBlockWidth + spacing) * numMainColors,
      (numMainColors > 0 ? (rowHeight) : 0) + 
      (numMainColors > 0 ? (numVariations * (variationRowHeight + spacing) * 3) : 0)
    ) + padding;

    let svgContent = `<svg width="${svgWidth}" height="${totalSvgHeight}" viewBox="0 0 ${svgWidth} ${totalSvgHeight}" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" style="background-color: #111;">`;

    let currentX = padding;
    const mainPaletteY = padding;
    const mainPaletteRowHeight = colorBlockHeight + textHeight;

    svgContent += `<text x="${padding}" y="${mainPaletteY + 15}" fill="#FFFFFF" font-size="20">Current Palette:</text>`;
    currentY = mainPaletteY + 30 + spacing;

    paletteColors.forEach((color, index) => {
      const xPos = currentX + index * (colorBlockWidth + spacing);
      svgContent += `<rect x="${xPos}" y="${currentY}" width="${colorBlockWidth}" height="${colorBlockHeight}" fill="${color}" rx="5" ry="5"/>`;
      svgContent += `<text x="${xPos + colorBlockWidth / 2}" y="${currentY + colorBlockHeight + 15}" fill="${colord(color).isLight() ? '#000000' : '#FFFFFF'}" font-size="12" text-anchor="middle">${color.toUpperCase()}</text>`;
    });

    currentY += mainPaletteRowHeight + spacing * 2;

    paletteColors.forEach((baseColor) => {
      const tints = getTints(baseColor, variationSteps);
      const shades = getShades(baseColor, variationSteps);
      const tones = getTones(baseColor, variationSteps);

      let columnX = padding + paletteColors.indexOf(baseColor) * (colorBlockWidth + spacing);
      let columnY = currentY;

      svgContent += `<text x="${columnX}" y="${columnY + 15}" fill="#CCCCCC" font-size="14">Tints:</text>`;
      columnY += 20 + 5;
      tints.forEach((tint, rowIndex) => {
        const yPos = columnY + rowIndex * (colorBlockHeight + textHeight + 5);
        svgContent += `<rect x="${columnX}" y="${yPos}" width="${colorBlockWidth}" height="${colorBlockHeight}" fill="${tint}" rx="3" ry="3"/>`;
        svgContent += `<text x="${columnX + colorBlockWidth / 2}" y="${yPos + colorBlockHeight + 12}" fill="${colord(tint).isLight() ? '#000000' : '#FFFFFF'}" font-size="10" text-anchor="middle">${tint.toUpperCase()}</text>`;
      });
      columnY += tints.length * (colorBlockHeight + textHeight + 5);

      columnY += spacing;
      svgContent += `<text x="${columnX}" y="${columnY + 15}" fill="#CCCCCC" font-size="14">Shades:</text>`;
      columnY += 20 + 5;
      shades.forEach((shade, rowIndex) => {
        const yPos = columnY + rowIndex * (colorBlockHeight + textHeight + 5);
        svgContent += `<rect x="${columnX}" y="${yPos}" width="${colorBlockWidth}" height="${colorBlockHeight}" fill="${shade}" rx="3" ry="3"/>`;
        svgContent += `<text x="${columnX + colorBlockWidth / 2}" y="${yPos + colorBlockHeight + 12}" fill="${colord(shade).isLight() ? '#000000' : '#FFFFFF'}" font-size="10" text-anchor="middle">${shade.toUpperCase()}</text>`;
      });
      columnY += shades.length * (colorBlockHeight + textHeight + 5);

      columnY += spacing;
      svgContent += `<text x="${columnX}" y="${columnY + 15}" fill="#CCCCCC" font-size="14">Tones:</text>`;
      columnY += 20 + 5;
      tones.forEach((tone, rowIndex) => {
        const yPos = columnY + rowIndex * (colorBlockHeight + textHeight + 5);
        svgContent += `<rect x="${columnX}" y="${yPos}" width="${colorBlockWidth}" height="${colorBlockHeight}" fill="${tone}" rx="3" ry="3"/>`;
        svgContent += `<text x="${columnX + colorBlockWidth / 2}" y="${yPos + colorBlockHeight + 12}" fill="${colord(tone).isLight() ? '#000000' : '#FFFFFF'}" font-size="10" text-anchor="middle">${tone.toUpperCase()}</text>`;
      });
    });

    svgContent += `</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'color_palette.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    handleCopySuccess('Palette exported as SVG!');
  }, [paletteColors, variationSteps, handleCopySuccess]);

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
      <div className="bg-card p-6 rounded-lg shadow-xl mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Current Palette</h2>
        <div
          className="w-full h-40 rounded-md mb-4 relative overflow-hidden group"
          style={{ backgroundColor: mainColor }}
        >
          <button
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"
            onClick={() => handleCopySuccess(`Active color copied: ${mainColor}`)}
          >
            Copy Active Color
          </button>
        </div>

        <div className="flex flex-wrap w-full rounded-md overflow-hidden mb-4">
          {paletteColors.map((color) => (
            <div
              key={color}
              className="relative flex h-12 cursor-pointer transition-transform duration-100 group"
              style={{ backgroundColor: color, flexBasis: `${100 / Math.min(paletteColors.length, 10)}%`, width: `${100 / Math.min(paletteColors.length, 10)}%` }}
              onClick={() => handlePaletteColorClick(color)}
              title={`Set ${color} as active`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveColorFromPalette(color);
                }}
                className="absolute top-0 right-0 bg-black bg-opacity-50 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove color"
              >
                X
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddColorToPalette}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors mb-4"
        >
          Add Current Color to Palette ({paletteColors.length}/10)
        </button>

        <div className="text-white text-sm mb-4">
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-400">HEX:</span>
            <span className="font-semibold text-left">{hex}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-400">RGB:</span>
            <span className="font-semibold text-left">{`${rgb.r}, ${rgb.g}, ${rgb.b}`}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-400">HSL:</span>
            <span className="font-semibold text-left">{`${hsl.h}, ${hsl.s}%, ${hsl.l}%`}</span>
          </div>
        </div>

        <button
          onClick={exportPaletteAsSvg}
          className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors"
        >
          Export Palette as SVG
        </button>
      </div>

      <div className="space-y-8">
        <div className="bg-card p-6 rounded-lg shadow-xl">
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
                    className="w-full h-12 cursor-pointer transition-transform duration-100 hover:scale-110 rounded-sm"
                    style={{ backgroundColor: color }}
                    onClick={() => setMainColor(color)}
                    title={`Set ${color} as active`}
                  ></div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'palette-builder' && (
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="w-full md:w-1/2 flex justify-center items-start">
                <div className="w-full max-w-[280px]">
                  <HexColorPicker color={mainColor} onChange={setMainColor} />
                </div>
              </div>
              <div className="w-full md:w-1/2 grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-400">HSL</label>
                  <div className="flex gap-2">
                    <input type="number" min="0" max="359" value={hsl.h} onChange={(e) => handleHslChange('h', parseInt(e.target.value))} className="w-1/3 p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="number" min="0" max="100" value={hsl.s} onChange={(e) => handleHslChange('s', parseInt(e.target.value))} className="w-1/3 p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="number" min="0" max="100" value={hsl.l} onChange={(e) => handleHslChange('l', parseInt(e.target.value))} className="w-1/3 p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-400">RGB</label>
                  <div className="flex gap-2">
                    <input type="number" min="0" max="255" value={rgb.r} onChange={(e) => handleRgbChange('r', parseInt(e.target.value))} className="w-1/3 p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="number" min="0" max="255" value={rgb.g} onChange={(e) => handleRgbChange('g', parseInt(e.target.value))} className="w-1/3 p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                    <input type="number" min="0" max="255" value={rgb.b} onChange={(e) => handleRgbChange('b', parseInt(e.target.value))} className="w-1/3 p-2 rounded-md bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-400">HEX</label>
                  <HexColorInput color={hex} onChange={handleHexChange} className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white uppercase focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="bg-card p-4 rounded-lg shadow-xl mb-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Variations</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Steps:</span>
                <Button variant={variationSteps === 5 ? 'secondary' : 'ghost'} size="sm" onClick={() => setVariationSteps(5)}>5</Button>
                <Button variant={variationSteps === 10 ? 'secondary' : 'ghost'} size="sm" onClick={() => setVariationSteps(10)}>10</Button>
              </div>
            </div>
          </div>
          <Accordion type="multiple" value={openVariations} onValueChange={setOpenVariations} className="w-full space-y-4">
            <AccordionItem value="tints" className="border-none">
              <AccordionTrigger className="bg-card p-4 rounded-lg shadow-xl text-xl font-bold text-white justify-between">
                Tints ({currentTints.length} colors)
              </AccordionTrigger>
              <AccordionContent className="p-6 pt-4 bg-card rounded-b-lg -mt-2">
                <ColorList colors={currentTints} title="" onSetActiveColor={setMainColor} onCopySuccess={handleCopySuccess} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="shades" className="border-none">
              <AccordionTrigger className="bg-card p-4 rounded-lg shadow-xl text-xl font-bold text-white justify-between">
                Shades ({currentShades.length} colors)
              </AccordionTrigger>
              <AccordionContent className="p-6 pt-4 bg-card rounded-b-lg -mt-2">
                <ColorList colors={currentShades} title="" onSetActiveColor={setMainColor} onCopySuccess={handleCopySuccess} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="tones" className="border-none">
              <AccordionTrigger className="bg-card p-4 rounded-lg shadow-xl text-xl font-bold text-white justify-between">
                Tones ({currentTones.length} colors)
              </AccordionTrigger>
              <AccordionContent className="p-6 pt-4 bg-card rounded-b-lg -mt-2">
                <ColorList colors={currentTones} title="" onSetActiveColor={setMainColor} onCopySuccess={handleCopySuccess} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <section className="bg-card p-6 rounded-lg shadow-xl">
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

        <section className="bg-card p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            Images
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <ImagePlaceholder width="200" height="150" text="Mountains" data-ai-hint="mountains" />
            <ImagePlaceholder width="200" height="150" text="Beach" data-ai-hint="beach" />
            <ImagePlaceholder width="200" height="150" text="Forest" data-ai-hint="forest" />
            <ImagePlaceholder width="200" height="150" text="City" data-ai-hint="city" />
            <ImagePlaceholder width="200" height="150" text="Desert" data-ai-hint="desert" />
            <ImagePlaceholder width="200" height="150" text="Winter" data-ai-hint="winter" />
          </div>
        </section>
      </div>
    </main>
  );

    