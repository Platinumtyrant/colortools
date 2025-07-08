
"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { ColorResult } from 'react-color';
import chroma from 'chroma-js';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Move, Download, Copy } from 'lucide-react';
import ColorPickerClient from '@/components/colors/ColorPickerClient';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Point {
    id: number;
    x: number;
    y: number;
    color: string;
}

interface EditorPanelProps {
    activePoint: Point | undefined;
    onColorChange: (color: string) => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ activePoint, onColorChange }) => {
    if (!activePoint) {
        return (
            <Card className="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed">
                 <Move className="w-12 h-12 text-muted-foreground mb-4" />
                 <h3 className="text-lg font-semibold">Select a Point</h3>
                 <p className="text-sm text-muted-foreground">Click on a grid point to start editing its color.</p>
            </Card>
        )
    }
    
    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Editing Point</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto p-0">
                <ColorPickerClient
                    color={activePoint.color}
                    onChange={(c: ColorResult) => onColorChange(c.hex)}
                    className="border-0 shadow-none rounded-none"
                />
            </CardContent>
        </Card>
    );
};


const drawMesh = (canvas: HTMLCanvasElement, points: Point[], isPreview: boolean) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || points.length === 0) return;

    let { width, height } = canvas;
    if (isPreview) {
        // Render at a much lower resolution for speed, then scale up
        width = Math.round(width / 8);
        height = Math.round(height / 8);
    }

    if (width <= 0 || height <= 0) return;

    // Use an offscreen canvas for rendering the pixels
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
            let exactMatch = false;

            for (let i = 0; i < points.length; i++) {
                const dx = x - pointPositions[i].x;
                const dy = y - pointPositions[i].y;
                const distSq = dx * dx + dy * dy;

                if (distSq < 0.1) {
                    r = pointColors[i][0];
                    g = pointColors[i][1];
                    b = pointColors[i][2];
                    exactMatch = true;
                    break;
                }
                const weight = 1 / (distSq * distSq);
                r += pointColors[i][0] * weight;
                g += pointColors[i][1] * weight;
                b += pointColors[i][2] * weight;
                totalWeight += weight;
            }

            if (!exactMatch && totalWeight > 0) {
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

    // Draw the (potentially scaled) result to the visible canvas
    ctx.imageSmoothingEnabled = isPreview;
    ctx.imageSmoothingQuality = 'high';
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

    useEffect(() => {
        const defaultColors = ['#f8cdda', '#1d2b64', '#fdfcfb', '#fde2e4', '#e6e6ea', '#fbfbfb'];
        const gridColors = initialColors && initialColors.length > 0
            ? Array.from({ length: 6 }, (_, i) => initialColors[i % initialColors.length])
            : defaultColors;

        const initialPoints: Point[] = [
            { id: 1, x: 0, y: 0, color: gridColors[0] },
            { id: 2, x: 50, y: 0, color: gridColors[1] },
            { id: 3, x: 100, y: 0, color: gridColors[2] },
            { id: 4, x: 0, y: 100, color: gridColors[3] },
            { id: 5, x: 50, y: 100, color: gridColors[4] },
            { id: 6, x: 100, y: 100, color: gridColors[5] }
        ];
        setPoints(initialPoints);
        setActivePointId(initialPoints[0].id);
    }, [initialColors]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const isPreview = draggingPointId !== null;
        drawMesh(canvas, points, isPreview);
    }, [points, draggingPointId]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                canvas.width = width;
                canvas.height = height;
                const isPreview = draggingPointId !== null;
                drawMesh(canvas, points, isPreview);
            }
        });

        observer.observe(canvas);
        return () => observer.disconnect();
    }, [points, draggingPointId]); 

    const handleExportPng = useCallback(async () => {
        if (points.length < 6) return;
        const exportCanvas = document.createElement('canvas');
        const exportWidth = 1920;
        const exportHeight = 1080;
        exportCanvas.width = exportWidth;
        exportCanvas.height = exportHeight;
        
        drawMesh(exportCanvas, points, false); // false for high quality
        
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
            (e.target as HTMLDivElement).releasePointerCapture(e.pointerId);
            setDraggingPointId(null);
        }
    };
    
    const handleColorChange = useCallback((newColor: string) => {
        if (!activePointId) return;
        
        // Update points for instant visual feedback on the color picker itself
        setPoints(prev => prev.map(p => p.id === activePointId ? { ...p, color: newColor } : p));
        
        // Debounce the re-rendering of the canvas
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            // The useEffect already handles re-rendering, this just ensures it happens after a pause
        }, 50);

    }, [activePointId]);

    const activePoint = useMemo(() => points.find(p => p.id === activePointId), [points, activePointId]);
    const gridConnections = [
        [0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [1, 4], [2, 5], 
    ];

    return (
        <Card className="bg-transparent border-0 shadow-none w-full">
            <CardHeader className="p-0 mb-4">
                <CardTitle className="text-3xl">Gradient Mesh Builder</CardTitle>
                <CardDescription>
                    Create a true mesh gradient by manipulating the color and position of each point on the grid.
                    Because this is rendered on a canvas, it cannot be exported to CSS.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                 <div className="grid grid-cols-1 lg:grid-cols-[2.5fr,1fr] gap-8">
                    <div className="space-y-4">
                        <div className="flex justify-end gap-2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button onClick={handleExportPng} size="sm">
                                            <Download className="mr-2 h-4 w-4" />
                                            Export PNG
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Download a 1920x1080 PNG of the gradient.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div
                            ref={containerRef}
                            className="relative w-full aspect-[16/9] rounded-lg border border-border overflow-hidden bg-muted"
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerLeave={handlePointerUp}
                        >
                            <canvas ref={canvasRef} className="w-full h-full" />
                            {points.length === 6 && (
                                <>
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
                                        {gridConnections.map(([p1Index, p2Index], i) => (
                                            <line
                                                key={`line-${i}`}
                                                x1={`${points[p1Index].x}%`} y1={`${points[p1Index].y}%`}
                                                x2={`${points[p2Index].x}%`} y2={`${points[p2Index].y}%`}
                                                stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 4"
                                            />
                                        ))}
                                    </svg>
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
                                </>
                            )}
                        </div>
                    </div>

                    <EditorPanel 
                        activePoint={activePoint} 
                        onColorChange={handleColorChange}
                    />
                 </div>
            </CardContent>
        </Card>
    );
};
