"use client";

import React, { useState, useMemo } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

const MeshPointControl = ({ 
    color, 
    setColor, 
    spread,
    setSpread,
    label 
}: { 
    color: string, 
    setColor: (color: string) => void, 
    spread: number,
    setSpread: (spread: number) => void,
    label: string 
}) => {
    const id = label.toLowerCase().replace(' ', '-');
    return (
        <div className="space-y-4">
            <div className="space-y-2 flex flex-col items-center">
                <h3 className="text-sm font-medium text-gray-400">{label}</h3>
                <div className="w-full">
                    <HexColorPicker color={color} onChange={setColor} />
                </div>
                <div className="p-2 rounded-md bg-gray-700 border border-gray-600 text-white w-full text-center font-mono">{color}</div>
            </div>
             <div className="space-y-2">
                <Label htmlFor={`spread-${id}`} className="text-sm font-medium text-gray-400">Spread: {spread}%</Label>
                <Slider
                    id={`spread-${id}`}
                    min={0}
                    max={100}
                    step={1}
                    value={[spread]}
                    onValueChange={(value) => setSpread(value[0])}
                />
            </div>
        </div>
    )
}

export const GradientMeshBuilder = () => {
    const [colors, setColors] = useState({
        topLeft: '#ff8a80',
        topRight: '#8c9eff',
        bottomLeft: '#80d8ff',
        bottomRight: '#a7ffeb',
    });
    const [spreads, setSpreads] = useState({
        topLeft: 50,
        topRight: 50,
        bottomLeft: 50,
        bottomRight: 50,
    });
    const { toast } = useToast();

    const handleColorChange = (corner: keyof typeof colors, color: string) => {
        setColors(prev => ({ ...prev, [corner]: color }));
    };

    const handleSpreadChange = (corner: keyof typeof spreads, value: number) => {
        setSpreads(prev => ({ ...prev, [corner]: value }));
    };

    const gradientCss = useMemo(() => {
        return `background-color: ${colors.topLeft};
background-image: 
    radial-gradient(at 0% 0%, ${colors.topLeft} 0px, transparent ${spreads.topLeft}%),
    radial-gradient(at 100% 0%, ${colors.topRight} 0px, transparent ${spreads.topRight}%),
    radial-gradient(at 0% 100%, ${colors.bottomLeft} 0px, transparent ${spreads.bottomLeft}%),
    radial-gradient(at 100% 100%, ${colors.bottomRight} 0px, transparent ${spreads.bottomRight}%);`;
    }, [colors, spreads]);

    const handleCopyCss = () => {
        navigator.clipboard.writeText(gradientCss).then(() => {
            toast({ title: "CSS Copied!", description: "Gradient CSS has been copied to your clipboard." });
        }).catch(err => {
            console.error("Failed to copy CSS: ", err);
        });
    };

    return (
        <Card className="bg-card/50 p-6 rounded-lg shadow-xl">
            <CardHeader className="p-0 mb-6">
                <CardTitle className="text-white">Gradient Mesh Builder</CardTitle>
                <CardDescription>Create beautiful, complex gradients with four color points.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8 p-0">
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-white">Controls</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <MeshPointControl 
                            label="Top Left" 
                            color={colors.topLeft} 
                            setColor={(c) => handleColorChange('topLeft', c)}
                            spread={spreads.topLeft}
                            setSpread={(v) => handleSpreadChange('topLeft', v)}
                        />
                        <MeshPointControl 
                            label="Top Right" 
                            color={colors.topRight} 
                            setColor={(c) => handleColorChange('topRight', c)}
                            spread={spreads.topRight}
                            setSpread={(v) => handleSpreadChange('topRight', v)}
                        />
                        <MeshPointControl 
                            label="Bottom Left" 
                            color={colors.bottomLeft} 
                            setColor={(c) => handleColorChange('bottomLeft', c)}
                            spread={spreads.bottomLeft}
                            setSpread={(v) => handleSpreadChange('bottomLeft', v)}
                        />
                        <MeshPointControl 
                            label="Bottom Right" 
                            color={colors.bottomRight} 
                            setColor={(c) => handleColorChange('bottomRight', c)}
                            spread={spreads.bottomRight}
                            setSpread={(v) => handleSpreadChange('bottomRight', v)}
                        />
                    </div>
                </div>
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-white">Preview & Code</h2>
                    <div
                        className="w-full h-64 rounded-lg border border-border"
                        style={{
                            backgroundColor: colors.topLeft,
                            backgroundImage: `
                                radial-gradient(at 0% 0%, ${colors.topLeft} 0px, transparent ${spreads.topLeft}%),
                                radial-gradient(at 100% 0%, ${colors.topRight} 0px, transparent ${spreads.topRight}%),
                                radial-gradient(at 0% 100%, ${colors.bottomLeft} 0px, transparent ${spreads.bottomLeft}%),
                                radial-gradient(at 100% 100%, ${colors.bottomRight} 0px, transparent ${spreads.bottomRight}%)
                            `,
                        }}
                    />
                    <div className="relative">
                        <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-xs">
                            <code>
                                {gradientCss}
                            </code>
                        </pre>
                        <Button onClick={handleCopyCss} size="sm" className="absolute top-2 right-2">Copy CSS</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
