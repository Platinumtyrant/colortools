"use client";

import React from 'react';
import type { HsvColor } from 'colord';
import { Saturation, Hue } from 'react-colorful';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { colord } from 'colord';

interface ColorPickerClientProps {
    mainColor: string;
    previousColor: string;
    hsv: HsvColor;
    paletteColors: string[];
    rgb: { r: number; g: number; b: number };
    hsl: { h: number; s: number; l: number };
    hex: string;
    updateColor: (newColor: string | HsvColor) => void;
    handleAddCurrentColorToPalette: () => void;
    handleSaveToLibrary: () => void;
    handleHexChange: (value: string) => void;
    handleValueChange: (model: 'rgb' | 'hsl', key: 'r' | 'g' | 'b' | 'h' | 's' | 'l', value: string) => void;
}

export default function ColorPickerClient({
    mainColor,
    previousColor,
    hsv,
    paletteColors,
    rgb,
    hsl,
    hex,
    updateColor,
    handleAddCurrentColorToPalette,
    handleSaveToLibrary,
    handleHexChange,
    handleValueChange,
}: ColorPickerClientProps) {
    return (
        <Card className="w-full max-w-3xl bg-gray-300 shadow-md border-gray-400 border">
            <CardHeader className="p-2 border-b border-gray-400">
                <CardTitle className="text-center text-sm font-sans font-normal text-black">Color Picker</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-wrap gap-4">
                <div className="flex gap-2 flex-grow-[2] min-w-[280px]">
                    <div className="w-full">
                        <Saturation
                            hsv={hsv}
                            onChange={updateColor}
                            className="w-full h-52 sm:h-64 rounded-none border border-gray-500"
                        />
                    </div>
                    <div className="w-6">
                        <Hue
                            hue={hsv.h}
                            onChange={(newHue) => updateColor({ ...hsv, h: newHue })}
                            direction="vertical"
                            className="h-52 sm:h-64 rounded-none border border-gray-500"
                        />
                    </div>
                </div>

                <div className="flex-1 min-w-[200px] flex flex-col items-center gap-3">
                    <div className="flex items-start gap-4 w-full">
                        <div className="text-center">
                            <p className="text-xs text-black">new</p>
                            <div className="w-16 h-16 border-2 border-gray-500 bg-white">
                                <div style={{ backgroundColor: mainColor }} className="h-1/2 w-full" />
                                <div style={{ backgroundColor: previousColor }} className="h-1/2 w-full" />
                            </div>
                            <p className="text-xs text-black">current</p>
                        </div>

                        <div className="w-full space-y-2">
                            <Button onClick={handleAddCurrentColorToPalette} className="w-full bg-red-600 hover:bg-red-700 text-white rounded-sm text-xs h-8">
                                Add to Palette ({paletteColors.length}/20)
                            </Button>
                            <Button onClick={handleSaveToLibrary} variant="secondary" className="w-full bg-gray-200 hover:bg-gray-100 border-gray-500 border text-black rounded-sm text-xs h-8">
                                Save to Library
                            </Button>
                            <Input
                                value={hex.replace('#', '').toUpperCase()}
                                onChange={(e) => handleHexChange(e.target.value)}
                                className="w-full text-center font-mono text-sm rounded-sm h-8 bg-white border-gray-500"
                                maxLength={6}
                            />
                        </div>
                    </div>

                    <div className="w-full h-10 border border-gray-500 rounded-sm bg-white p-1 flex items-center justify-center">
                        {paletteColors.length === 0 ?
                            <span className="text-xs text-gray-500">Add colors to start...</span> :
                            paletteColors.map((color) => (
                                <div
                                    key={color}
                                    className="h-full cursor-pointer"
                                    style={{ backgroundColor: color, flex: 1 }}
                                    onClick={() => updateColor(color)}
                                    title={`Set ${color} as active`}
                                />
                            ))
                        }
                    </div>

                    <div className="grid grid-cols-3 gap-1 w-full">
                        <Input value={rgb.r} onChange={(e) => handleValueChange('rgb', 'r', e.target.value)} className="w-full text-center font-mono text-xs rounded-sm h-7 bg-white border-gray-500" maxLength={3} />
                        <Input value={rgb.g} onChange={(e) => handleValueChange('rgb', 'g', e.target.value)} className="w-full text-center font-mono text-xs rounded-sm h-7 bg-white border-gray-500" maxLength={3} />
                        <Input value={rgb.b} onChange={(e) => handleValueChange('rgb', 'b', e.target.value)} className="w-full text-center font-mono text-xs rounded-sm h-7 bg-white border-gray-500" maxLength={3} />
                        
                        <Input value={hsl.h} onChange={(e) => handleValueChange('hsl', 'h', e.target.value)} className="w-full text-center font-mono text-xs rounded-sm h-7 bg-white border-gray-500" maxLength={3} />
                        <Input value={hsl.s} onChange={(e) => handleValueChange('hsl', 's', e.target.value)} className="w-full text-center font-mono text-xs rounded-sm h-7 bg-white border-gray-500" maxLength={3} />
                        <Input value={hsl.l} onChange={(e) => handleValueChange('hsl', 'l', e.target.value)} className="w-full text-center font-mono text-xs rounded-sm h-7 bg-white border-gray-500" maxLength={3} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
