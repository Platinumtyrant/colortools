
"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { ColorResult } from 'react-color';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, Code } from 'lucide-react';
import ColorPickerClient from '@/components/colors/ColorPickerClient';

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
    const [openPopoverId, setOpenPopoverId] = useState<number | null>(null);
    const [isCodeVisible, setIsCodeVisible] = useState(false);
    const nextId = useRef(Math.max(...points.map(p => p.id), 0) + 1);
    const previewRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    
    const handlePointInteractionStart = useCallback((e: React.MouseEvent<HTMLDivElement>, pointId: number, handleType: 'position' | 'spreadX' | 'spreadY') => {
        e.preventDefault();
        e.stopPropagation();

        const startPos = { x: e.clientX, y: e.clientY };
        let hasDragged = false;

        // On mouse down, always set the active point, but don't open the popover yet.
        // This makes the first click always a "selection".
        if (handleType === 'position' && activePointId !== pointId) {
            setActivePointId(pointId);
            setOpenPopoverId(null); // Close any other popover
        }

        const handleDocumentMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startPos.x;
            const dy = moveEvent.clientY - startPos.y;

            if (!hasDragged && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
                hasDragged = true;
                // If we start dragging, ensure the popover is closed.
                if (openPopoverId === pointId) {
                    setOpenPopoverId(null);
                }
            }

            if (hasDragged) {
                if (!previewRef.current) return;
                const rect = previewRef.current.getBoundingClientRect();
                
                setPoints(currentPoints => {
                    const pointToUpdate = currentPoints.find(p => p.id === pointId);
                    if (!pointToUpdate) return currentPoints;

                    let newProps: Partial<Point> = {};

                    if (handleType === 'position') {
                        const newX = ((moveEvent.clientX - rect.left) / rect.width) * 100;
                        const newY = ((moveEvent.clientY - rect.top) / rect.height) * 100;
                        newProps.x = Math.max(0, Math.min(100, newX));
                        newProps.y = Math.max(0, Math.min(100, newY));
                    } else {
                        const centerX = rect.left + (pointToUpdate.x / 100) * rect.width;
                        const centerY = rect.top + (pointToUpdate.y / 100) * rect.height;
                        const mouseX = moveEvent.clientX;
                        const mouseY = moveEvent.clientY;
                        
                        const mouseDx = mouseX - centerX;
                        const mouseDy = mouseY - centerY;
                        
                        const rotationRad = -pointToUpdate.rotation * (Math.PI / 180);
                        const cosA = Math.cos(rotationRad);
                        const sinA = Math.sin(rotationRad);
                        
                        const unrotatedDx = mouseDx * cosA - mouseDy * sinA;
                        const unrotatedDy = mouseDx * sinA + mouseDy * cosA;

                        if (handleType === 'spreadX') {
                            const newSpreadX = (Math.abs(unrotatedDx) / rect.width) * 200;
                            newProps.spreadX = Math.max(5, Math.min(200, newSpreadX));
                        } else if (handleType === 'spreadY') {
                            const newSpreadY = (Math.abs(unrotatedDy) / rect.height) * 200;
                            newProps.spreadY = Math.max(5, Math.min(200, newSpreadY));
                        }
                    }
                    
                    return currentPoints.map(p => p.id === pointId ? { ...p, ...newProps } : p);
                });
            }
        };

        const handleDocumentMouseUp = () => {
            document.removeEventListener('mousemove', handleDocumentMouseMove);
            document.removeEventListener('mouseup', handleDocumentMouseUp);

            // If it wasn't a drag, it was a click.
            if (!hasDragged && handleType === 'position') {
                // Now, because selection happened on mousedown, we just toggle the popover.
                 setOpenPopoverId(prevId => (prevId === pointId ? null : pointId));
            }
        };

        document.addEventListener('mousemove', handleDocumentMouseMove);
        document.addEventListener('mouseup', handleDocumentMouseUp);
    }, [activePointId, openPopoverId]);

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
            if (openPopoverId === idToRemove) {
                setOpenPopoverId(null);
            }
            return prev.filter(p => p.id !== idToRemove);
        });
    }, [toast, activePointId, openPopoverId]);
    
    const handleBackgroundClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (target.contains(previewRef.current) || target === previewRef.current) {
            setActivePointId(null);
            setOpenPopoverId(null);
        }
    }, []);
    
    const gradientCss = useMemo(() => {
        const containerCss = `
.mesh-container {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: ${points[0]?.color || '#000000'};
  overflow: hidden;
}

.mesh-point {
  position: absolute;
  mix-blend-mode: lighten;
  border-radius: 50%;
  filter: blur(50px);
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
${points.map((p, i) => `  <div class="mesh-point mesh-point-${i + 1}"></div>`).join('\n')}
</div>
`;

        return `/* CSS */\n${containerCss}\n${pointsCss}\n\n${htmlStructure}`;
    }, [points]);
    
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
            <CardContent className="flex flex-col gap-8 p-0">
                <div className="space-y-4">
                    <div className="relative w-full aspect-[16/9] rounded-lg border border-border overflow-hidden">
                        <div
                            ref={previewRef}
                            className="absolute inset-0 cursor-pointer"
                            onClick={handleBackgroundClick}
                            style={{ backgroundColor: points[0]?.color || '#000000' }}
                        >
                             {points.map(point => (
                                <div
                                    key={`grad-${point.id}`}
                                    className="absolute mix-blend-lighten rounded-full"
                                    style={{
                                        left: `${point.x}%`,
                                        top: `${point.y}%`,
                                        width: `${point.spreadX * 2}%`,
                                        height: `${point.spreadY * 2}%`,
                                        transform: `translate(-50%, -50%) rotate(${point.rotation}deg)`,
                                        backgroundImage: `radial-gradient(ellipse, ${point.color} 0px, transparent ${point.strength}%)`,
                                        filter: 'blur(50px)',
                                    }}
                                />
                             ))}
                            {points.map((point) => (
                                <Popover key={point.id} open={openPopoverId === point.id} onOpenChange={(isOpen) => setOpenPopoverId(isOpen ? point.id : null)}>
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
                                            onMouseDown={(e) => handlePointInteractionStart(e, point.id, 'position')}
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
                                                min={0} max={200} step={1} value={[point.spreadX]}
                                                onValueChange={(value) => setPoints(prev => prev.map(p => p.id === point.id ? { ...p, spreadX: value[0] } : p))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor={`spreadY-${point.id}`} className="text-xs">Spread Y: {point.spreadY.toFixed(0)}%</Label>
                                            <Slider
                                                id={`spreadY-${point.id}`}
                                                min={0} max={200} step={1} value={[point.spreadY]}
                                                onValueChange={(value) => setPoints(prev => prev.map(p => p.id === point.id ? { ...p, spreadY: value[0] } : p))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor={`strength-${point.id}`} className="text-xs">Strength: {point.strength.toFixed(0)}%</Label>
                                            <Slider
                                                id={`strength-${point.id}`}
                                                min={10} max={100} step={1} value={[point.strength]}
                                                onValueChange={(value) => setPoints(prev => prev.map(p => p.id === point.id ? { ...p, strength: value[0] } : p))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor={`rotation-${point.id}`} className="text-xs">Rotation: {point.rotation.toFixed(0)}°</Label>
                                            <Slider
                                                id={`rotation-${point.id}`}
                                                min={0} max={360} step={1} value={[point.rotation]}
                                                onValueChange={(value) => setPoints(prev => prev.map(p => p.id === point.id ? { ...p, rotation: value[0] } : p))}
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
                                                    transform: `translate(-50%, -50%) rotate(${activePoint.rotation}deg) translateX(${spreadXInPixels / 2}px) rotate(${-activePoint.rotation}deg)`,
                                                    zIndex: 11
                                                }}
                                                onMouseDown={(e) => handlePointInteractionStart(e, activePoint.id, 'spreadX')}
                                            />
                                            <div
                                                className="absolute w-4 h-4 rounded-full bg-white/80 border-2 border-slate-700 shadow-lg cursor-ns-resize"
                                                style={{
                                                    left: `${activePoint.x}%`,
                                                    top: `${activePoint.y}%`,
                                                    transform: `translate(-50%, -50%) rotate(${activePoint.rotation}deg) translateY(${spreadYInPixels / 2}px) rotate(${-activePoint.rotation}deg)`,
                                                    zIndex: 11
                                                }}
                                                onMouseDown={(e) => handlePointInteractionStart(e, activePoint.id, 'spreadY')}
                                            />
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
                                <code>
                                    {gradientCss}
                                </code>
                            </pre>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
