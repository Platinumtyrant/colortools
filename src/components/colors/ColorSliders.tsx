"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { colord, type HslColor } from 'colord';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface ColorSlidersProps {
    hsl: HslColor;
    onChange: (color: any) => void;
    title?: string;
}

export const ColorSliders = ({ hsl, onChange, title }: ColorSlidersProps) => {
    const color = useMemo(() => colord(hsl).toHex(), [hsl]);
    const [inputValue, setInputValue] = useState(color);

    useEffect(() => {
        setInputValue(color);
    }, [color]);

    const handleHslChange = useCallback((key: 'h' | 's' | 'l', value: number) => {
        onChange({ ...hsl, [key]: value, source: 'hsl' });
    }, [hsl, onChange]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        if (colord(value).isValid()) {
            const newColor = colord(value);
            const newHsl = newColor.toHsl();
            
            // Preserve hue for black/white/gray colors
            if (newHsl.s === 0 || newHsl.l === 0 || newHsl.l === 100) {
                onChange({ h: hsl.h, s: newHsl.s, l: newHsl.l, source: 'hsl' });
            } else {
                onChange({...newHsl, source: 'hsl'});
            }
        }
    }, [hsl, onChange]);

    const handleInputBlur = useCallback(() => {
        if (!colord(inputValue).isValid()) {
            setInputValue(color);
        }
    }, [inputValue, color]);

    return (
        <div className="space-y-3">
            {title && <Label>{title}</Label>}
            <div className="flex items-center gap-4">
                 <div className="h-10 w-10 flex-shrink-0 rounded-md border" style={{ backgroundColor: color }} />
                 <Input
                    value={inputValue.toUpperCase()}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    className="flex-1 p-2 h-9 rounded-md bg-muted text-center font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>
            <div className="space-y-1.5 pt-2">
                <Label className="text-xs">Hue</Label>
                <Slider value={[hsl.h]} onValueChange={([v]) => handleHslChange('h', v)} max={360} step={1} />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">Saturation</Label>
                <Slider value={[hsl.s]} onValueChange={([v]) => handleHslChange('s', v)} max={100} step={1} />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">Lightness</Label>
                <Slider value={[hsl.l]} onValueChange={([v]) => handleHslChange('l', v)} max={100} step={1} />
            </div>
        </div>
    );
};
