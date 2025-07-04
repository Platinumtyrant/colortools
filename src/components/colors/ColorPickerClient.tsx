"use client";

import React from 'react';
import { CustomPicker, type HSLColor, type ColorState, type HSVColor } from 'react-color';
import { Saturation, Hue } from 'react-color/lib/components/common';
import { cn } from '@/lib/utils';
import { ColorSliders } from './ColorSliders';

// The type from @types/react-color's ColorState is missing hsv, so we extend it.
interface CustomPickerProps extends ColorState {
    hsv: HSVColor;
    // onChange is provided by the CustomPicker HOC
    onChange: (color: any) => void;
    className?: string;
}

const CustomColorPickerComponent: React.FC<CustomPickerProps> = ({ hsl, hsv, onChange, className }) => {
    
    const handleHslChange = (color: any) => {
        onChange(color);
    };
    
    return (
        <div className={cn(
            "w-full max-w-sm space-y-3 rounded-lg border bg-card p-4 text-card-foreground",
            className
        )}>
            <div className="relative h-40 space-y-3">
                <div className="relative h-[calc(100%-2.5rem)] cursor-pointer">
                    <Saturation hsl={hsl} hsv={hsv} onChange={onChange} />
                </div>
                <div className="relative h-5 cursor-pointer">
                    <Hue hsl={hsl} onChange={onChange} />
                </div>
            </div>

            <div>
                <ColorSliders hsl={hsl} onChange={handleHslChange} />
            </div>
        </div>
    );
};

export default CustomPicker(CustomColorPickerComponent as React.ComponentType<any>);
