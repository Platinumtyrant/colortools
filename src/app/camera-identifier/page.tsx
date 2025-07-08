
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Camera, Pipette, Zap, ZapOff } from 'lucide-react';
import { ColorBox } from '@/components/colors/ColorBox';
import { usePaletteBuilder } from '@/contexts/PaletteBuilderContext';
import { saveColorToLibrary, removeColorFromLibrary } from '@/lib/colors';
import { colord } from 'colord';

export default function CameraIdentifierPage() {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number>();

    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [identifiedColor, setIdentifiedColor] = useState<string>('#FFFFFF');
    const [stream, setStream] = useState<MediaStream | null>(null);

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


    useEffect(() => {
        const getCameraPermission = async () => {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setHasCameraPermission(false);
            toast({
              variant: 'destructive',
              title: 'Camera Not Supported',
              description: 'Your browser does not support camera access.',
            });
            return;
          }
          try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: "environment" // Prefer the rear camera
                } 
            });
            setStream(mediaStream);
            setHasCameraPermission(true);
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
            }
          } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({
              variant: 'destructive',
              title: 'Camera Access Denied',
              description: 'Please enable camera permissions in your browser settings.',
            });
          }
        };
    
        getCameraPermission();

        return () => {
            // Cleanup: stop the stream when the component unmounts
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    const detectColor = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) {
            animationFrameId.current = requestAnimationFrame(detectColor);
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;

        // Set canvas size to video size to avoid distortion
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the center part of the video to the canvas
        const centerX = video.videoWidth / 2;
        const centerY = video.videoHeight / 2;
        
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        // Get the color of the center pixel
        const pixelData = context.getImageData(centerX, centerY, 1, 1).data;
        const hex = `#${("000000" + ((pixelData[0] << 16) | (pixelData[1] << 8) | pixelData[2]).toString(16)).slice(-6)}`;
        
        setIdentifiedColor(hex);

        animationFrameId.current = requestAnimationFrame(detectColor);
    }, []);

    useEffect(() => {
        if (isDetecting) {
            animationFrameId.current = requestAnimationFrame(detectColor);
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
    }, [isDetecting, detectColor]);

    const toggleDetection = () => {
        setIsDetecting(prev => !prev);
    };

    return (
        <main className="flex-1 w-full p-4 md:p-8 space-y-8">
            <CardHeader className="p-0 text-center max-w-4xl mx-auto">
                <CardTitle className="text-3xl">Live Color Identifier</CardTitle>
                <CardDescription>
                    Point your camera at an object to identify its color in real-time.
                </CardDescription>
            </CardHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                <Card className="relative aspect-video flex items-center justify-center overflow-hidden">
                     {/* The video element should always be in the DOM to receive the stream */}
                    <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
                    <canvas ref={canvasRef} className="hidden" />

                    {hasCameraPermission === null && (
                         <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2">
                             <Camera className="h-8 w-8 animate-pulse text-muted-foreground" />
                             <p className="text-muted-foreground">Requesting camera access...</p>
                         </div>
                    )}

                    {hasCameraPermission === false && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center p-4">
                            <Alert variant="destructive">
                                <Camera className="h-4 w-4" />
                                <AlertTitle>Camera Access Required</AlertTitle>
                                <AlertDescription>
                                    This feature needs camera access. Please update your browser permissions and refresh the page.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                    
                    {hasCameraPermission && (
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-8 h-8 border-2 border-white/75 rounded-full" />
                            <div className="absolute w-1 h-8 bg-white/75 rounded-full" />
                            <div className="absolute w-8 h-1 bg-white/75 rounded-full" />
                        </div>
                    )}
                </Card>

                <div className="flex flex-col gap-4">
                    <Button onClick={toggleDetection} disabled={hasCameraPermission !== true}>
                        {isDetecting ? <ZapOff className="mr-2 h-4 w-4" /> : <Zap className="mr-2 h-4 w-4" />}
                        {isDetecting ? 'Stop Detection' : 'Start Detection'}
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
