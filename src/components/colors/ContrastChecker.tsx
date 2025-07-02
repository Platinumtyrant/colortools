
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { colord, extend, type HslColor } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import { HexColorInput } from 'react-colorful';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, CheckCircle2, XCircle, Dices } from 'lucide-react';
import { cn } from '@/lib/utils';

extend([a11yPlugin]);

const ColorControlGroup = ({ hsl, setHsl }: { hsl: HslColor, setHsl: (hsl: HslColor) => void }) => {
    const color = useMemo(() => colord(hsl).toHex(), [hsl]);

    const handleHslChange = useCallback((key: 'h' | 's' | 'l', value: number) => {
        setHsl({ ...hsl, [key]: value });
    }, [hsl, setHsl]);

    const handleHexChange = useCallback((newHex: string) => {
        if (colord(newHex).isValid()) {
            const newColor = colord(newHex);
            const newHsl = newColor.toHsl();
            
            if (newHsl.s === 0 || newHsl.l === 0 || newHsl.l === 100) {
                setHsl({ h: hsl.h, s: newHsl.s, l: newHsl.l, a: newHsl.a });
            } else {
                setHsl(newHsl);
            }
        }
    }, [hsl, setHsl]);

    return (
        <div className="space-y-4">
            <div className="flex gap-4 items-center">
                 <HexColorInput
                    color={color}
                    onChange={handleHexChange}
                    className="flex-1 p-2 rounded-md bg-transparent text-center font-mono text-lg uppercase focus:outline-none focus:ring-2 focus:ring-ring"
                    prefixed
                />
            </div>
            <div className="space-y-2">
                <Label>Hue</Label>
                <Slider value={[hsl.h]} onValueChange={([v]) => handleHslChange('h', v)} max={360} step={1} />
            </div>
            <div className="space-y-2">
                <Label>Saturation</Label>
                <Slider value={[hsl.s]} onValueChange={([v]) => handleHslChange('s', v)} max={100} step={1} />
            </div>
            <div className="space-y-2">
                <Label>Lightness</Label>
                <Slider value={[hsl.l]} onValueChange={([v]) => handleHslChange('l', v)} max={100} step={1} />
            </div>
        </div>
    );
};

const ResultBadge = ({ passed, text }: { passed: boolean, text: string }) => {
  const Icon = passed ? CheckCircle2 : XCircle;
  return (
    <div className={cn(
      "flex items-center justify-center gap-2 p-2 rounded-md font-medium text-sm",
      passed ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'
    )}>
      <Icon className="h-5 w-5" />
      <span>{text}</span>
    </div>
  )
}

export const ContrastChecker = () => {
    const [textHsl, setTextHsl] = useState<HslColor>(colord('#FFFFFF').toHsl());
    const [bgHsl, setBgHsl] = useState<HslColor>(colord('#1a1a1a').toHsl());

    const textColor = useMemo(() => colord(textHsl).toHex(), [textHsl]);
    const bgColor = useMemo(() => colord(bgHsl).toHex(), [bgHsl]);

    const primaryHsl = useMemo(() => {
        const { h, s, l } = colord(textColor).toHsl();
        return `${h} ${s}% ${l}%`;
    }, [textColor]);

    const contrastRatio = useMemo(() => {
        return colord(textColor).contrast(bgColor);
    }, [textColor, bgColor]);

    const results = useMemo(() => ({
        aa: {
            normal: colord(textColor).isReadable(bgColor, { level: 'AA', size: 'normal' }),
            large: colord(textColor).isReadable(bgColor, { level: 'AA', size: 'large' }),
        },
        aaa: {
            normal: colord(textColor).isReadable(bgColor, { level: 'AAA', size: 'normal' }),
            large: colord(textColor).isReadable(bgColor, { level: 'AAA', size: 'large' }),
        }
    }), [textColor, bgColor]);
    
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
        <main 
            className="relative flex flex-col min-h-[calc(100vh-65px)] w-full transition-colors duration-200"
            style={{ 
                backgroundColor: bgColor,
                color: textColor,
                '--primary': primaryHsl,
                '--ring': primaryHsl,
            } as React.CSSProperties}
        >
            <div className="flex-grow flex items-end justify-start p-8 relative">
                <div className="absolute top-8 right-8 z-10 flex justify-end">
                     <Card className="bg-background/10 text-current backdrop-blur-sm max-w-2xl">
                        <CardHeader>
                            <div className='flex justify-between items-start'>
                                <div>
                                    <CardTitle>WCAG Conformance</CardTitle>
                                    <CardDescription className="text-current/80">
                                        Based on WCAG 2.1 guidelines.
                                    </CardDescription>
                                </div>
                                <div className="bg-current/10 text-current p-2 rounded-lg text-center">
                                    <p className="text-2xl font-bold">{contrastRatio.toFixed(2)}</p>
                                    <p className="text-xs text-current/80">Contrast Ratio</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div className="font-bold text-current/80 hidden md:block">Conformance</div>
                                <div className="font-bold text-current/80">Normal Text (16pt)</div>
                                <div className="font-bold text-current/80">Large Text (18pt+)</div>
                                
                                <div className="font-bold flex items-center justify-center">AA</div>
                                <ResultBadge passed={results.aa.normal} text={results.aa.normal ? "Pass" : "Fail"} />
                                <ResultBadge passed={results.aa.large} text={results.aa.large ? "Pass" : "Fail"} />

                                <div className="font-bold flex items-center justify-center">AAA</div>
                                <ResultBadge passed={results.aaa.normal} text={results.aaa.normal ? "Pass" : "Fail"} />
                                <ResultBadge passed={results.aaa.large} text={results.aaa.large ? "Pass" : "Fail"} />
                           </div>
                        </CardContent>
                    </Card>
                </div>
                <h1 className="text-[28vw] lg:text-[22vw] font-bold select-none">Aa</h1>
            </div>

            <div className="flex-shrink-0 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="grid md:grid-cols-[1fr_auto_1fr] items-start gap-8">
                        <ColorControlGroup hsl={textHsl} setHsl={setTextHsl} />
                        <div className="flex flex-col h-full items-center justify-center pt-8 gap-4">
                            <Button onClick={handleRandomize} size="icon" variant="ghost" aria-label="Randomize Colors" className="hover:bg-current/10">
                                <Dices />
                            </Button>
                            <Button onClick={handleSwap} size="icon" variant="ghost" aria-label="Swap Colors" className="hover:bg-current/10">
                                <ArrowRightLeft />
                            </Button>
                        </div>
                        <ColorControlGroup hsl={bgHsl} setHsl={setBgHsl} />
                    </div>
                </div>
            </div>
        </main>
    )
}
