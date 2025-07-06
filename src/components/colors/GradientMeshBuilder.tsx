
"use client";

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { SketchPicker, type ColorResult } from 'react-color';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, RotateCcw } from 'lucide-react';
import { colord } from 'colord';

interface Point {
  id: number;
  x: number;
  y: number;
  color: string;
  spread: number;
}

interface GradientMeshBuilderProps {
    initialColors?: string[];
}

export const GradientMeshBuilder = ({ initialColors }: GradientMeshBuilderProps) => {
    const [points, setPoints] = useState<Point[]>(() => {
        const defaultPoints = [
            { id: 1, x: 10, y: 10, color: '#ff8a80', spread: 50 },
            { id: 2, x: 90, y: 90, color: '#8c9eff', spread: 50 },
        ];
        if (!initialColors || initialColors.length === 0) {
            return defaultPoints;
        }
        const basePoints = [
            { x: 10, y: 10, spread: 50 },
            { x: 90, y: 90, spread: 50 },
            { x: 10, y: 90, spread: 50 },
            { x: 90, y: 10, spread: 50 },
            { x: 50, y: 50, spread: 50 },
            { x: 25, y: 75, spread: 50 },
        ];
        const newPoints = initialColors.slice(0, 6).map((color, index) => ({
            id: index + 1,
            color,
            ...basePoints[index % basePoints.length],
        }));

        if (newPoints.length === 1) {
            newPoints.push({
                id: 2,
                ...basePoints[1],
                color: colord(newPoints[0].color).isLight()
                    ? colord(newPoints[0].color).darken(0.3).toHex()
                    : colord(newPoints[0].color).lighten(0.3).toHex(),
            });
        }
        if (newPoints.length === 0) return defaultPoints;
        return newPoints;
    });
    
    const [rotation, setRotation] = useState(0);
    const nextId = useRef(Math.max(...points.map(p => p.id), 0) + 1);
    
    const previewRef = useRef<HTMLDivElement>(null);
    const draggingPointIdRef = useRef<number | null>(null);

    const { toast } = useToast();

    const handlePointChange = (id: number, newProps: Partial<Point>) => {
        setPoints(prev => prev.map(p => p.id === id ? { ...p, ...newProps } : p));
    };

    const handleAddPoint = useCallback(() => {
        setPoints(prev => {
            if (prev.length >= 6) {
                toast({ title: "Maximum of 6 points reached." });
                return prev;
            }
            const newPoint: Point = {
                id: nextId.current,
                x: Math.random() * 80 + 10, // Avoid edges
                y: Math.random() * 80 + 10,
                color: `hsl(${Math.random() * 360}, 80%, 70%)`,
                spread: 50,
            };
            nextId.current++;
            return [...prev, newPoint];
        });
    }, [toast]);

    const handleRemovePoint = useCallback((idToRemove: number) => {
        setPoints(prev => {
            if (prev.length <= 2) {
                toast({ title: "A minimum of 2 points is required." });
                return prev;
            }
            return prev.filter(p => p.id !== idToRemove);
        });
    }, [toast]);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!previewRef.current) return;
        const rect = previewRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;

        let closestPointId: number | null = null;
        let minDistance = Infinity;

        points.forEach(point => {
            const distance = Math.sqrt(Math.pow(point.x - xPercent, 2) + Math.pow(point.y - yPercent, 2));
            if (distance < 10) { // 10% tolerance for grabbing a point
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPointId = point.id;
                }
            }
        });
        
        if (closestPointId !== null) {
            draggingPointIdRef.current = closestPointId;
            
            const handleMouseMove = (moveEvent: MouseEvent) => {
                if (draggingPointIdRef.current === null || !previewRef.current) return;
                
                const moveRect = previewRef.current.getBoundingClientRect();
                let newX = ((moveEvent.clientX - moveRect.left) / moveRect.width) * 100;
                let newY = ((moveEvent.clientY - moveRect.top) / moveRect.height) * 100;
                
                newX = Math.max(0, Math.min(100, newX));
                newY = Math.max(0, Math.min(100, newY));

                handlePointChange(draggingPointIdRef.current, { x: newX, y: newY });
            };

            const handleMouseUp = () => {
                draggingPointIdRef.current = null;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
    }, [points]);

    const gradientCss = useMemo(() => {
        const backgroundColor = points.length > 0 ? points[0].color : 'transparent';
        const backgroundImage = points.map(p => 
            `radial-gradient(at ${p.x.toFixed(1)}% ${p.y.toFixed(1)}%, ${p.color} 0px, transparent ${p.spread}%)`
        ).join(',\n    ');
        return `.your-element {\n  background-color: ${backgroundColor};\n  background-image: ${backgroundImage};\n  transform: rotate(${rotation}deg);\n}`;
    }, [points, rotation]);
    
    const backgroundStyle = useMemo(() => {
        if (points.length === 0) return {};
        const backgroundColor = points[0].color;
        const backgroundImage = points.map(p => 
            `radial-gradient(at ${p.x.toFixed(1)}% ${p.y.toFixed(1)}%, ${p.color} 0px, transparent ${p.spread}%)`
        ).join(',');
        return { backgroundColor, backgroundImage };
    }, [points]);
    
    const handleCopyCss = () => {
        navigator.clipboard.writeText(gradientCss).then(() => {
            toast({ title: "CSS Copied!", description: "Gradient CSS has been copied to your clipboard." });
        }).catch(err => {
            console.error("Failed to copy CSS: ", err);
        });
    };

    return (
        <Card className="bg-transparent border-0 shadow-none w-full">
            <CardHeader className="p-0 mb-4">
                <CardTitle className="text-3xl">Gradient Mesh Builder</CardTitle>
                <CardDescription>Create beautiful, complex gradients by adding and manipulating color points.</CardDescription>
            </CardHeader>
            <CardContent className="grid lg:grid-cols-2 gap-8 p-0">
                <div className="lg:col-span-1 space-y-4">
                    <div className="relative w-full aspect-video rounded-lg border border-border overflow-hidden">
                        <div
                            className="absolute inset-0"
                            style={{ ...backgroundStyle, transform: `rotate(${rotation}deg)` }}
                        />
                        <div
                            ref={previewRef}
                            className="absolute inset-0 cursor-move"
                            onMouseDown={handleMouseDown}
                        >
                            {points.map((point) => (
                                <div
                                    key={point.id}
                                    className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/75 shadow-lg pointer-events-none"
                                    style={{
                                        left: `${point.x}%`,
                                        top: `${point.y}%`,
                                        backgroundColor: point.color,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="relative">
                        <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-xs">
                            <code>
                                {gradientCss}
                            </code>
                        </pre>
                        <Button onClick={handleCopyCss} size="sm" className="absolute top-2 right-2">Copy CSS</Button>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Controls</CardTitle>
                            <CardDescription>Add up to 6 points. Drag points on the preview.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="flex justify-between items-center mb-4">
                                <Button onClick={handleAddPoint} disabled={points.length >= 6}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Point
                                </Button>
                                <span className="text-sm text-muted-foreground">{points.length} / 6 points</span>
                            </div>
                            <div className="space-y-2 mb-4">
                                <Label htmlFor="rotation-slider" className="text-sm">Rotation: {rotation}°</Label>
                                <Slider
                                    id="rotation-slider"
                                    min={0}
                                    max={360}
                                    step={1}
                                    value={[rotation]}
                                    onValueChange={(value) => setRotation(value[0])}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                                {points.map((point, index) => (
                                    <Card key={point.id} className="p-4 space-y-3 bg-card-foreground/5">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button className="w-4 h-4 border" style={{ backgroundColor: point.color }} />
                                                    </PopoverTrigger>
                                                    <PopoverContent>
                                                        <SketchPicker
                                                            color={point.color}
                                                            onChangeComplete={(c: ColorResult) => handlePointChange(point.id, { color: c.hex })}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <h3 className="text-sm font-semibold">Point {index + 1}</h3>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemovePoint(point.id)} disabled={points.length <= 2}>
                                                <Trash2 className="h-3 w-3" />
                                                <span className="sr-only">Remove Point</span>
                                            </Button>
                                        </div>
                                        
                                        <div className="p-2 rounded-md bg-muted/50 border text-center font-mono text-xs">{point.color}</div>
                                        <div className="space-y-2">
                                            <Label htmlFor={`spread-${point.id}`} className="text-xs">Spread: {point.spread}%</Label>
                                            <Slider
                                                id={`spread-${point.id}`}
                                                min={0}
                                                max={100}
                                                step={1}
                                                value={[point.spread]}
                                                onValueChange={(value) => handlePointChange(point.id, { spread: value[0] })}
                                            />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
    );
};
