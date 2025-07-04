"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { colord, type HslColor } from 'colord';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, Dices } from 'lucide-react';
import { ColorSliders } from './ColorSliders';
import { WCAGDisplay } from './WCAGDisplay';

export const ContrastChecker = () => {
    const [textHsl, setTextHsl] = useState<HslColor>(colord('#1a1a1a').toHsl());
    const [bgHsl, setBgHsl] = useState<HslColor>(colord('#ffffff').toHsl());

    const textColor = useMemo(() => colord(textHsl).toHex(), [textHsl]);
    const bgColor = useMemo(() => colord(bgHsl).toHex(), [bgHsl]);
    
    const handleSwap = useCallback(() => {
        const temp = textHsl;
        setTextHsl(bgHsl);
        setBgHsl(temp);
    }, [textHsl, bgHsl]);

    const handleRandomize = useCallback(() => {
        let newTextColor, newBgColor, contrast;
        do {
            newTextColor = colord(`hsl(${Math.random() * 360}, ${Math.random() * 100}%, ${Math.random() * 100}%)`);
            newBgColor = colord(`hsl(${Math.random() * 360}, ${Math.random() * 100}%, ${Math.random() * 100}%)`);
            
            if (Math.abs(newTextColor.toHsl().l - newBgColor.toHsl().l) < 30) {
                contrast = 0;
                continue;
            }

            contrast = newTextColor.contrast(newBgColor.toHex());
        } while (contrast < 4.5);

        setTextHsl(newTextColor.toHsl());
        setBgHsl(newBgColor.toHsl());
    }, []);

    return (
        <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4 items-stretch">
                <div 
                    className="relative flex flex-col min-h-[12rem] w-full transition-colors duration-200 rounded-lg border p-4 items-center justify-center"
                    style={{ backgroundColor: bgColor, color: textColor }}
                >
                    <h2 className="text-5xl font-bold select-none">Aa</h2>
                    <p className="text-sm">Some sample text</p>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg flex flex-col justify-center">
                    <WCAGDisplay textColor={textColor} bgColor={bgColor} />
                </div>
            </div>

            <div className="grid md:grid-cols-[1fr_auto_1fr] items-start gap-4">
                <div className="space-y-2">
                    <ColorSliders title="Text Color" hsl={textHsl} onChange={setTextHsl} />
                </div>
                <div className="flex flex-col h-full items-center justify-center pt-6 gap-2">
                    <Button onClick={handleRandomize} size="icon" variant="outline" aria-label="Randomize Colors">
                        <Dices className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleSwap} size="icon" variant="outline" aria-label="Swap Colors">
                        <ArrowRightLeft className="h-4 w-4" />
                    </Button>
                </div>
                 <div className="space-y-2">
                    <ColorSliders title="Background Color" hsl={bgHsl} onChange={setBgHsl} />
                </div>
            </div>
        </div>
    );
}
