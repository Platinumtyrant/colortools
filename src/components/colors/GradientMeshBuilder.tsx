
"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { ColorResult } from 'react-color';
import chroma from 'chroma-js';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Move, Download, Plus, Trash2 } from 'lucide-react';
import ColorPickerClient from '@/components/colors/ColorPickerClient';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

interface Point {
    id: number;
    x: number;
    y: number;
    color: string;
    strength: number;
    falloff: number;
}

interface EditorPanelProps {
    activePoint: Point | undefined;
    onColorChange: (color: string) => void;
    onStrengthChange: (strength: number) => void;
    onFalloffChange: (falloff: number) => void;
    onRemovePoint: () => void;
    canRemovePoint: boolean;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ activePoint, onColorChange, onStrengthChange, onFalloffChange, onRemovePoint, canRemovePoint }) => {
    if (!activePoint) {
        return (
            <Card className="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed">
                 <Move className="w-12 h-12 text-muted-foreground mb-4" />
                 <h3 className="text-lg font-semibold">Select a Point</h3>
                 <p className="text-sm text-muted-foreground">Click on a grid point to start editing its color and blend properties.</p>
            </Card>
        )
    }
    
    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0 flex-row items-center justify-between">
                <CardTitle className="text-lg">Editing Point</CardTitle>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={onRemovePoint} 
                                disabled={!canRemovePoint}
                                aria-label="Remove Point"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{canRemovePoint ? "Remove selected point" : "Cannot remove, must have at least 2 points"}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto p-0 flex flex-col">
                <ColorPickerClient
                    color={activePoint.color}
                    onChange={(c: ColorResult) => onColorChange(c.hex)}
                    className="border-0 shadow-none rounded-none"
                />
                <div className="p-4 border-t">
                    <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="point-strength" className="text-sm">Strength</Label>
                        <span className="text-sm font-mono">{activePoint.strength.toFixed(1)}</span>
                    </div>
                    <Slider
                        id="point-strength"
                        min={1}
                        max={10}
                        step={0.1}
                        value={[activePoint.strength]}
                        onValueChange={(value) => onStrengthChange(value[0])}
                    />
                </div>
                 <div className="p-4 border-t">
                    <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="point-falloff" className="text-sm">Falloff</Label>
                        <span className="text-sm font-mono">{activePoint.falloff.toFixed(1)}</span>
                    </div>
                    <Slider
                        id="point-falloff"
                        min={1}
                        max={10}
                        step={0.1}
                        value={[activePoint.falloff]}
                        onValueChange={(value) => onFalloffChange(value[0])}
                    />
                </div>
            </CardContent>
        </Card>
    );
};


const drawMesh = (canvas: HTMLCanvasElement, points: Point[], isPreview: boolean) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || points.length === 0) return;

    let { width, height } = canvas;
    if (isPreview) {
        width = Math.round(width / 8);
        height = Math.round(height / 8);
    }

    if (width <= 0 || height <= 0) return;

    const offscreenCanvas = new OffscreenCanvas(width, height);
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (!offscreenCtx) return;

    const imageData = offscreenCtx.createImageData(width, height);
    const data = imageData.data;

    const pointColors = points.map(p => chroma(p.color).rgb());
    const pointPositions = points.map(p => ({ x: (p.x / 100) * width, y: (p.y / 100) * height }));

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let totalWeight = 0;
            let r = 0, g = 0, b = 0;

            for (let i = 0; i < points.length; i++) {
                const dx = x - pointPositions[i].x;
                const dy = y - pointPositions[i].y;
                const distSq = dx * dx + dy * dy;

                if (distSq < 0.001) {
                    r = pointColors[i][0];
                    g = pointColors[i][1];
                    b = pointColors[i][2];
                    totalWeight = 1;
                    break;
                }
                
                const exponent = (11 - points[i].falloff) / 2;
                const strengthMultiplier = points[i].strength / 5.0;
                const weight = strengthMultiplier * (1 / Math.pow(distSq, exponent));

                r += pointColors[i][0] * weight;
                g += pointColors[i][1] * weight;
                b += pointColors[i][2] * weight;
                totalWeight += weight;
            }

            if (totalWeight > 0) {
                r /= totalWeight;
                g /= totalWeight;
                b /= totalWeight;
            }

            const index = (y * width + x) * 4;
            data[index] = r;
            data[index + 1] = g;
            data[index + 2] = b;
            data[index + 3] = 255;
        }
    }
    
    offscreenCtx.putImageData(imageData, 0, 0);

    ctx.imageSmoothingEnabled = isPreview;
    ctx.imageSmoothingQuality = isPreview ? 'low' : 'high';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(offscreenCanvas, 0, 0, canvas.width, canvas.height);
};

