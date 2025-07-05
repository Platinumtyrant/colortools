
"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { HSLColor } from 'react-color';
import { colord } from 'colord';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Pipette } from 'lucide-react';

interface ColorSlidersProps {
    hsl: HSLColor;
    onChange: (color: any) => void;
    title?: string;
    onEyeDropperClick?: () => void;
}

export const ColorSliders = ({ hsl, onChange, title, onEyeDropperClick }: ColorSlidersProps) => {
    const color = useMemo(() => colord(hsl).toHex(), [hsl]);
    const [inputValue, setInputValue] = useState(color);

    useEffect(() => {
        setInputValue(color);
    }, [color]);

    const handleHslChange = useCallback((key: 'h' | 's' | 'l', value: number) => {
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
            onChange(value);
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
            <div className="flex items-center gap-2">
                <Input
                    value={inputValue.toUpperCase()}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    className="flex-1 p-2 h-9 rounded-md bg-muted text-center font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {onEyeDropperClick && (
                    <Button onClick={onEyeDropperClick} variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                        <Pipette className="h-4 w-4" />
                        <span className="sr-only">Pick from screen</span>
                    </Button>
                )}
            </div>
            <div className="space-y-4 pt-2">
                <div className="flex items-center gap-4">
                  <Label htmlFor="hue-slider" className="w-20 shrink-0 text-xs text-muted-foreground">
                    Hue
                  </Label>
                  <Slider
                    id="hue-slider"
                    value={[hsl.h]}
                    onValueChange={([v]) => handleHslChange('h', v)}
                    max={360}
                    step={1}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Label
                    htmlFor="saturation-slider"
                    className="w-20 shrink-0 text-xs text-muted-foreground"
                  >
                    Saturation
                  </Label>
                  <Slider
                    id="saturation-slider"
                    value={[hsl.s * 100]}
                    onValueChange={([v]) => handleHslChange('s', v)}
                    max={100}
                    step={1}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Label
                    htmlFor="lightness-slider"
                    className="w-20 shrink-0 text-xs text-muted-foreground"
                  >
                    Lightness
                  </Label>
                  <Slider
                    id="lightness-slider"
                    value={[hsl.l * 100]}
                    onValueChange={([v]) => handleHslChange('l', v)}
                    max={100}
                    step={1}
                  />
                </div>
            </div>
        </div>
    );
};
