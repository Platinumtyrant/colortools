"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { HSLColor } from 'react-color';
import { colord } from 'colord';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface ColorSlidersProps {
    hsl: HSLColor;
    onChange: (color: any) => void;
    title?: string;
}

export const ColorSliders = ({ hsl, onChange, title }: ColorSlidersProps) => {
    // The `hsl` prop is from react-color, with s and l as decimals (0-1).
    // Our sliders and colord work with percentages (0-100).
    const color = useMemo(() => colord(hsl).toHex(), [hsl]);
    const [inputValue, setInputValue] = useState(color);

    useEffect(() => {
        setInputValue(color);
    }, [color]);

    const handleHslChange = useCallback((key: 'h' | 's' | 'l', value: number) => {
        // The value from S/L sliders is 0-100. Convert to 0-1 for react-color.
        const newHsl = {
            ...hsl,
            [key]: key === 'h' ? value : value / 100,
            source: 'hsl',
        };
        onChange(newHsl);
    }, [hsl, onChange]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        if (colord(value).isValid()) {
            // react-color's onChange can handle a hex string.
            // This is the simplest way and avoids any HSL range confusion.
            onChange(colord(value).toHex());
        }
    }, [onChange]);

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
                <Slider value={[hsl.s * 100]} onValueChange={([v]) => handleHslChange('s', v)} max={100} step={1} />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs">Lightness</Label>
                <Slider value={[hsl.l * 100]} onValueChange={([v]) => handleHslChange('l', v)} max={100} step={1} />
            </div>
        </div>
    );
};
