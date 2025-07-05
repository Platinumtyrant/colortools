"use client";

import React from 'react';
import { colord } from 'colord';

interface HarmonyColorWheelProps {
    colors: string[];
    size?: number;
}

const HarmonyColorWheel = ({ colors, size = 150 }: HarmonyColorWheelProps) => {
    const radius = size / 2 - 10;
    const center = size / 2;

    const points = colors.map(color => {
        const hsl = colord(color).toHsl();
        // If saturation is 0 (a gray), place it in the center.
        if (hsl.s === 0) {
            return { x: center, y: center, hex: colord(color).toHex() };
        }
        const angle = hsl.h * (Math.PI / 180); // radians
        const r = (hsl.s / 100) * radius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return { x, y, hex: colord(color).toHex() };
    });

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={center} cy={center} r={radius} fill="hsl(var(--card))" stroke="hsl(var(--muted))" strokeWidth="1" />
            <circle cx={center} cy={center} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="1" />
            <circle cx={center} cy={center} r={radius / 2} fill="none" stroke="hsl(var(--muted))" strokeWidth="0.5" strokeDasharray="2 2" />

            {points.map((point, i) => (
                <circle
                    key={`${point.hex}-${i}`}
                    cx={point.x}
                    cy={point.y}
                    r="6"
                    fill={point.hex}
                    stroke="hsl(var(--background))"
                    strokeWidth="2"
                />
            ))}
        </svg>
    );
};

export default HarmonyColorWheel;
