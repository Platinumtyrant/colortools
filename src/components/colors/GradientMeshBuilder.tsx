
"use client";

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { SketchPicker, type ColorResult } from 'react-color';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2 } from 'lucide-react';
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
            { id: 1, x: 20, y: 20, color: '#ff8a80', spread: 50 },
            { id: 2, x: 80, y: 80, color: '#8c9eff', spread: 50 },
        ];
        if (!initialColors || initialColors.length === 0) {
            return defaultPoints;
        }
        const basePoints = [
            { x: 20, y: 20, spread: 50 },
            { x: 80, y: 80, spread: 50 },
            { x: 20, y: 80, spread: 50 },
            { x: 80, y: 20, spread: 50 },
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
    
    const [activePointId, setActivePointId] = useState<number | null>(null);
    const nextId = useRef(Math.max(...points.map(p => p.id), 0) + 1);
    const previewRef = useRef<HTMLDivElement>(null);
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
                x: Math.random() * 80 + 10,
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
            if (activePointId === idToRemove) {
                setActivePointId(null);
            }
            return prev.filter(p => p.id !== idToRemove);
        });
    }, [toast, activePointId]);
    
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, pointId: number, handleType: 'position' | 'spread') => {
        e.stopPropagation();
        setActivePointId(pointId);

        if (!previewRef.current) return;
        const rect = previewRef.current.getBoundingClientRect();
        
        const handleMouseMove = (moveEvent: MouseEvent) => {
            const currentPoint = points.find(p => p.id === pointId);
            if (!currentPoint) return;

            let newX = ((moveEvent.clientX - rect.left) / rect.width) * 100;
            let newY = ((moveEvent.clientY - rect.top) / rect.height) * 100;

            if (handleType === 'position') {
                newX = Math.max(0, Math.min(100, newX));
                newY = Math.max(0, Math.min(100, newY));
                handlePointChange(pointId, { x: newX, y: newY });
            } else if (handleType === 'spread') {
                const dx = newX - currentPoint.x;
                const dy = newY - currentPoint.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const newSpread = Math.max(5, Math.min(100, distance));
                handlePointChange(pointId, { spread: newSpread });
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [points]);
    
    const handleBackgroundClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            setActivePointId(null);
        }
    }, []);

    const gradientCss = useMemo(() => {
        const backgroundColor = points.length > 0 ? points[0].color : 'transparent';
        const backgroundImage = points.map(p => 
            `radial-gradient(at ${p.x.toFixed(1)}% ${p.y.toFixed(1)}%, ${p.color} 0px, transparent ${p.spread}%)`
        ).join(',\n    ');
        return `.your-element {\n  background-color: ${backgroundColor};\n  background-image: ${backgroundImage};\n}`;
    }, [points]);
    
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
                    <div className="relative w-full aspect-square rounded-lg border border-border overflow-hidden">
                        <div
                            ref={previewRef}
                            className="absolute inset-0 cursor-pointer"
                            style={backgroundStyle}
                            onClick={handleBackgroundClick}
                        >
                            {points.map((point) => {
                                const isActive = activePointId === point.id;
                                const previewWidth = previewRef.current?.offsetWidth || 0;
                                const spreadInPixels = (point.spread / 100) * previewWidth;

                                return (
                                    <React.Fragment key={point.id}>
                                        {isActive && (
                                            <>
                                                <div
                                                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/50 pointer-events-none"
                                                    style={{
                                                        left: `${point.x}%`,
                                                        top: `${point.y}%`,
                                                        width: `${spreadInPixels}px`,
                                                        height: `${spreadInPixels}px`,
                                                    }}
                                                />
                                                <div
                                                    className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/80 border-2 border-slate-700 shadow-lg cursor-grab active:cursor-grabbing"
                                                    style={{
                                                        left: `calc(${point.x}% + ${spreadInPixels / 2}px)`,
                                                        top: `${point.y}%`,
                                                    }}
                                                    onMouseDown={(e) => handleMouseDown(e, point.id, 'spread')}
                                                />
                                            </>
                                        )}
                                        <div
                                            className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/75 shadow-lg cursor-move"
                                            style={{
                                                left: `${point.x}%`,
                                                top: `${point.y}%`,
                                                backgroundColor: point.color,
                                                boxShadow: isActive ? '0 0 0 3px rgba(255, 255, 255, 0.9)' : '0 1px 3px rgba(0,0,0,0.5)',
                                                zIndex: isActive ? 10 : 1,
                                            }}
                                            onMouseDown={(e) => handleMouseDown(e, point.id, 'position')}
                                        />
                                    </React.Fragment>
                                );
                            })}
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
                            <CardDescription>Click a point to edit, or drag handles to adjust.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="flex justify-between items-center mb-4">
                                <Button onClick={handleAddPoint} disabled={points.length >= 6}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Point
                                </Button>
                                <span className="text-sm text-muted-foreground">{points.length} / 6 points</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                                {points.map((point, index) => (
                                    <Card key={point.id} className={`p-4 space-y-3 transition-shadow ${activePointId === point.id ? 'ring-2 ring-primary shadow-lg' : 'bg-card-foreground/5'}`}>
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
                                            <Label htmlFor={`spread-${point.id}`} className="text-xs">Spread: {point.spread.toFixed(0)}%</Label>
                                            <Slider
                                                id={`spread-${point.id}`}
                                                min={0} max={100} step={1} value={[point.spread]}
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
