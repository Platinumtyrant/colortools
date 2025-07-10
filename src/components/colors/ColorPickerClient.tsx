"use client";

import React from 'react';
import { CustomPicker, type ColorState, type HSVColor, type ColorResult } from 'react-color';
import { Saturation, Hue } from 'react-color/lib/components/common';
import type { HuePointerProps } from 'react-color/lib/components/common/Hue'; // Corrected import for pointer props
import { cn } from '@/lib/utils';
import { ColorSliders } from './ColorSliders';

// The type from @types/react-color's ColorState is missing hsv, so we extend it.
interface CustomPickerProps extends ColorState {
    hsv: HSVColor;
    // onChange is provided by the CustomPicker HOC
    onChange: (color: ColorResult) => void; // Corrected: parameter type from any to ColorResult
    className?: string;
    onEyeDropperClick?: () => void;
}

const CustomHuePointer = () => {
    // This component's style is designed to mimic the shadcn/ui slider thumb.
    // The Hue component from react-color wraps this in a div with `position: absolute`.
    // The transform is used to center the thumb horizontally on the hue bar.
    return (
        <div
            className="h-5 w-5 rounded-full border-2 border-primary bg-background shadow-lg"
            style={{ transform: 'translateX(-50%)' }}
        />
    );
};

const CustomColorPickerComponent: React.FC<CustomPickerProps> = ({ hsl, hsv, onChange, className, onEyeDropperClick }) => {
    
    const handleHslChange = (color: ColorResult) => { // Corrected: parameter type from any to ColorResult
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
                <Hue hsl={hsl} onChange={onChange} pointer={CustomHuePointer as React.ComponentType<HuePointerProps>} /> {/* Corrected: type cast for pointer */}
            </div>
            <div>
                <ColorSliders hsl={hsl} onChange={handleHslChange} onEyeDropperClick={onEyeDropperClick} />
            </div>
        </div>
    );
};

export default CustomPicker(CustomColorPickerComponent as React.ComponentType<CustomPickerProps>); // Corrected: type cast for CustomPicker
