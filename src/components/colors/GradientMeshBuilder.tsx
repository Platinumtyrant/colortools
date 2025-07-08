
"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { ColorResult } from 'react-color';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Code, Move, RotateCw, Download } from 'lucide-react';
import ColorPickerClient from '@/components/colors/ColorPickerClient';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Point {
  id: number;
  x: number;
  y: number;
  color: string;
  spreadX: number;
  spreadY: number;
  rotation: number;
  strength: number;
}

interface GradientMeshBuilderProps {
    initialColors?: string[];
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
                 <p className="text-sm text-muted-foreground">Click on a grid point to start editing its properties.</p>
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
                <div className="space-y-2">
                    <Label htmlFor={`spreadX-${activePoint.id}`} className="text-xs">Spread X: {activePoint.spreadX.toFixed(0)}%</Label>
                    <Slider
                        id={`spreadX-${activePoint.id}`}
                        min={0} max={200} step={1} value={[activePoint.spreadX]}
                        onValueChange={(value) => setPoints(prev => prev.map(p => p.id === activePoint.id ? { ...p, spreadX: value[0] } : p))}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`spreadY-${activePoint.id}`} className="text-xs">Spread Y: {activePoint.spreadY.toFixed(0)}%</Label>
                    <Slider
                        id={`spreadY-${activePoint.id}`}
                        min={0} max={200} step={1} value={[activePoint.spreadY]}
                        onValueChange={(value) => setPoints(prev => prev.map(p => p.id === activePoint.id ? { ...p, spreadY: value[0] } : p))}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`strength-${activePoint.id}`} className="text-xs">Strength: {activePoint.strength.toFixed(0)}%</Label>
                    <Slider
                        id={`strength-${activePoint.id}`}
                        min={10} max={100} step={1} value={[activePoint.strength]}
                        onValueChange={(value) => setPoints(prev => prev.map(p => p.id === activePoint.id ? { ...p, strength: value[0] } : p))}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`rotation-${activePoint.id}`} className="text-xs">Rotation: {activePoint.rotation.toFixed(0)}°</Label>
                    <Slider
                        id={`rotation-${activePoint.id}`}
                        min={0} max={360} step={1} value={[activePoint.rotation]}
                        onValueChange={(value) => setPoints(prev => prev.map(p => p.id === activePoint.id ? { ...p, rotation: value[0] } : p))}
                    />
                </div>
            </CardContent>
        </Card>
    );
};


