
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Camera, Zap, ZapOff, CameraOff, Image as ImageIcon, Crosshair, X } from 'lucide-react';
import { ColorBox } from '@/components/colors/ColorBox';
import { usePaletteBuilder } from '@/contexts/PaletteBuilderContext';
import { saveColorToLibrary, removeColorFromLibrary } from '@/lib/colors';
import { colord } from 'colord';

export default function CameraIdentifierPage() {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null); // Used for capturing snapshots
    const animationFrameId = useRef<number>();

    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isStreamActive, setIsStreamActive] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [identifiedColor, setIdentifiedColor] = useState<string>('#FFFFFF');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [snapshot, setSnapshot] = useState<string | null>(null);
    const [crosshairPosition, setCrosshairPosition] = useState<{ x: number; y: number } | null>(null);
    
    const { palette, setPalette } = usePaletteBuilder();
    const [libraryColors, setLibraryColors] = useState<string[]>([]);
    const paletteHexes = React.useMemo(() => new Set(palette.map(p => colord(p.hex).toHex())), [palette]);
    const libraryHexes = React.useMemo(() => new Set(libraryColors.map(c => colord(c).toHex())), [libraryColors]);

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
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            setStream(mediaStream);
            setIsStreamActive(true);
            setHasCameraPermission(true);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            setIsStreamActive(false);
            toast({ variant: 'destructive', title: 'Camera Access Denied' });
        }
    }, [toast]);
    
    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsStreamActive(false);
        setIsDetecting(false);
        setStream(null);
    }, [stream]);

    // Initial camera start
    useEffect(() => {
        startCamera();
        // Cleanup on unmount
        return () => {
            stopCamera();
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [startCamera, stopCamera]);


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
        setIsDetecting(false); // Stop live detection when snapshot is taken
    };
    
    const handleClearSnapshot = () => {
        setSnapshot(null);
        setCrosshairPosition(null);
    };
    
    const handleIdentifyFromSnapshot = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!snapshot || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;

        setCrosshairPosition({ x: (canvasX / canvas.width) * 100, y: (canvasY / canvas.height) * 100 });
        
        const pixelData = context.getImageData(canvasX, canvasY, 1, 1).data;
        const hex = `#${("000000" + ((pixelData[0] << 16) | (pixelData[1] << 8) | pixelData[2]).toString(16)).slice(-6)}`;
        setIdentifiedColor(hex);
    };

    return (
        <main className="flex-1 w-full p-4 md:p-8 space-y-8">
            <CardHeader className="p-0 text-center max-w-4xl mx-auto">
                <CardTitle className="text-3xl">Live Color Identifier</CardTitle>
                <CardDescription>
                    Point your camera at an object to identify its color. Freeze the frame for precise selection.
                </CardDescription>
            </CardHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                <Card className="relative aspect-video flex items-center justify-center overflow-hidden bg-muted">
                    <div
                        className="w-full h-full relative"
                        onClick={snapshot ? handleIdentifyFromSnapshot : undefined}
                    >
                         <video ref={videoRef} className={`h-full w-full object-cover ${snapshot ? 'hidden' : 'block'}`} autoPlay muted playsInline />
                         <canvas ref={canvasRef} className="hidden" />
                         {snapshot && <img src={snapshot} alt="snapshot" className="h-full w-full object-contain cursor-crosshair" />}

                         {snapshot ? (
                            crosshairPosition && (
                                <Crosshair 
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 text-white/80 pointer-events-none" 
                                    style={{ left: `${crosshairPosition.x}%`, top: `${crosshairPosition.y}%` }} 
                                />
                            )
                         ) : (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-8 h-8 border-2 border-white/75 rounded-full" />
                                <div className="absolute w-1 h-8 bg-white/75 rounded-full" />
                                <div className="absolute w-8 h-1 bg-white/75 rounded-full" />
                            </div>
                         )}

                    </div>

                    {hasCameraPermission === null && (
                         <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2">
                             <Camera className="h-8 w-8 animate-pulse text-muted-foreground" />
                             <p className="text-muted-foreground">Requesting camera access...</p>
                         </div>
                    )}

                    {hasCameraPermission === false && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center p-4">
                            <Alert variant="destructive">
                                <CameraOff className="h-4 w-4" />
                                <AlertTitle>Camera Access Denied</AlertTitle>
                                <AlertDescription>
                                    Please enable camera permissions and refresh the page.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                </Card>

                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-2">
                        {isStreamActive ? (
                            <Button onClick={stopCamera} variant="outline"><CameraOff className="mr-2 h-4 w-4" /> Stop Camera</Button>
                        ) : (
                            <Button onClick={startCamera}><Camera className="mr-2 h-4 w-4" /> Start Camera</Button>
                        )}

                        {snapshot ? (
                             <Button onClick={handleClearSnapshot} variant="outline"><X className="mr-2 h-4 w-4" /> Clear Snapshot</Button>
                        ) : (
                             <Button onClick={handleSnapshot} disabled={!isStreamActive}><ImageIcon className="mr-2 h-4 w-4" /> Freeze Frame</Button>
                        )}
                    </div>
                    
                    <Button onClick={() => setIsDetecting(p => !p)} disabled={!isStreamActive || !!snapshot}>
                        {isDetecting ? <ZapOff className="mr-2 h-4 w-4" /> : <Zap className="mr-2 h-4 w-4" />}
                        {isDetecting ? 'Stop Live Detection' : 'Start Live Detection'}
                    </Button>

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
