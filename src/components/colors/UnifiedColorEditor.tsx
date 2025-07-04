
"use client";

import React, { useMemo } from 'react';
import { colord } from 'colord';
import { Saturation, Hue, HexColorInput } from 'react-colorful';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface UnifiedColorEditorProps {
    color: string;
    onChange: (newHex: string) => void;
}

export function UnifiedColorEditor({ color, onChange }: UnifiedColorEditorProps) {
    const hsv = useMemo(() => colord(color).toHsv(), [color]);
    const rgb = useMemo(() => colord(color).toRgb(), [color]);
    const hsl = useMemo(() => colord(color).toHsl(), [color]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Color Editor</CardTitle>
                <CardDescription>Click a color in the palette above to edit it.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/2 flex flex-col gap-4">
                   <div className="w-full space-y-3">
                        <Saturation
                            hsv={hsv}
                            onChange={(newSV) => onChange(colord({ ...hsv, ...newSV }).toHex())}
                            className="w-full aspect-video rounded-lg border-border border cursor-pointer"
                        />
                        <Hue
                            hue={hsv.h}
                            onChange={(newHue) => onChange(colord({ ...hsv, h: newHue }).toHex())}
                            className="w-full h-4 rounded-lg border-border border cursor-pointer"
                        />
                    </div>
                </div>
                <div className="w-full md:w-1/2 flex flex-col gap-4">
                     <div className="flex items-center gap-4">
                        <Label htmlFor="hex-input" className="w-10 text-muted-foreground text-right">HEX</Label>
                        <HexColorInput id="hex-input" color={color} onChange={onChange} className={cn("flex-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", "uppercase")} />
                    </div>
                     <div className="flex items-center gap-4">
                        <Label htmlFor="rgb-r" className="w-10 text-muted-foreground text-right">RGB</Label>
                        <div className="flex flex-1 gap-2">
                            <Input id="rgb-r" type="number" min="0" max="255" value={rgb.r} onChange={(e) => onChange(colord({...rgb, r: +e.target.value}).toHex())} className="w-1/3" aria-label="Red" />
                            <Input type="number" min="0" max="255" value={rgb.g} onChange={(e) => onChange(colord({...rgb, g: +e.target.value}).toHex())} className="w-1/3" aria-label="Green" />
                            <Input type="number" min="0" max="255" value={rgb.b} onChange={(e) => onChange(colord({...rgb, b: +e.target.value}).toHex())} className="w-1/3" aria-label="Blue" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Label htmlFor="hsl-h" className="w-10 text-muted-foreground text-right">HSL</Label>
                        <div className="flex flex-1 gap-2">
                            <Input id="hsl-h" type="number" min="0" max="359" value={hsl.h} onChange={(e) => onChange(colord({...hsl, h: +e.target.value}).toHex())} className="w-1/3" aria-label="Hue" />
                            <Input type="number" min="0" max="100" value={hsl.s} onChange={(e) => onChange(colord({...hsl, s: +e.target.value}).toHex())} className="w-1/3" aria-label="Saturation" />
                            <Input type="number" min="0" max="100" value={hsl.l} onChange={(e) => onChange(colord({...hsl, l: +e.target.value}).toHex())} className="w-1/3" aria-label="Lightness" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
