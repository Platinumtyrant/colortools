
"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { ColorResult } from 'react-color';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Code, Move, RotateCw } from 'lucide-react';
import ColorPickerClient from '@/components/colors/ColorPickerClient';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
    handleRemovePoint: (id: number) => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ activePoint, points, setPoints, handleRemovePoint }) => {
    if (!activePoint) {
        return (
            <Card className="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed">
                 <Move className="w-12 h-12 text-muted-foreground mb-4" />
                 <h3 className="text-lg font-semibold">Select a Point</h3>
                 <p className="text-sm text-muted-foreground">Click on a point in the mesh to start editing its properties.</p>
            </Card>
        )
    }
    
    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Editing Point {points.findIndex(p => p.id === activePoint.id) + 1}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleRemovePoint(activePoint.id)} disabled={points.length <= 1}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove Point</span>
                    </Button>
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
        const defaultPoints = [
            { id: 1, x: 20, y: 20, color: '#ff8a80', spreadX: 50, spreadY: 50, rotation: 0, strength: 75 },
            { id: 2, x: 80, y: 80, color: '#8c9eff', spreadX: 50, spreadY: 50, rotation: 0, strength: 75 },
        ];

        if (!initialColors || initialColors.length < 1) {
            return defaultPoints;
        }

        const basePositions = [
            { x: 20, y: 20 }, { x: 80, y: 80 }, { x: 20, y: 80 },
            { x: 80, y: 20 }, { x: 50, y: 50 }, { x: 25, y: 75 },
        ];
        
        return initialColors.slice(0, 6).map((color, index) => {
            const pos = basePositions[index % basePositions.length];
            return {
                id: index + 1,
                color,
                x: pos.x,
                y: pos.y,
                spreadX: 50,
                spreadY: 50,
                rotation: 0,
                strength: 75
            };
        });
    });
    
    const [activePointId, setActivePointId] = useState<number | null>(points[0]?.id ?? null);
    const [isCodeVisible, setIsCodeVisible] = useState(false);
    const [blurRadius, setBlurRadius] = useState(50);
    const nextId = useRef(Math.max(...points.map(p => p.id), 0) + 1);
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

        dragInfo.current = { isDragging: false, pointId, handleType };
        
        const startPos = { x: e.clientX, y: e.clientY };
        let moved = false;
        
        const handleDocumentMouseMove = (moveEvent: MouseEvent) => {
            const dx = Math.abs(moveEvent.clientX - startPos.x);
            const dy = Math.abs(moveEvent.clientY - startPos.y);

            if (!moved && (dx > 3 || dy > 3)) {
                moved = true;
                dragInfo.current.isDragging = true;
                 if (activePointId !== pointId) {
                    setActivePointId(pointId);
                }
            }

            if (moved) {
                if (!previewRef.current) return;
                const rect = previewRef.current.getBoundingClientRect();
                
                setPoints(currentPoints => {
                    const pointToUpdate = currentPoints.find(p => p.id === pointId);
                    if (!pointToUpdate) return currentPoints;

                    let newProps: Partial<Point> = {};

                    switch (handleType) {
                        case 'position': {
                            const newX = ((moveEvent.clientX - rect.left) / rect.width) * 100;
                            const newY = ((moveEvent.clientY - rect.top) / rect.height) * 100;
                            newProps.x = Math.max(0, Math.min(100, newX));
                            newProps.y = Math.max(0, Math.min(100, newY));
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
                            if (handleType === 'spreadX') {
                                newProps.spreadX = Math.max(5, (Math.abs(unrotatedDx) / rect.width) * 200);
                            } else {
                                newProps.spreadY = Math.max(5, (Math.abs(unrotatedDy) / rect.height) * 200);
                            }
                            break;
                        }
                    }
                    
                    return currentPoints.map(p => p.id === pointId ? { ...p, ...newProps } : p);
                });
            }
        };

        const handleDocumentMouseUp = () => {
            document.removeEventListener('mousemove', handleDocumentMouseMove);
            document.removeEventListener('mouseup', handleDocumentMouseUp);
            if (!moved) {
                 setActivePointId(pointId);
            }
            dragInfo.current = { isDragging: false, pointId: null, handleType: null };
        };

        document.addEventListener('mousemove', handleDocumentMouseMove);
        document.addEventListener('mouseup', handleDocumentMouseUp);
    }, [activePointId]);
    
    const handleAddPoint = useCallback(() => {
        setPoints(prev => {
            if (prev.length >= 6) {
                toast({ title: "Maximum of 6 overlay points reached." });
                return prev;
            }
            const newPoint: Point = {
                id: nextId.current,
                x: Math.random() * 80 + 10,
                y: Math.random() * 80 + 10,
                color: `hsl(${Math.random() * 360}, 80%, 70%)`,
                spreadX: 50,
                spreadY: 50,
                rotation: 0,
                strength: 75,
            };
            nextId.current++;
            setActivePointId(newPoint.id);
            return [...prev, newPoint];
        });
    }, [toast]);

    const handleRemovePoint = useCallback((idToRemove: number) => {
        setPoints(prev => {
            if (prev.length <= 1) {
                toast({ title: "A minimum of 1 point is required." });
                return prev;
            }
            if (activePointId === idToRemove) {
                 setActivePointId(prev.find(p => p.id !== idToRemove)?.id || null);
            }
            return prev.filter(p => p.id !== idToRemove);
        });
    }, [toast, activePointId]);
    
    const handleBackgroundClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            setActivePointId(null);
        }
    }, []);
    
    const gradientCss = useMemo(() => {
        const containerCss = `
.mesh-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: ${points[0]?.color || '#000000'};
}

/* This inner container is scaled up to prevent blur clipping */
.mesh-inner {
    position: absolute;
    inset: 0;
    transform: scale(1.2);
}

.mesh-point {
  position: absolute;
  mix-blend-mode: lighten;
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

    return (
        <Card className="bg-transparent border-0 shadow-none w-full">
            <CardHeader className="p-0 mb-4">
                <CardTitle className="text-3xl">Gradient Mesh Builder</CardTitle>
                <CardDescription>Create beautiful, complex gradients by adding and manipulating color points.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                 <div className="grid grid-cols-1 lg:grid-cols-[2.5fr,1fr] gap-8">
                    <div className="space-y-4">
                        <div className="relative w-full aspect-[16/9] rounded-lg border border-border overflow-hidden bg-muted">
                            <div 
                                ref={previewRef}
                                className="absolute inset-0 cursor-pointer"
                                onClick={handleBackgroundClick}
                                onMouseDown={handleBackgroundClick} // Also deselect on mousedown
                            >
                                {/* Visual and Interactive Layer Combined */}
                                <div
                                    className="absolute inset-0"
                                    style={{ backgroundColor: points[0]?.color || '#000000' }}
                                >
                                    {points.map(point => (
                                        <div
                                            key={`grad-bg-${point.id}`}
                                            className="absolute mix-blend-lighten rounded-full transition-transform duration-100 ease-in-out cursor-move group-hover:brightness-110"
                                            style={{
                                                left: `${point.x}%`,
                                                top: `${point.y}%`,
                                                width: `${point.spreadX * 2}%`,
                                                height: `${point.spreadY * 2}%`,
                                                transform: `translate(-50%, -50%) rotate(${point.rotation}deg) scale(1.2)`,
                                                backgroundImage: `radial-gradient(ellipse, ${point.color} 0px, transparent ${point.strength}%)`,
                                                filter: `blur(${blurRadius}px)`,
                                            }}
                                            onMouseDown={(e) => handlePointMouseDown(e, point.id, 'position')}
                                        />
                                    ))}
                                </div>

                                 {/* Handles drawn on top */}
                                {points.map((point) => (
                                     <div
                                        key={point.id}
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
                                ))}
                                {activePoint && (
                                    (() => {
                                        const previewWidth = previewRef.current?.offsetWidth || 0;
                                        const previewHeight = previewRef.current?.offsetHeight || 0;
                                        if (previewWidth === 0 || previewHeight === 0) return null;

                                        const cx = (activePoint.x / 100) * previewWidth;
                                        const cy = (activePoint.y / 100) * previewHeight;
                                        const angle = activePoint.rotation * (Math.PI / 180);
                                        const cosA = Math.cos(angle);
                                        const sinA = Math.sin(angle);

                                        // Check if handles are out of bounds and determine multiplier
                                        const isOutOfBounds = (px: number, py: number) => px < 0 || px > previewWidth || py < 0 || py > previewHeight;

                                        const spreadXInPixels = (activePoint.spreadX / 100) * previewWidth;
                                        const xHandleX = cx + (spreadXInPixels / 2) * cosA;
                                        const xHandleY = cy + (spreadXInPixels / 2) * sinA;
                                        const xMultiplier = isOutOfBounds(xHandleX, xHandleY) ? -1 : 1;
                                        
                                        const spreadYInPixels = (activePoint.spreadY / 100) * previewHeight;
                                        const yHandleX = cx - (spreadYInPixels / 2) * sinA;
                                        const yHandleY = cy + (spreadYInPixels / 2) * cosA;
                                        const yMultiplier = isOutOfBounds(yHandleX, yHandleY) ? -1 : 1;

                                        const rotHandleDist = (spreadYInPixels / 2) + 20;
                                        const rotHandleX = cx - rotHandleDist * sinA;
                                        const rotHandleY = cy + rotHandleDist * cosA;
                                        const rotMultiplier = isOutOfBounds(rotHandleX, rotHandleY) ? -1 : 1;

                                        return (
                                            <>
                                                {/* Dashed ellipse outline */}
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
                                                {/* Spread X Handle */}
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
                                                {/* Spread Y Handle */}
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
                                                {/* Rotation Handle */}
                                                <div
                                                    className="absolute w-6 h-6 rounded-full bg-white/80 border-2 border-slate-700 shadow-lg flex items-center justify-center"
                                                    style={{
                                                        cursor: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12a9 9 0 1 1-6.219-8.56'%3E%3C/path%3E%3C/svg%3E") 12 12, auto`,
                                                        left: `${activePoint.x}%`,
                                                        top: `${activePoint.y}%`,
                                                        transform: `translate(-50%, -50%) rotate(${activePoint.rotation}deg) translateY(${rotMultiplier * ((spreadYInPixels / 2) + 20)}px) rotate(${-activePoint.rotation}deg)`,
                                                        zIndex: 11,
                                                    }}
                                                    onMouseDown={(e) => handlePointMouseDown(e, activePoint.id, 'rotation')}
                                                >
                                                    <RotateCw className="w-3 h-3 text-slate-700"/>
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
                                <Button onClick={handleAddPoint} size="sm" disabled={points.length >= 6}>
                                    <Plus className="mr-2 h-4 w-4" /> Point
                                </Button>
                                <Button onClick={handleCopyCss} size="sm">Copy CSS</Button>
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
                        handleRemovePoint={handleRemovePoint}
                    />
                 </div>
            </CardContent>
        </Card>
    );
};
