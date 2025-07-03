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
                setHsl({ h: hsl.h, s: newHsl.s, l: newHsl.l });
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
                    className="flex-1 p-2 rounded-md bg-muted text-center font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-ring"
                    prefixed
                />
            </div>
            <div className="space-y-2">
                <Label className="text-xs">Hue</Label>
                <Slider value={[hsl.h]} onValueChange={([v]) => handleHslChange('h', v)} max={360} step={1} />
            </div>
            <div className="space-y-2">
                <Label className="text-xs">Saturation</Label>
                <Slider value={[hsl.s]} onValueChange={([v]) => handleHslChange('s', v)} max={100} step={1} />
            </div>
            <div className="space-y-2">
                <Label className="text-xs">Lightness</Label>
                <Slider value={[hsl.l]} onValueChange={([v]) => handleHslChange('l', v)} max={100} step={1} />
            </div>
        </div>
    );
};

const ResultBadge = ({ passed, text }: { passed: boolean, text: string }) => {
  const Icon = passed ? CheckCircle2 : XCircle;
  return (
    <div className={cn(
      "flex items-center justify-center gap-1.5 p-1.5 rounded-md font-medium text-xs",
      passed ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
    )}>
      <Icon className="h-4 w-4" />
      <span>{text}</span>
    </div>
  )
}

export const ContrastChecker = () => {
    const [textHsl, setTextHsl] = useState<HslColor>(colord('#1a1a1a').toHsl());
    const [bgHsl, setBgHsl] = useState<HslColor>(colord('#ffffff').toHsl());

    const textColor = useMemo(() => colord(textHsl).toHex(), [textHsl]);
    const bgColor = useMemo(() => colord(bgHsl).toHex(), [bgHsl]);

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
        <Card>
            <CardHeader>
                <CardTitle>Contrast Checker</CardTitle>
                <CardDescription>Check color contrast for WCAG compliance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div 
                    className="relative flex flex-col h-64 w-full transition-colors duration-200 rounded-lg border p-4 items-center justify-center"
                    style={{ backgroundColor: bgColor, color: textColor }}
                >
                    <h2 className="text-7xl font-bold select-none">Aa</h2>
                    <p className="font-semibold">Some sample text</p>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                    <div className='flex justify-between items-center mb-4'>
                        <div className="font-semibold">WCAG Conformance</div>
                        <div className="bg-background text-foreground p-2 rounded-lg text-center border">
                            <p className="text-xl font-bold">{contrastRatio.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">Ratio</p>
                        </div>
                    </div>
                     <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="font-bold text-muted-foreground"></div>
                        <div className="font-bold text-muted-foreground">Normal Text</div>
                        <div className="font-bold text-muted-foreground">Large Text</div>
                        
                        <div className="font-bold flex items-center justify-center">AA</div>
                        <ResultBadge passed={results.aa.normal} text={results.aa.normal ? "Pass" : "Fail"} />
                        <ResultBadge passed={results.aa.large} text={results.aa.large ? "Pass" : "Fail"} />

                        <div className="font-bold flex items-center justify-center">AAA</div>
                        <ResultBadge passed={results.aaa.normal} text={results.aaa.normal ? "Pass" : "Fail"} />
                        <ResultBadge passed={results.aaa.large} text={results.aaa.large ? "Pass" : "Fail"} />
                   </div>
                </div>

                <div className="grid md:grid-cols-[1fr_auto_1fr] items-start gap-4">
                    <div className="space-y-2">
                        <Label>Text Color</Label>
                        <ColorControlGroup hsl={textHsl} setHsl={setTextHsl} />
                    </div>
                    <div className="flex flex-col h-full items-center justify-center pt-8 gap-2">
                        <Button onClick={handleRandomize} size="icon" variant="outline" aria-label="Randomize Colors">
                            <Dices className="h-4 w-4" />
                        </Button>
                        <Button onClick={handleSwap} size="icon" variant="outline" aria-label="Swap Colors">
                            <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                    </div>
                     <div className="space-y-2">
                        <Label>Background Color</Label>
                        <ColorControlGroup hsl={bgHsl} setHsl={setBgHsl} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
