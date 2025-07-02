
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Trash2, Download } from 'lucide-react';
import { colord } from 'colord';
import { getTints, getShades, getTones } from '@/lib/colors';

type Palette = string[];

export default function LibraryPage() {
  const [savedPalettes, setSavedPalettes] = useState<Palette[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const savedPalettesJSON = localStorage.getItem('saved_palettes');
    if (savedPalettesJSON) {
      setSavedPalettes(JSON.parse(savedPalettesJSON));
    }
  }, []);

  const handleDeletePalette = useCallback((indexToDelete: number) => {
    const newPalettes = savedPalettes.filter((_, index) => index !== indexToDelete);
    setSavedPalettes(newPalettes);
    localStorage.setItem('saved_palettes', JSON.stringify(newPalettes));
    toast({ title: "Palette Deleted" });
  }, [savedPalettes, toast]);

  const exportPaletteAsSvg = useCallback((palette: Palette) => {
    const variationSteps = 5;
    const svgWidth = 1200;
    const colorBlockWidth = 100;
    const colorBlockHeight = 50;
    const textHeight = 20;
    const padding = 20;
    const spacing = 10;

    let currentY = padding;

    const numMainColors = palette.length;
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

    palette.forEach((color, index) => {
      const xPos = currentX + index * (colorBlockWidth + spacing);
      svgContent += `<rect x="${xPos}" y="${currentY}" width="${colorBlockWidth}" height="${colorBlockHeight}" fill="${color}" rx="5" ry="5"/>`;
      svgContent += `<text x="${xPos + colorBlockWidth / 2}" y="${currentY + colorBlockHeight + 15}" fill="${colord(color).isLight() ? '#000000' : '#FFFFFF'}" font-size="12" text-anchor="middle">${color.toUpperCase()}</text>`;
    });

    currentY += mainPaletteRowHeight + spacing * 2;

    palette.forEach((baseColor) => {
      const tints = getTints(baseColor, variationSteps);
      const shades = getShades(baseColor, variationSteps);
      const tones = getTones(baseColor, variationSteps);

      let columnX = padding + palette.indexOf(baseColor) * (colorBlockWidth + spacing);
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

    toast({ title: "Palette Exported as SVG!" });
  }, [toast]);

  return (
    <main className="w-full max-w-7xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Palette Library</h1>
      {savedPalettes.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
            <h3 className="text-xl font-medium">Your Library is Empty</h3>
            <p className="text-muted-foreground mt-2">Go to the Palette Builder to create and save your first palette.</p>
        </div>
      ) : (
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
          {savedPalettes.map((palette, index) => (
            <Card key={index} className="overflow-hidden bg-card">
              <CardContent className="p-0">
                <div className="flex h-32">
                  {palette.map((color) => (
                    <div
                      key={color}
                      className="flex-1"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="grid p-4 gap-2" style={{ gridTemplateColumns: `repeat(${palette.length}, 1fr)` }}>
                  {palette.map((color) => (
                    <div key={color} className="text-center font-mono text-xs text-muted-foreground">
                      {color.toUpperCase()}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="justify-end gap-2 p-4 pt-0 bg-card">
                <Button variant="ghost" size="icon" onClick={() => handleDeletePalette(index)} title="Delete Palette">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button onClick={() => exportPaletteAsSvg(palette)}>
                  <Download className="mr-2 h-4 w-4" />
                  Export as SVG
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
