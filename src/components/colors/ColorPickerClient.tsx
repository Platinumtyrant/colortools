"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { CustomPicker, type HSLColor, type RGBColor, type ColorState, type HSVColor } from 'react-color';
import { Saturation, Hue } from 'react-color/lib/components/common';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { colord } from 'colord';
import { cn } from '@/lib/utils';
import { ColorSliders } from './ColorSliders';

// The type from @types/react-color's ColorState is missing hsv, so we extend it.
interface CustomPickerProps extends ColorState {
    hsv: HSVColor;
    // onChange is provided by the CustomPicker HOC
    onChange: (color: any) => void;
    className?: string;
}

const CustomColorPickerComponent: React.FC<CustomPickerProps> = ({ hex, hsl, rgb, hsv, onChange, className }) => {
    const [localHex, setLocalHex] = useState(hex);
    const [localRgb, setLocalRgb] = useState(rgb);

    useEffect(() => {
        setLocalHex(hex);
        setLocalRgb(rgb);
    }, [hex, rgb]);

    const handleHexChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newHex = e.target.value;
        setLocalHex(newHex);
        if (colord(newHex).isValid()) {
            onChange(newHex);
        }
    }, [onChange]);

    const handleRgbChange = useCallback((component: 'r' | 'g' | 'b', value: string) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 255) {
            const newRgb = { ...localRgb, [component]: numValue };
            setLocalRgb(newRgb);
            onChange(newRgb);
        } else if (value === '') {
             const newRgb = { ...localRgb, [component]: 0 };
             setLocalRgb(newRgb);
        }
    }, [localRgb, onChange]);

    const handleHslChange = (newHsl: HSLColor) => {
        onChange(newHsl);
    };
    
    return (
        <div className={cn(
            "w-full max-w-sm space-y-3 rounded-lg border bg-card p-4 text-card-foreground",
            className
        )}>
            <div className="flex h-40 gap-3">
                <div className="relative flex-1 cursor-pointer">
                    <Saturation hsl={hsl} hsv={hsv} onChange={onChange} />
                </div>
                <div className="relative w-5 cursor-pointer">
                    <Hue hsl={hsl} onChange={onChange} direction="vertical" />
                </div>
            </div>
            
            <div className="flex items-center gap-4 pt-2">
                <div className="h-10 w-10 flex-shrink-0 rounded-md border" style={{ backgroundColor: hex }}></div>
                <div className="flex-grow space-y-1">
                    <Label htmlFor="hex-input" className="text-xs font-normal text-muted-foreground">HEX</Label>
                    <Input id="hex-input" value={localHex.toUpperCase()} onChange={handleHexChange} className="h-8 font-mono text-sm" />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                    <Label htmlFor="r-input" className="text-xs font-normal text-muted-foreground">R</Label>
                    <Input id="r-input" type="number" min="0" max="255" value={localRgb.r} onChange={(e) => handleRgbChange('r', e.target.value)} className="h-8"/>
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="g-input" className="text-xs font-normal text-muted-foreground">G</Label>
                    <Input id="g-input" type="number" min="0" max="255" value={localRgb.g} onChange={(e) => handleRgbChange('g', e.target.value)} className="h-8"/>
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="b-input" className="text-xs font-normal text-muted-foreground">B</Label>
                    <Input id="b-input" type="number" min="0" max="255" value={localRgb.b} onChange={(e) => handleRgbChange('b', e.target.value)} className="h-8"/>
                </div>
            </div>

            <div className="pt-2">
                <ColorSliders hsl={hsl} onChange={handleHslChange} />
            </div>
        </div>
    );
};

export default CustomPicker(CustomColorPickerComponent as React.ComponentType<any>);
