
"use client";

import React, { useState, useMemo, useRef, useCallback } from 'react';
import type { ColorResult } from 'react-color';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2 } from 'lucide-react';
import { colord } from 'colord';
import ColorPickerClient from '@/components/colors/ColorPickerClient';

interface Point {
  id: number;
  x: number;
  y: number;
  color: string;
  spreadX: number;
  spreadY: number;
}

interface GradientMeshBuilderProps {
    initialColors?: string[];
}

export const GradientMeshBuilder = ({ initialColors }: GradientMeshBuilderProps) => {
    const [points, setPoints] = useState<Point[]>(() => {
        const defaultPoints = [
            { id: 1, x: 20, y: 20, color: '#ff8a80', spreadX: 50, spreadY: 50 },
            { id: 2, x: 80, y: 80, color: '#8c9eff', spreadX: 50, spreadY: 50 },
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

        const newPoints = initialColors.slice(0, 6).map((color, index) => {
            const base = basePoints[index % basePoints.length];
            return {
                id: index + 1,
                color,
                x: base.x,
                y: base.y,
                spreadX: base.spread,
                spreadY: base.spread,
            };
        });

        if (newPoints.length === 1) {
            newPoints.push({
                id: 2,
                x: basePoints[1].x,
                y: basePoints[1].y,
                color: colord(newPoints[0].color).isLight()
                    ? colord(newPoints[0].color).darken(0.3).toHex()
                    : colord(newPoints[0].color).lighten(0.3).toHex(),
                spreadX: basePoints[1].spread,
                spreadY: basePoints[1].spread,
            });
        }
        if (newPoints.length === 0) return defaultPoints;
        return newPoints;
    });
    
    const [activePointId, setActivePointId] = useState<number | null>(null);
    const nextId = useRef(Math.max(...points.map(p => p.id), 0) + 1);
    const previewRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

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
                spreadX: 50,
                spreadY: 50,
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
    
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, pointId: number, handleType: 'position' | 'spreadX' | 'spreadY') => {
        e.preventDefault();
        e.stopPropagation();
        setActivePointId(pointId);

        if (!previewRef.current) return;
        const rect = previewRef.current.getBoundingClientRect();

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const newX = ((moveEvent.clientX - rect.left) / rect.width) * 100;
            const newY = ((moveEvent.clientY - rect.top) / rect.height) * 100;
            
            setPoints(currentPoints => {
                const pointToUpdate = currentPoints.find(p => p.id === pointId);
                if (!pointToUpdate) return currentPoints;

                let newProps: Partial<Point> = {};

                if (handleType === 'position') {
                    newProps.x = Math.max(0, Math.min(100, newX));
                    newProps.y = Math.max(0, Math.min(100, newY));
                } else if (handleType === 'spreadX') {
                    const dx = newX - pointToUpdate.x;
                    newProps.spreadX = Math.max(5, Math.min(100, Math.abs(dx)));
                } else if (handleType === 'spreadY') {
                    const dy = newY - pointToUpdate.y;
                    newProps.spreadY = Math.max(5, Math.min(100, Math.abs(dy)));
                }
                
                return currentPoints.map(p => p.id === pointId ? { ...p, ...newProps } : p);
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, []);
    
    const handleBackgroundClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            setActivePointId(null);
        }
    }, []);

    const gradientCss = useMemo(() => {
        const backgroundColor = '#111827';
        const backgroundImage = points.map(p => 
            `radial-gradient(ellipse ${p.spreadX.toFixed(1)}% ${p.spreadY.toFixed(1)}% at ${p.x.toFixed(1)}% ${p.y.toFixed(1)}%, ${p.color} 0px, transparent 75%)`
        ).join(',\n    ');
        return `.your-element {\n  background-color: ${backgroundColor};\n  background-image: ${backgroundImage};\n}`;
    }, [points]);
    
    const backgroundStyle = useMemo(() => {
        if (points.length === 0) return {};
        const backgroundColor = '#111827';
        const backgroundImage = points.map(p => 
             `radial-gradient(ellipse ${p.spreadX.toFixed(1)}% ${p.spreadY.toFixed(1)}% at ${p.x.toFixed(1)}% ${p.y.toFixed(1)}%, ${p.color} 0px, transparent 75%)`
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
    
    const activePoint = useMemo(() => points.find(p => p.id === activePointId), [points, activePointId]);

    return (
        <Card className="bg-transparent border-0 shadow-none w-full">
            <CardHeader className="p-0 mb-4">
                <CardTitle className="text-3xl">Gradient Mesh Builder</CardTitle>
                <CardDescription>Create beautiful, complex gradients by adding and manipulating color points.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-8 p-0">
                <div className="space-y-4">
                    <div className="relative w-full aspect-[16/9] rounded-lg border border-border overflow-hidden">
                        <div
                            ref={previewRef}
                            className="absolute inset-0 cursor-pointer"
                            style={backgroundStyle}
                            onClick={handleBackgroundClick}
                        >
                            {points.map((point) => (
                                <Popover key={point.id} onOpenChange={(isOpen) => { if(isOpen) setActivePointId(point.id); }}>
                                    <PopoverTrigger asChild>
                                        <div
                                            className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/75 shadow-lg cursor-move"
                                            style={{
                                                left: `${point.x}%`,
                                                top: `${point.y}%`,
                                                backgroundColor: point.color,
                                                boxShadow: activePointId === point.id ? '0 0 0 3px rgba(255, 255, 255, 0.9)' : '0 1px 3px rgba(0,0,0,0.5)',
                                                zIndex: activePointId === point.id ? 10 : 1,
                                            }}
                                            onMouseDown={(e) => handleMouseDown(e, point.id, 'position')}
                                        />
                                    </PopoverTrigger>
                                    <PopoverContent className="w-72 p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-sm font-semibold">Point {points.findIndex(p => p.id === point.id) + 1}</h3>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemovePoint(point.id)} disabled={points.length <= 2}>
                                                <Trash2 className="h-3 w-3" />
                                                <span className="sr-only">Remove Point</span>
                                            </Button>
                                        </div>
                                        <ColorPickerClient
                                            color={point.color}
                                            onChange={(c: ColorResult) => setPoints(prev => prev.map(p => p.id === point.id ? { ...p, color: c.hex } : p))}
                                        />
                                        <div className="space-y-2">
                                            <Label htmlFor={`spreadX-${point.id}`} className="text-xs">Spread X: {point.spreadX.toFixed(0)}%</Label>
                                            <Slider
                                                id={`spreadX-${point.id}`}
                                                min={0} max={100} step={1} value={[point.spreadX]}
                                                onValueChange={(value) => setPoints(prev => prev.map(p => p.id === point.id ? { ...p, spreadX: value[0] } : p))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor={`spreadY-${point.id}`} className="text-xs">Spread Y: {point.spreadY.toFixed(0)}%</Label>
                                            <Slider
                                                id={`spreadY-${point.id}`}
                                                min={0} max={100} step={1} value={[point.spreadY]}
                                                onValueChange={(value) => setPoints(prev => prev.map(p => p.id === point.id ? { ...p, spreadY: value[0] } : p))}
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            ))}
                            {activePoint && (
                                (() => {
                                    const previewWidth = previewRef.current?.offsetWidth || 0;
                                    const previewHeight = previewRef.current?.offsetHeight || 0;
                                    const spreadXInPixels = (activePoint.spreadX / 100) * previewWidth;
                                    const spreadYInPixels = (activePoint.spreadY / 100) * previewHeight;

                                    return (
                                        <>
                                            <div
                                                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-dashed border-white/50 pointer-events-none"
                                                style={{
                                                    left: `${activePoint.x}%`,
                                                    top: `${activePoint.y}%`,
                                                    width: `${spreadXInPixels * 2}px`,
                                                    height: `${spreadYInPixels * 2}px`,
                                                }}
                                            />
                                            <div
                                                className="absolute -translate-y-1/2 w-4 h-4 rounded-full bg-white/80 border-2 border-slate-700 shadow-lg cursor-ew-resize"
                                                style={{
                                                    left: `calc(${activePoint.x}% + ${spreadXInPixels}px)`,
                                                    top: `${activePoint.y}%`,
                                                    transform: 'translateX(-50%)',
                                                    zIndex: 11
                                                }}
                                                onMouseDown={(e) => handleMouseDown(e, activePoint.id, 'spreadX')}
                                            />
                                            <div
                                                className="absolute -translate-x-1/2 w-4 h-4 rounded-full bg-white/80 border-2 border-slate-700 shadow-lg cursor-ns-resize"
                                                style={{
                                                    left: `${activePoint.x}%`,
                                                    top: `calc(${activePoint.y}% + ${spreadYInPixels}px)`,
                                                    transform: 'translateY(-50%)',
                                                    zIndex: 11
                                                }}
                                                onMouseDown={(e) => handleMouseDown(e, activePoint.id, 'spreadY')}
                                            />
                                        </>
                                    );
                                })()
                            )}
                        </div>
                    </div>
                    <div className="relative">
                        <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-xs">
                            <code>
                                {gradientCss}
                            </code>
                        </pre>
                        <div className="absolute top-2 right-2 flex items-center gap-2">
                            <Button onClick={handleAddPoint} size="sm" disabled={points.length >= 6}>
                                <Plus className="mr-2 h-4 w-4" /> Add Point
                            </Button>
                            <Button onClick={handleCopyCss} size="sm">Copy CSS</Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
