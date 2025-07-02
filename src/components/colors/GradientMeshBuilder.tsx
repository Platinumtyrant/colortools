"use client";

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type PointName = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

interface Point {
  x: number;
  y: number;
  color: string;
  spread: number;
}

const pointLabels: Record<PointName, string> = {
  topLeft: 'Top Left',
  topRight: 'Top Right',
  bottomLeft: 'Bottom Left',
  bottomRight: 'Bottom Right',
};

export const GradientMeshBuilder = () => {
    const [points, setPoints] = useState<Record<PointName, Point>>({
        topLeft: { x: 0, y: 0, color: '#ff8a80', spread: 50 },
        topRight: { x: 100, y: 0, color: '#8c9eff', spread: 50 },
        bottomLeft: { x: 0, y: 100, color: '#80d8ff', spread: 50 },
        bottomRight: { x: 100, y: 100, color: '#a7ffeb', spread: 50 },
    });
    
    const previewRef = useRef<HTMLDivElement>(null);
    const draggingPointRef = useRef<PointName | null>(null);

    const { toast } = useToast();

    const handlePointChange = (name: PointName, newProps: Partial<Point>) => {
        setPoints(prev => ({
            ...prev,
            [name]: { ...prev[name], ...newProps }
        }));
    };

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!previewRef.current) return;
        const rect = previewRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;

        let closestPoint: PointName | null = null;
        let minDistance = Infinity;

        for (const name in points) {
            const point = points[name as PointName];
            const distance = Math.sqrt(Math.pow(point.x - xPercent, 2) + Math.pow(point.y - yPercent, 2));
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = name as PointName;
            }
        }
        
        if (closestPoint && minDistance < 10) {
            draggingPointRef.current = closestPoint;
            
            const handleMouseMove = (moveEvent: MouseEvent) => {
                if (!draggingPointRef.current || !previewRef.current) return;
                
                const moveRect = previewRef.current.getBoundingClientRect();
                let newX = ((moveEvent.clientX - moveRect.left) / moveRect.width) * 100;
                let newY = ((moveEvent.clientY - moveRect.top) / moveRect.height) * 100;
                
                newX = Math.max(0, Math.min(100, newX));
                newY = Math.max(0, Math.min(100, newY));

                setPoints(prev => ({
                    ...prev,
                    [draggingPointRef.current!]: { ...prev[draggingPointRef.current!], x: newX, y: newY }
                }));
            };

            const handleMouseUp = () => {
                draggingPointRef.current = null;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
    }, [points]);

    const gradientCss = useMemo(() => {
        return (Object.keys(points) as PointName[]).map(name => 
            `radial-gradient(at ${points[name].x.toFixed(1)}% ${points[name].y.toFixed(1)}%, ${points[name].color} 0px, transparent ${points[name].spread}%)`
        ).join(',\n    ');
    }, [points]);
    
    const backgroundStyle = useMemo(() => ({
        backgroundColor: points.topLeft.color,
        backgroundImage: gradientCss,
    }), [points.topLeft.color, gradientCss]);
    
    const handleCopyCss = () => {
        const cssToCopy = `background-color: ${points.topLeft.color};\nbackground-image: ${gradientCss};`;
        navigator.clipboard.writeText(cssToCopy).then(() => {
            toast({ title: "CSS Copied!", description: "Gradient CSS has been copied to your clipboard." });
        }).catch(err => {
            console.error("Failed to copy CSS: ", err);
        });
    };

    return (
        <Card className="bg-card/50 p-6 rounded-lg shadow-xl w-full">
            <CardHeader className="p-0 mb-6">
                <CardTitle className="text-white">Gradient Mesh Builder</CardTitle>
                <CardDescription>Click and drag points on the preview to position the gradients. Use the controls to change colors and spread.</CardDescription>
            </CardHeader>
            <CardContent className="grid lg:grid-cols-3 gap-8 p-0">
                <div className="lg:col-span-2 space-y-4">
                    <div
                        ref={previewRef}
                        className="relative w-full aspect-video rounded-lg border border-border cursor-move"
                        style={backgroundStyle}
                        onMouseDown={handleMouseDown}
                    >
                        {(Object.keys(points) as PointName[]).map((name) => (
                            <div
                                key={name}
                                className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white/75 shadow-lg pointer-events-none"
                                style={{
                                    left: `${points[name].x}%`,
                                    top: `${points[name].y}%`,
                                    backgroundColor: points[name].color,
                                }}
                            />
                        ))}
                    </div>
                    <div className="relative">
                        <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-xs">
                            <code>
                                {`background-color: ${points.topLeft.color};\nbackground-image: \n    ${gradientCss};`}
                            </code>
                        </pre>
                        <Button onClick={handleCopyCss} size="sm" className="absolute top-2 right-2">Copy CSS</Button>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-lg font-semibold text-white">Controls</h2>
                    <Accordion type="single" collapsible defaultValue="topLeft" className="w-full">
                        {(Object.keys(points) as PointName[]).map(name => (
                            <AccordionItem value={name} key={name}>
                                <AccordionTrigger>{pointLabels[name]}</AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-4">
                                    <div className="flex justify-center">
                                      <HexColorPicker color={points[name].color} onChange={(c) => handlePointChange(name, { color: c })} />
                                    </div>
                                    <div className="p-2 rounded-md bg-gray-700 border border-gray-600 text-white w-full text-center font-mono">{points[name].color}</div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`spread-${name}`}>Spread: {points[name].spread}%</Label>
                                        <Slider
                                            id={`spread-${name}`}
                                            min={0}
                                            max={100}
                                            step={1}
                                            value={[points[name].spread]}
                                            onValueChange={(value) => handlePointChange(name, { spread: value[0] })}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </CardContent>
        </Card>
    );
};