export const GradientMeshBuilder = ({ initialColors }: { initialColors?: string[] }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [points, setPoints] = useState<Point[]>([]);
    const [activePointId, setActivePointId] = useState<number | null>(null);
    const [draggingPointId, setDraggingPointId] = useState<number | null>(null);
    const { toast } = useToast();
    const debounceTimeout = useRef<NodeJS.Timeout>();
    const isUpdatingPower = useRef(false);

    useEffect(() => {
        const defaultColors = ['#e0c3fc', '#8ec5fc'];
        
        const startColors = initialColors && initialColors.length > 1
            ? [initialColors[0], initialColors[1]]
            : defaultColors;
    
        const initialPoints: Point[] = [
            { id: 1, x: 25, y: 25, color: startColors[0], strength: 5, falloff: 4 },
            { id: 2, x: 75, y: 75, color: startColors[1], strength: 5, falloff: 4 },
        ];
        setPoints(initialPoints);
        setActivePointId(initialPoints[0].id);
    }, [initialColors]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !points.length) return;
        
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        const isPreview = draggingPointId !== null || isUpdatingPower.current;
        
        if (isPreview) {
            drawMesh(canvas, points, true);
        } else {
            debounceTimeout.current = setTimeout(() => {
                drawMesh(canvas, points, false);
            }, 50);
        }

        return () => {
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        };
    }, [points, draggingPointId]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                canvas.width = width;
                canvas.height = height;
                drawMesh(canvas, points, false);
            }
        });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                observer.unobserve(containerRef.current);
            }
        };
    }, [points]);
    
    const handleExportPng = useCallback(async () => {
        if (points.length === 0) return;
        const exportCanvas = document.createElement('canvas');
        const exportWidth = 1920;
        const exportHeight = 1080;
        exportCanvas.width = exportWidth;
        exportCanvas.height = exportHeight;
        
        drawMesh(exportCanvas, points, false);
        
        const pngUrl = exportCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `gradient-mesh.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({ title: "Mesh Exported as PNG!" });
    }, [points, toast]);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, pointId: number) => {
        e.preventDefault();
        e.stopPropagation();
        (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
        setDraggingPointId(pointId);
        setActivePointId(pointId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (draggingPointId === null || !containerRef.current) return;
        
        e.preventDefault();
        e.stopPropagation();

        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        const clampedX = Math.max(0, Math.min(100, x));
        const clampedY = Math.max(0, Math.min(100, y));

        setPoints(prevPoints => 
            prevPoints.map(p => 
                p.id === draggingPointId ? { ...p, x: clampedX, y: clampedY } : p
            )
        );
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (draggingPointId !== null) {
            setDraggingPointId(null);
        }
    };
    
    const handleColorChange = useCallback((newColor: string) => {
        if (!activePointId) return;
        setPoints(prev => prev.map(p => p.id === activePointId ? { ...p, color: newColor } : p));
    }, [activePointId]);

    const handleStrengthChange = useCallback((newStrength: number) => {
        isUpdatingPower.current = true;
        if (!activePointId) return;
        setPoints(prev => prev.map(p => p.id === activePointId ? { ...p, strength: newStrength } : p));
        
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            isUpdatingPower.current = false;
        }, 100);

    }, [activePointId]);
    
    const handleFalloffChange = useCallback((newFalloff: number) => {
        isUpdatingPower.current = true;
        if (!activePointId) return;
        setPoints(prev => prev.map(p => p.id === activePointId ? { ...p, falloff: newFalloff } : p));
        
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            isUpdatingPower.current = false;
        }, 100);

    }, [activePointId]);
    
    const handleAddPoint = useCallback(() => {
        if (points.length >= 10) {
            toast({ title: "Maximum of 10 points reached.", variant: "destructive" });
            return;
        }
        const newPoint: Point = {
            id: Date.now(),
            x: 50,
            y: 50,
            color: points.length > 0 ? chroma.average(points.map(p => p.color), 'lch').hex() : '#cccccc',
            strength: 5,
            falloff: 4,
        };
        setPoints(prev => [...prev, newPoint]);
        setActivePointId(newPoint.id);
        toast({ title: "Point Added" });
    }, [points, toast]);

    const handleRemovePoint = useCallback(() => {
        if (points.length <= 2) {
            toast({ title: "Cannot have fewer than 2 points.", variant: "destructive" });
            return;
        }
        if (!activePointId) return;

        setPoints(prev => {
            const newPoints = prev.filter(p => p.id !== activePointId);
            if (newPoints.length > 0) {
              setActivePointId(newPoints[0].id);
            } else {
              setActivePointId(null);
            }
            return newPoints;
        });
        toast({ title: "Point Removed" });
    }, [points.length, activePointId, toast]);


    const activePoint = useMemo(() => points.find(p => p.id === activePointId), [points, activePointId]);
    const canRemovePoint = points.length > 2;

    return (
        <Card className="bg-transparent border-0 shadow-none w-full">
            <CardHeader className="p-0 mb-4">
                <CardTitle className="text-3xl">Gradient Mesh Builder</CardTitle>
                <CardDescription>
                    Create a true mesh gradient by manipulating the color and position of each point on the grid.
                    Since this is rendered on a canvas, it cannot be exported to CSS.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                 <div className="grid grid-cols-1 lg:grid-cols-[2.5fr,1fr] gap-8">
                    <div className="space-y-4">
                        <div className="flex justify-end gap-2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button onClick={handleAddPoint} size="sm" variant="outline">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Point
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Add a new color point to the mesh.</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button onClick={handleExportPng} size="sm">
                                            <Download className="mr-2 h-4 w-4" />
                                            Export PNG
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Export as a 1920x1080 PNG image.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div
                            ref={containerRef}
                            className="relative w-full aspect-[16/9] rounded-lg border border-border overflow-hidden bg-muted cursor-crosshair"
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerLeave={handlePointerUp}
                        >
                            <canvas ref={canvasRef} className="w-full h-full" />
                            <div className="absolute inset-0">
                                {points.map((point) => (
                                    <div
                                        key={point.id}
                                        className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/75 shadow-lg cursor-grab active:cursor-grabbing rounded-full"
                                        style={{
                                            left: `${point.x}%`,
                                            top: `${point.y}%`,
                                            backgroundColor: point.color,
                                            boxShadow: activePointId === point.id ? '0 0 0 3px rgba(255, 255, 255, 0.9)' : '0 1px 3px rgba(0,0,0,0.5)',
                                            zIndex: 10,
                                        }}
                                        onPointerDown={(e) => handlePointerDown(e, point.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <EditorPanel 
                        activePoint={activePoint} 
                        onColorChange={handleColorChange}
                        onStrengthChange={handleStrengthChange}
                        onFalloffChange={handleFalloffChange}
                        onRemovePoint={handleRemovePoint}
                        canRemovePoint={canRemovePoint}
                    />
                 </div>
            </CardContent>
        </Card>
    );
};
