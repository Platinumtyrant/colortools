
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Camera, Zap, ZapOff, CameraOff, Image as ImageIcon, Crosshair, X, ZoomIn, ZoomOut } from 'lucide-react';
import { ColorBox } from '@/components/colors/ColorBox';
import { usePaletteBuilder } from '@/contexts/PaletteBuilderContext';
import { saveColorToLibrary, removeColorFromLibrary } from '@/lib/colors';
import { colord } from 'colord';
import { motion, AnimatePresence } from 'framer-motion';

export default function CameraIdentifierPage() {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number>();
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const lastDragPosition = useRef<{ x: number, y: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);
    const [isRequestingPermission, setIsRequestingPermission] = useState<boolean>(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [identifiedColor, setIdentifiedColor] = useState<string>('#FFFFFF');
    const [snapshot, setSnapshot] = useState<string | null>(null);
    const [crosshairPosition, setCrosshairPosition] = useState<{ x: number; y: number } | null>(null);
    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    
    const { palette, setPalette } = usePaletteBuilder();
    const [libraryColors, setLibraryColors] = useState<string[]>([]);
    const paletteHexes = React.useMemo(() => new Set(palette.map(p => colord(p.hex).toHex())), [palette]);
    const libraryHexes = React.useMemo(() => new Set(libraryColors.map(c => colord(c).toHex())), [libraryColors]);

    const isStreamActive = !!stream;
    const isZoomed = transform.scale > 1;

    useEffect(() => {
        try {
            const savedColorsJSON = localStorage.getItem('saved_individual_colors');
            if (savedColorsJSON) {
                setLibraryColors(JSON.parse(savedColorsJSON));
            }
        } catch (e) { console.error(e); }
    }, []);
    
    const handleToggleLibrary = useCallback((color: string) => {
        const normalizedColor = colord(color).toHex();
        const isInLibrary = libraryHexes.has(normalizedColor);
        
        const result = isInLibrary ? removeColorFromLibrary(color) : saveColorToLibrary(color);
        toast({ title: result.message, variant: result.success ? 'default' : 'destructive' });

        if (result.success) {
            const newLibrary = isInLibrary
                ? libraryColors.filter(c => colord(c).toHex() !== normalizedColor)
                : [...libraryColors, normalizedColor];
            setLibraryColors(newLibrary);
        }
    }, [libraryColors, libraryHexes, toast]);

    const handleAddToPalette = useCallback((color: string) => {
        if (palette.length >= 20) {
            toast({ title: "Palette is full (20 colors max).", variant: "destructive" });
            return;
        }
        const newPaletteColor = { id: Date.now(), hex: color, locked: false };
        setPalette(p => [...p, newPaletteColor]);
        toast({ title: "Color added to palette!" });
    }, [palette.length, setPalette, toast]);

    const handleRemoveFromPalette = useCallback((color: string) => {
        const normalizedColor = colord(color).toHex();
        setPalette(currentPalette => currentPalette.filter(p => colord(p.hex).toHex() !== normalizedColor));
        toast({ title: 'Color removed from palette.' });
    }, [setPalette, toast]);


    const startCamera = useCallback(async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setHasCameraPermission(false);
            toast({ variant: 'destructive', title: 'Camera Not Supported' });
            return;
        }
        try {
            setIsRequestingPermission(true);
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            setStream(mediaStream);
            setHasCameraPermission(true);
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            setStream(null);
            toast({ variant: 'destructive', title: 'Camera Access Denied' });
        } finally {
            setIsRequestingPermission(false);
        }
    }, [toast]);
    
    const stopCamera = useCallback(() => {
        setStream(null);
        setIsDetecting(false);
    }, []);
    
    useEffect(() => {
        const video = videoRef.current;
        if (video && stream) {
            video.srcObject = stream;
        }
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (video) {
                video.srcObject = null;
            }
        };
    }, [stream]);

    const detectColorFromVideo = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) {
            animationFrameId.current = requestAnimationFrame(detectColorFromVideo);
            return;
        }
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        const centerX = video.videoWidth / 2;
        const centerY = video.videoHeight / 2;
        
        const pixelData = context.getImageData(centerX, centerY, 1, 1).data;
        const hex = `#${("000000" + ((pixelData[0] << 16) | (pixelData[1] << 8) | pixelData[2]).toString(16)).slice(-6)}`;
        
        setIdentifiedColor(hex);
        animationFrameId.current = requestAnimationFrame(detectColorFromVideo);
    }, []);

    useEffect(() => {
        if (isDetecting && !snapshot) {
            animationFrameId.current = requestAnimationFrame(detectColorFromVideo);
        } else {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        }
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isDetecting, snapshot, detectColorFromVideo]);

    const handleSnapshot = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) return;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        setSnapshot(canvas.toDataURL('image/jpeg'));
        setIsDetecting(false);
    };
    
    const handleClearSnapshot = () => {
        setSnapshot(null);
        setCrosshairPosition(null);
        setTransform({ scale: 1, x: 0, y: 0 });
        stopCamera();
    };
    
    const handleIdentifyFromSnapshot = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!snapshot || !canvasRef.current || !imageContainerRef.current) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const xOnElement = e.clientX - rect.left;
        const yOnElement = e.clientY - rect.top;
        const xOnImage = (xOnElement - transform.x) / transform.scale;
        const yOnImage = (yOnElement - transform.y) / transform.scale;
        const canvasX = xOnImage * (canvas.width / rect.width);
        const canvasY = yOnImage * (canvas.height / rect.height);
        
        if (canvasX < 0 || canvasX > canvas.width || canvasY < 0 || canvasY > canvas.height) {
            return;
        }

        setCrosshairPosition({ x: (xOnElement / rect.width) * 100, y: (yOnElement / rect.height) * 100 });
        
        const pixelData = context.getImageData(canvasX, canvasY, 1, 1).data;
        const hex = `#${("000000" + ((pixelData[0] << 16) | (pixelData[1] << 8) | pixelData[2]).toString(16)).slice(-6)}`;
        setIdentifiedColor(hex);
    };

    const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!snapshot || !imageContainerRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (transform.scale > 1) {
            setTransform({ scale: 1, x: 0, y: 0 });
        } else {
            const newScale = 3;
            setTransform({
                scale: newScale,
                x: -x * (newScale - 1),
                y: -y * (newScale - 1),
            });
        }
    };
    
    const handleResetZoom = () => {
        setTransform({ scale: 1, x: 0, y: 0 });
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isZoomed) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        lastDragPosition.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isZoomed || !lastDragPosition.current) return;
        const dx = e.clientX - lastDragPosition.current.x;
        const dy = e.clientY - lastDragPosition.current.y;
        lastDragPosition.current = { x: e.clientX, y: e.clientY };
        setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        lastDragPosition.current = null;
    };

    const handleUploadButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        stopCamera();
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            if (!imageUrl) return;

            const img = new Image();
            img.onload = () => {
                if (canvasRef.current) {
                    const canvas = canvasRef.current;
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const context = canvas.getContext('2d');
                    if (context) {
                        context.drawImage(img, 0, 0, img.width, img.height);
                        setSnapshot(imageUrl);
                    }
                }
            };
            img.src = imageUrl;
        };
        reader.readAsDataURL(file);

        if (event.target) event.target.value = '';
    };

    return (
        <main className="flex-1 w-full p-4 md:p-8 space-y-8">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            <CardHeader className="p-0 text-center max-w-4xl mx-auto">
                <CardTitle className="text-3xl">Live Color Identifier</CardTitle>
                <CardDescription>
                    Point your camera or upload an image to identify colors. Freeze the frame, then double-tap to zoom for precise selection.
                </CardDescription>
            </CardHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                <Card className="relative aspect-video flex items-center justify-center overflow-hidden bg-muted">
                    <div
                        className="w-full h-full relative cursor-crosshair"
                        ref={imageContainerRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onDoubleClick={handleDoubleClick}
                        onClick={snapshot ? handleIdentifyFromSnapshot : undefined}
                    >
                         {!isStreamActive && !snapshot && (
                             <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center gap-2 text-center p-4">
                                <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                <p className="font-semibold mt-2">Identify Colors</p>
                                <p className="text-sm text-muted-foreground">Start your camera or upload an image.</p>
                            </div>
                         )}

                         <video ref={videoRef} className={`h-full w-full object-cover ${!isStreamActive || snapshot ? 'hidden' : 'block'}`} autoPlay muted playsInline />
                         <canvas ref={canvasRef} className="hidden" />
                         
                         <AnimatePresence>
                         {snapshot && (
                            <motion.div
                                className="h-full w-full"
                                style={{
                                    backgroundImage: `url(${snapshot})`,
                                    backgroundSize: 'contain',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'center',
                                    cursor: isZoomed ? 'grab' : 'zoom-in',
                                }}
                                animate={{ scale: transform.scale, x: transform.x, y: transform.y }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                         )}
                         </AnimatePresence>

                         {snapshot ? (
                            crosshairPosition && (
                                <Crosshair 
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 text-white/80 pointer-events-none" 
                                    style={{ left: `${crosshairPosition.x}%`, top: `${crosshairPosition.y}%` }} 
                                />
                            )
                         ) : (
                            isStreamActive && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-8 h-8 border-2 border-white/75 rounded-full" />
                                    <div className="absolute w-1 h-8 bg-white/75 rounded-full" />
                                    <div className="absolute w-8 h-1 bg-white/75 rounded-full" />
                                </div>
                            )
                         )}

                    </div>

                    {isRequestingPermission && (
                         <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2">
                             <Camera className="h-8 w-8 animate-pulse text-muted-foreground" />
                             <p className="text-muted-foreground">Requesting camera access...</p>
                         </div>
                    )}

                </Card>

                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-2">
                        {isStreamActive ? (
                            <Button onClick={stopCamera} variant="outline"><CameraOff className="mr-2 h-4 w-4" /> Stop Camera</Button>
                        ) : (
                            <Button onClick={startCamera} disabled={!!snapshot}><Camera className="mr-2 h-4 w-4" /> Start Camera</Button>
                        )}
                        
                        {snapshot ? (
                             <Button onClick={handleClearSnapshot} variant="outline"><X className="mr-2 h-4 w-4" /> Clear Snapshot</Button>
                        ) : (
                             isStreamActive ? (
                                 <Button onClick={handleSnapshot}><ImageIcon className="mr-2 h-4 w-4" /> Freeze Frame</Button>
                             ) : (
                                 <Button onClick={handleUploadButtonClick} variant="outline"><ImageIcon className="mr-2 h-4 w-4" /> Upload Image</Button>
                             )
                        )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <Button onClick={() => setIsDetecting(p => !p)} disabled={!isStreamActive || !!snapshot}>
                            {isDetecting ? <ZapOff className="mr-2 h-4 w-4" /> : <Zap className="mr-2 h-4 w-4" />}
                            {isDetecting ? 'Stop Live Detection' : 'Start Live Detection'}
                        </Button>
                         <Button onClick={handleResetZoom} disabled={!snapshot || !isZoomed} variant="outline">
                             <ZoomOut className="mr-2 h-4 w-4" />
                             Reset Zoom
                         </Button>
                    </div>

                     <div className="relative group/container w-full" >
                         <ColorBox
                            variant="default"
                            color={identifiedColor}
                            onAddToLibrary={!libraryHexes.has(colord(identifiedColor).toHex()) ? () => handleToggleLibrary(identifiedColor) : undefined}
                            onRemoveFromLibrary={libraryHexes.has(colord(identifiedColor).toHex()) ? () => handleToggleLibrary(identifiedColor) : undefined}
                            onAddToPalette={!paletteHexes.has(colord(identifiedColor).toHex()) ? () => handleAddToPalette(identifiedColor) : undefined}
                            onRemoveFromPalette={paletteHexes.has(colord(identifiedColor).toHex()) ? () => handleRemoveFromPalette(identifiedColor) : undefined}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
