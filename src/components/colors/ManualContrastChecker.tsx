
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WCAGDisplay } from './WCAGDisplay';
import { Label } from '../ui/label';

interface ManualContrastCheckerProps {
    colors: string[];
}

const ColorSelectItem = ({ color }: { color: string }) => (
    <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: color }} />
        <span className="font-mono">{color.toUpperCase()}</span>
    </div>
);

export const ManualContrastChecker = ({ colors }: ManualContrastCheckerProps) => {
    const [fgColor, setFgColor] = useState<string>(colors[0] || '#000000');
    const [bgColor, setBgColor] = useState<string>(colors[1] || '#ffffff');

    useEffect(() => {
        // Reset if colors change and selected colors are no longer valid
        if (!colors.includes(fgColor)) {
            setFgColor(colors[0] || '#000000');
        }
        if (!colors.includes(bgColor)) {
            setBgColor(colors.length > 1 ? colors[1] : '#ffffff');
        }
    }, [colors, fgColor, bgColor]);


    if (colors.length < 2) {
        return (
            <div className="text-center text-sm text-muted-foreground p-4">
                Add at least two colors to your palette to check contrast.
            </div>
        );
    }

    return (
        <Card className="bg-transparent border-0 shadow-none">
            <CardHeader className="p-0 mb-4">
                <CardTitle className="text-sm font-medium">Manual Checker</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label>Text Color</Label>
                        <Select value={fgColor} onValueChange={setFgColor}>
                            <SelectTrigger>
                                <SelectValue asChild>
                                    <ColorSelectItem color={fgColor} />
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {colors.map(color => (
                                    <SelectItem key={`fg-${color}`} value={color}>
                                       <ColorSelectItem color={color} />
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-1.5">
                        <Label>Background Color</Label>
                         <Select value={bgColor} onValueChange={setBgColor}>
                            <SelectTrigger>
                                <SelectValue asChild>
                                    <ColorSelectItem color={bgColor} />
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {colors.map(color => (
                                    <SelectItem key={`bg-${color}`} value={color}>
                                       <ColorSelectItem color={color} />
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div
                    className="p-4 rounded-lg text-center border-2 border-dashed"
                    style={{ backgroundColor: bgColor, color: fgColor }}
                >
                    <p className="font-bold text-lg">Aa</p>
                    <p>The quick brown fox jumps over the lazy dog.</p>
                </div>

                <WCAGDisplay textColor={fgColor} bgColor={bgColor} />

            </CardContent>
        </Card>
    );
};
