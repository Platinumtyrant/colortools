"use client";

import React from 'react';
import { CustomPicker, type ColorState, type HSVColor } from 'react-color';
import { cn } from '@/lib/utils';
import { ColorSliders } from './ColorSliders';

// The type from @types/react-color's ColorState is missing hsv, so we extend it.
interface CustomPickerProps extends ColorState {
    hsv: HSVColor;
    // onChange is provided by the CustomPicker HOC
    onChange: (color: any) => void;
    className?: string;
}

const CustomColorPickerComponent: React.FC<CustomPickerProps> = ({ hsl, onChange, className }) => {
    
    const handleHslChange = (color: any) => {
        onChange(color);
    };
    
    return (
        <div className={cn(
            "w-full max-w-sm space-y-3 rounded-lg border bg-card p-4 text-card-foreground",
            className
        )}>
            <div>
                <ColorSliders hsl={hsl} onChange={handleHslChange} />
            </div>
        </div>
    );
};

export default CustomPicker(CustomColorPickerComponent as React.ComponentType<any>);