export const GradientMeshBuilder = ({ initialColors }: GradientMeshBuilderProps) => {
    const [points, setPoints] = useState<Point[]>(() => {
        const defaultColors = ['rgb(0, 159, 255)', 'rgb(236, 47, 75)', 'rgb(101, 78, 163)', 'rgb(234, 175, 200)', 'rgb(252, 70, 107)', 'rgb(63, 94, 251)'];
        let gridColors = defaultColors;

        if (initialColors && initialColors.length > 0) {
            gridColors = Array.from({ length: 6 }, (_, i) => initialColors[i % initialColors.length]);
        }
        
        return [
            { id: 1, x: 5, y: 5, color: gridColors[0], spreadX: 80, spreadY: 80, rotation: 0, strength: 60 },
            { id: 2, x: 95, y: 5, color: gridColors[1], spreadX: 80, spreadY: 80, rotation: 0, strength: 60 },
            { id: 3, x: 5, y: 50, color: gridColors[2], spreadX: 80, spreadY: 80, rotation: 0, strength: 60 },
            { id: 4, x: 95, y: 50, color: gridColors[3], spreadX: 80, spreadY: 80, rotation: 0, strength: 60 },
            { id: 5, x: 5, y: 95, color: gridColors[4], spreadX: 80, spreadY: 80, rotation: 0, strength: 60 },
            { id: 6, x: 95, y: 95, color: gridColors[5], spreadX: 80, spreadY: 80, rotation: 0, strength: 60 },
        ];
    });
    
    const [activePointId, setActivePointId] = useState<number | null>(points[0]?.id ?? null);
    const [isCodeVisible, setIsCodeVisible] = useState(false);
    const [blurRadius, setBlurRadius] = useState(50);
    const previewRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const dragInfo = useRef<{isDragging: boolean, pointId: number | null, handleType: 'position' | 'spreadX' | 'spreadY' | 'rotation' | null}>({ isDragging: false, pointId: null, handleType: null });
    
    useEffect(() => {
        const calculateBlur = () => {
            if (previewRef.current) {
                const width = previewRef.current.offsetWidth;
                const newBlur = Math.max(30, Math.min(80, width * 0.06));
                setBlurRadius(newBlur);
            }
        };

        const observer = new ResizeObserver(calculateBlur);
        if (previewRef.current) {
            observer.observe(previewRef.current);
        }
        calculateBlur(); 

        return () => {
            if (previewRef.current) {
                observer.unobserve(previewRef.current);
            }
        };
    }, []);

    const handlePointMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, pointId: number, handleType: 'position' | 'spreadX' | 'spreadY' | 'rotation') => {
        e.preventDefault();
        e.stopPropagation();

        dragInfo.current = { isDragging: true, pointId, handleType };
        
        if (activePointId !== pointId) {
            setActivePointId(pointId);
        }

        const pointToDrag = points.find(p => p.id === pointId);
        if (!pointToDrag || !previewRef.current) return;

        const rect = previewRef.current!.getBoundingClientRect();
        const offsetX = e.clientX - (rect.left + (pointToDrag.x / 100) * rect.width);
        const offsetY = e.clientY - (rect.top + (pointToDrag.y / 100) * rect.height);
        
        const handleDocumentMouseMove = (moveEvent: MouseEvent) => {
            if (!dragInfo.current.isDragging || !previewRef.current) return;

            setPoints(currentPoints => {
                const pointToUpdate = currentPoints.find(p => p.id === pointId);
                if (!pointToUpdate) return currentPoints;

                let newProps: Partial<Point> = {};
                const currentHandleType = dragInfo.current.handleType;

                switch (currentHandleType) {
                    case 'position': {
                        const newXPercent = ((moveEvent.clientX - rect.left - offsetX) / rect.width) * 100;
                        const newYPercent = ((moveEvent.clientY - rect.top - offsetY) / rect.height) * 100;
                        newProps.x = Math.max(0, Math.min(100, newXPercent));
                        newProps.y = Math.max(0, Math.min(100, newYPercent));
                        break;
                    }
                    case 'rotation': {
                        const centerX = rect.left + (pointToUpdate.x / 100) * rect.width;
                        const centerY = rect.top + (pointToUpdate.y / 100) * rect.height;
                        const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * (180 / Math.PI);
                        newProps.rotation = (angle + 90 + 360) % 360; // Add 90 to make 'up' 0 degrees
                        break;
                    }
                    case 'spreadX':
                    case 'spreadY': {
                        const centerX = rect.left + (pointToUpdate.x / 100) * rect.width;
                        const centerY = rect.top + (pointToUpdate.y / 100) * rect.height;
                        const mouseDx = moveEvent.clientX - centerX;
                        const mouseDy = moveEvent.clientY - centerY;
                        const rotationRad = -pointToUpdate.rotation * (Math.PI / 180);
                        const cosA = Math.cos(rotationRad);
                        const sinA = Math.sin(rotationRad);
                        const unrotatedDx = mouseDx * cosA - mouseDy * sinA;
                        const unrotatedDy = mouseDx * sinA + mouseDy * cosA;
                        if (currentHandleType === 'spreadX') {
                            newProps.spreadX = Math.max(5, (Math.abs(unrotatedDx) / rect.width) * 200);
                        } else {
                            newProps.spreadY = Math.max(5, (Math.abs(unrotatedDy) / rect.height) * 200);
                        }
                        break;
                    }
                }
                
                return currentPoints.map(p => p.id === pointId ? { ...p, ...newProps } : p);
            });
        };

        const handleDocumentMouseUp = () => {
            document.removeEventListener('mousemove', handleDocumentMouseMove);
            document.removeEventListener('mouseup', handleDocumentMouseUp);
            dragInfo.current = { isDragging: false, pointId: null, handleType: null };
        };

        document.addEventListener('mousemove', handleDocumentMouseMove);
        document.addEventListener('mouseup', handleDocumentMouseUp);
    }, [points, activePointId]);
    
    
    const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            setActivePointId(null);
        }
    };

    const handleExportPng = useCallback(async () => {
        const width = 1920;
        const height = 1080;
    
        const exportBlurRadius = Math.max(30, Math.min(150, width * 0.06));
    
        let svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <foreignObject width="100%" height="100%">
                <div xmlns="http://www.w3.org/1999/xhtml">
                    <style>
                        .mesh-container {
                            position: relative;
                            width: ${width}px;
                            height: ${height}px;
                            overflow: hidden;
                            background-color: #000000;
                        }
                        .mesh-inner {
                            position: absolute;
                            inset: 0;
                            transform: scale(1.2);
                        }
                        .mesh-point {
                            position: absolute;
                            mix-blend-mode: screen;
                            filter: blur(${exportBlurRadius.toFixed(0)}px);
                            border-radius: 50%;
                        }
                    </style>
                    <div class="mesh-container">
                        <div class="mesh-inner">
                            ${points.map(p => `
                                <div class="mesh-point" style="
                                    left: ${p.x.toFixed(1)}%;
                                    top: ${p.y.toFixed(1)}%;
                                    width: ${p.spreadX * 2}%;
                                    height: ${p.spreadY * 2}%;
                                    transform: translate(-50%, -50%) rotate(${p.rotation}deg);
                                    background-image: radial-gradient(ellipse, ${p.color} 0px, transparent ${p.strength}%);
                                "></div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </foreignObject>
        </svg>`;
    
        const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;
    
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                const pngUrl = canvas.toDataURL('image/png');
                
                const link = document.createElement('a');
                link.href = pngUrl;
                link.download = `gradient-mesh.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                toast({ title: "Mesh Exported as PNG!" });
            }
        };
        img.onerror = (err) => {
            console.error("Failed to load SVG for PNG conversion", err);
            toast({ title: "Failed to export as PNG", variant: 'destructive' });
        };
        img.src = svgDataUrl;
    
    }, [points, toast]);
    
    const gradientCss = useMemo(() => {
        const containerCss = `
.mesh-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #000000;
}

/* This inner container is scaled up to prevent blur clipping */
.mesh-inner {
    position: absolute;
    inset: 0;
    transform: scale(1.2);
}

.mesh-point {
  position: absolute;
  mix-blend-mode: screen;
  filter: blur(${blurRadius.toFixed(0)}px);
  border-radius: 50%;
}
`;
        const pointsCss = points.map((p, i) => `
.mesh-point-${i + 1} {
  left: ${p.x.toFixed(1)}%;
  top: ${p.y.toFixed(1)}%;
  width: ${p.spreadX * 2}%;
  height: ${p.spreadY * 2}%;
  transform: translate(-50%, -50%) rotate(${p.rotation}deg);
  background-image: radial-gradient(ellipse, ${p.color} 0px, transparent ${p.strength}%);
}
`).join('');

        const htmlStructure = `
<!-- HTML Structure -->
<div class="mesh-container">
  <div class="mesh-inner">
${points.map((_, i) => `    <div class="mesh-point mesh-point-${i + 1}"></div>`).join('\n')}
  </div>
</div>
`;

        return `/* CSS */\n${containerCss}\n${pointsCss}\n\n${htmlStructure}`;
    }, [points, blurRadius]);
    
    const handleCopyCss = () => {
        navigator.clipboard.writeText(gradientCss).then(() => {
            toast({ title: "HTML & CSS Copied!", description: "Gradient structure has been copied." });
        }).catch(err => {
            console.error("Failed to copy CSS: ", err);
        });
    };
    
    const activePoint = useMemo(() => points.find(p => p.id === activePointId), [points, activePointId]);
    const gridConnections = [
        [0, 1], [2, 3], [4, 5], // Horizontal
        [0, 2], [2, 4], // Left Vertical
        [1, 3], [3, 5], // Right Vertical
    ];

    return (
        <Card className="bg-transparent border-0 shadow-none w-full">
            <CardHeader className="p-0 mb-4">
                <CardTitle className="text-3xl">Gradient Mesh Builder</CardTitle>
                <CardDescription>Create beautiful, complex gradients by manipulating the color points on the grid.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                 <div className="grid grid-cols-1 lg:grid-cols-[2.5fr,1fr] gap-8">
                    <div className="space-y-4">
                        <div className="relative w-full aspect-[16/9] rounded-lg border border-border overflow-hidden bg-muted">
                            <div 
                                ref={previewRef}
                                className="absolute inset-0 cursor-pointer"
                                onMouseDown={handleBackgroundClick}
                            >
                                <div
                                    className="absolute inset-0 bg-black"
                                >
                                    <div className="absolute inset-0 transform scale-125">
                                        {points.map(point => (
                                            <div
                                                key={`grad-bg-${point.id}`}
                                                className="absolute mix-blend-screen rounded-full"
                                                style={{
                                                    left: `${point.x}%`,
                                                    top: `${point.y}%`,
                                                    width: `${point.spreadX * 2}%`,
                                                    height: `${point.spreadY * 2}%`,
                                                    transform: `translate(-50%, -50%) rotate(${point.rotation}deg)`,
                                                    backgroundImage: `radial-gradient(ellipse, ${point.color} 0px, transparent ${point.strength}%)`,
                                                    filter: `blur(${blurRadius}px)`,
                                                }}
                                                onMouseDown={(e) => handlePointMouseDown(e, point.id, 'position')}
                                            />
                                        ))}
                                    </div>
                                </div>
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
                                {points.map((point) => (
                                    <TooltipProvider key={point.id} delayDuration={100}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/75 shadow-lg cursor-move rounded-full"
                                                    style={{
                                                        left: `${point.x}%`,
                                                        top: `${point.y}%`,
                                                        backgroundColor: point.color,
                                                        boxShadow: activePointId === point.id ? '0 0 0 3px rgba(255, 255, 255, 0.9)' : '0 1px 3px rgba(0,0,0,0.5)',
                                                        zIndex: activePointId === point.id ? 12 : 1,
                                                    }}
                                                    onMouseDown={(e) => handlePointMouseDown(e, point.id, 'position')}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Drag to move</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                                {activePoint && (
                                    (() => {
                                        const previewWidth = previewRef.current?.offsetWidth || 0;
                                        const previewHeight = previewRef.current?.offsetHeight || 0;
                                        if (previewWidth === 0 || previewHeight === 0) return null;
                                        
                                        const isOutOfBounds = (px: number, py: number) => px < 0 || px > previewWidth || py < 0 || py > previewHeight;

                                        const spreadXInPixels = (activePoint.spreadX / 100) * previewWidth;
                                        const xHandleX = (activePoint.x / 100) * previewWidth + (spreadXInPixels / 2) * Math.cos(activePoint.rotation * (Math.PI / 180));
                                        const xHandleY = (activePoint.y / 100) * previewHeight + (spreadXInPixels / 2) * Math.sin(activePoint.rotation * (Math.PI / 180));
                                        const xMultiplier = isOutOfBounds(xHandleX, xHandleY) ? -1 : 1;
                                        
                                        const spreadYInPixels = (activePoint.spreadY / 100) * previewHeight;
                                        const yHandleX = (activePoint.x / 100) * previewWidth - (spreadYInPixels / 2) * Math.sin(activePoint.rotation * (Math.PI / 180));
                                        const yHandleY = (activePoint.y / 100) * previewHeight + (spreadYInPixels / 2) * Math.cos(activePoint.rotation * (Math.PI / 180));
                                        const yMultiplier = isOutOfBounds(yHandleX, yHandleY) ? -1 : 1;

                                        return (
                                            <>
                                                <div
                                                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-dashed border-white/50 pointer-events-none"
                                                    style={{
                                                        left: `${activePoint.x}%`,
                                                        top: `${activePoint.y}%`,
                                                        width: `${spreadXInPixels}px`,
                                                        height: `${spreadYInPixels}px`,
                                                        transform: `translate(-50%, -50%) rotate(${activePoint.rotation}deg)`
                                                    }}
                                                />
                                                <div
                                                    className="absolute w-4 h-4 rounded-full bg-white/80 border-2 border-slate-700 shadow-lg cursor-ew-resize"
                                                    style={{
                                                        left: `${activePoint.x}%`,
                                                        top: `${activePoint.y}%`,
                                                        transform: `translate(-50%, -50%) rotate(${activePoint.rotation}deg) translateX(${xMultiplier * spreadXInPixels / 2}px) rotate(${-activePoint.rotation}deg)`,
                                                        zIndex: 11
                                                    }}
                                                    onMouseDown={(e) => handlePointMouseDown(e, activePoint.id, 'spreadX')}
                                                />
                                                <div
                                                    className="absolute w-4 h-4 rounded-full bg-white/80 border-2 border-slate-700 shadow-lg cursor-ns-resize"
                                                    style={{
                                                        left: `${activePoint.x}%`,
                                                        top: `${activePoint.y}%`,
                                                        transform: `translate(-50%, -50%) rotate(${activePoint.rotation}deg) translateY(${yMultiplier * spreadYInPixels / 2}px) rotate(${-activePoint.rotation}deg)`,
                                                        zIndex: 11
                                                    }}
                                                    onMouseDown={(e) => handlePointMouseDown(e, activePoint.id, 'spreadY')}
                                                />
                                                <div
                                                    className="absolute flex items-center justify-center w-4 h-4 rounded-full bg-white/80 border-2 border-slate-700 shadow-lg cursor-[grab]"
                                                    style={{
                                                        left: `${activePoint.x}%`,
                                                        top: `${activePoint.y}%`,
                                                        transform: `translate(-50%, -50%) rotate(${activePoint.rotation}deg) translateY(${-yMultiplier * (spreadYInPixels / 2 + 20)}px) rotate(${-activePoint.rotation}deg)`,
                                                        zIndex: 11
                                                    }}
                                                    onMouseDown={(e) => handlePointMouseDown(e, activePoint.id, 'rotation')}
                                                >
                                                    <RotateCw className="w-2.5 h-2.5 text-slate-700" />
                                                </div>
                                            </>
                                        );
                                    })()
                                )}
                             </div>

                            <div className="absolute top-2 right-2 flex items-center gap-2 bg-background/50 p-1 rounded-lg border border-border/50 shadow-lg">
                                <Button onClick={() => setIsCodeVisible(v => !v)} size="sm" variant="ghost">
                                    <Code className="mr-2 h-4 w-4" />
                                    {isCodeVisible ? 'Hide Code' : 'Show Code'}
                                </Button>
                                <Button onClick={handleCopyCss} size="sm">Copy CSS</Button>
                                <Button onClick={handleExportPng} size="sm">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export PNG
                                </Button>
                            </div>
                        </div>
                        {isCodeVisible && (
                            <div className="relative mt-4">
                                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-xs">
                                    <code>{gradientCss}</code>
                                </pre>
                            </div>
                        )}
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
