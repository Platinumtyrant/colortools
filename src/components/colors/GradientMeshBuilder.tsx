
"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { ColorResult } from 'react-color';
import chroma from 'chroma-js';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Move, Download } from 'lucide-react';
import ColorPickerClient from '@/components/colors/ColorPickerClient';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Point {
    id: number;
    x: number;
    y: number;
    color: string;
}

interface EditorPanelProps {
    activePoint: Point | undefined;
    points: Point[];
    setPoints: React.Dispatch<React.SetStateAction<Point[]>>;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ activePoint, points, setPoints }) => {
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
                    <CardTitle className="text-lg">Editing Point {points.findIndex(p => p.id === activePoint.id) + 1}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto space-y-4 p-4">
                <Popover>
                    <PopoverTrigger asChild>
                         <Button variant="outline" className="w-full h-12 justify-start gap-4">
                            <div className="h-8 w-8 rounded-md border" style={{backgroundColor: activePoint.color}}></div>
                            <span>{activePoint.color}</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                       <ColorPickerClient
                            color={activePoint.color}
                            onChange={(c: ColorResult) => setPoints(prev => prev.map(p => p.id === activePoint.id ? { ...p, color: c.hex } : p))}
                        />
                    </PopoverContent>
                </Popover>
            </CardContent>
        </Card>
    );
};


const drawMesh = (canvas: HTMLCanvasElement, points: Point[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || points.length < 6) return;

    const width = canvas.width;
    const height = canvas.height;
    if (width === 0 || height === 0) return;
    
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    const p = points.map(point => chroma(point.color));
    
    const c00 = p[0];
    const c10 = p[1];
    const c20 = p[2];
    const c01 = p[3];
    const c11 = p[4];
    const c21 = p[5];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const u = x / (width - 1);
            const v = y / (height - 1);

            const topColor = chroma.bezier([c00, c10, c20])(u).rgb();
            const bottomColor = chroma.bezier([c01, c11, c21])(u).rgb();
            const finalColor = chroma.mix(topColor, bottomColor, v, 'rgb').rgb();

            const index = (y * width + x) * 4;
            data[index] = finalColor[0];
            data[index + 1] = finalColor[1];
            data[index + 2] = finalColor[2];
            data[index + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
};

export const GradientMeshBuilder = ({ initialColors }: { initialColors?: string[] }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [points, setPoints] = useState<Point[]>([]);
    const [activePointId, setActivePointId] = useState<number | null>(null);
    const { toast } = useToast();

    // Initialize points
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

    // Initialize and update canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                canvas.width = width;
                canvas.height = height;
                drawMesh(canvas, points);
            }
        });

        observer.observe(canvas);

        return () => {
            observer.unobserve(canvas);
        };
    }, [points]); 

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            drawMesh(canvas, points);
        }
    }, [points]);


    const handleExportPng = useCallback(async () => {
        if (points.length < 6) return;

        const exportCanvas = document.createElement('canvas');
        const exportWidth = 1920;
        const exportHeight = 1080;
        exportCanvas.width = exportWidth;
        exportCanvas.height = exportHeight;
        
        drawMesh(exportCanvas, points);
        
        const pngUrl = exportCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `gradient-mesh.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({ title: "Mesh Exported as PNG!" });

    }, [points, toast]);


    const handlePointClick = (index: number) => {
        setActivePointId(points[index].id);
    };

    const activePoint = useMemo(() => points.find(p => p.id === activePointId), [points, activePointId]);
    const gridConnections = [
        [0, 1], [1, 2], [3, 4], [4, 5],
        [0, 3], [1, 4], [2, 5], 
    ];

    return (
        <Card className="bg-transparent border-0 shadow-none w-full">
            <CardHeader className="p-0 mb-4">
                <CardTitle className="text-3xl">Gradient Mesh Builder</CardTitle>
                <CardDescription>
                    Create a true mesh gradient by manipulating the color of each point on the grid.
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
                        <div className="relative w-full aspect-[16/9] rounded-lg border border-border overflow-hidden bg-muted">
                            <canvas ref={canvasRef} className="w-full h-full" />
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
                                {points.map((point, index) => (
                                    <div
                                        key={point.id}
                                        className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/75 shadow-lg cursor-pointer rounded-full"
                                        style={{
                                            left: `${point.x}%`,
                                            top: `${point.y}%`,
                                            backgroundColor: point.color,
                                            boxShadow: activePointId === point.id ? '0 0 0 3px rgba(255, 255, 255, 0.9)' : '0 1px 3px rgba(0,0,0,0.5)',
                                            zIndex: 10,
                                        }}
                                        onMouseDown={() => handlePointClick(index)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <EditorPanel 
                        activePoint={activePoint} 
                        points={points}
                        setPoints={setPoints}
                    />
                 </div>
            </CardContent>
        </Card>
    );
};
