
"use client";

import React from 'react';
import { CustomPicker, type ColorState, type HSVColor } from 'react-color';
import { Saturation, Hue } from 'react-color/lib/components/common';
import { cn } from '@/lib/utils';
import { ColorSliders } from './ColorSliders';

// The type from @types/react-color's ColorState is missing hsv, so we extend it.
interface CustomPickerProps extends ColorState {
    hsv: HSVColor;
    // onChange is provided by the CustomPicker HOC
    onChange: (color: any) => void;
    className?: string;
    onEyeDropperClick?: () => void;
}

const CustomColorPickerComponent: React.FC<CustomPickerProps> = ({ hsl, hsv, onChange, className, onEyeDropperClick }) => {
    
    const handleHslChange = (color: any) => {
        onChange(color);
    };
    
    return (
        <div className={cn(
            "w-full max-w-sm space-y-3 rounded-lg border bg-card p-4 text-card-foreground",
            className
        )}>
             <div className="relative h-40 w-full">
                <Saturation hsl={hsl} hsv={hsv} onChange={onChange} />
            </div>
            <div className="relative h-5 w-full">
                <Hue hsl={hsl} onChange={onChange} />
            </div>
            <div>
                <ColorSliders hsl={hsl} onChange={handleHslChange} onEyeDropperClick={onEyeDropperClick} />
            </div>
        </div>
    );
};

export default CustomPicker(CustomColorPickerComponent as React.ComponentType<any>);
