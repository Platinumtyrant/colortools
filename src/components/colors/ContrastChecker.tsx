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

const ColorControlGroup = ({ hsl, setHsl, title }: { hsl: HslColor, setHsl: (hsl: HslColor) => void, title: string }) => {
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
            <h3 className="text-xl font-semibold">{title}</h3>
            <div className="flex gap-4 items-center">
                 <div className="h-10 w-10 rounded-md border" style={{ backgroundColor: color }} />
                 <HexColorInput
                    color={color}
                    onChange={handleHexChange}
                    className="flex-1 p-2 rounded-md bg-input border border-border text-center font-mono text-lg uppercase focus:outline-none focus:ring-2 focus:ring-ring"
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
        <div className="flex flex-col items-center gap-8 w-full">
            <Card 
                className="w-full max-w-6xl transition-colors duration-200"
                style={{ backgroundColor: bgColor, color: textColor }}
            >
                <CardContent className="flex items-center justify-center p-8 h-64">
                    <h1 className="text-8xl font-bold select-none">Aa</h1>
                </CardContent>
            </Card>

            <Card className="w-full max-w-6xl">
                <CardHeader>
                    <div className='flex justify-between items-center'>
                        <CardTitle>WCAG Conformance</CardTitle>
                        <div className="bg-card text-card-foreground p-2 rounded-lg text-center border border-border">
                            <p className="text-2xl font-bold">{contrastRatio.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">Contrast Ratio</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="font-bold text-muted-foreground hidden md:block">Conformance</div>
                        <div className="font-bold text-muted-foreground">Normal Text (16pt)</div>
                        <div className="font-bold text-muted-foreground">Large Text (18pt+)</div>
                        
                        <div className="font-bold flex items-center justify-center">AA</div>
                        <ResultBadge passed={results.aa.normal} text={results.aa.normal ? "Pass" : "Fail"} />
                        <ResultBadge passed={results.aa.large} text={results.aa.large ? "Pass" : "Fail"} />

                        <div className="font-bold flex items-center justify-center">AAA</div>
                        <ResultBadge passed={results.aaa.normal} text={results.aaa.normal ? "Pass" : "Fail"} />
                        <ResultBadge passed={results.aaa.large} text={results.aaa.large ? "Pass" : "Fail"} />
                   </div>
                   <p className="text-xs text-muted-foreground mt-4 text-center">
                    Based on WCAG 2.1 guidelines. Large text is defined as 18pt (24px) or 14pt (18.66px) bold.
                   </p>
                </CardContent>
            </Card>
            
            <Card className="w-full max-w-6xl">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Color Controls</CardTitle>
                        <Button onClick={handleRandomize} variant="outline">
                            <Dices className="mr-2" />
                            Randomize
                        </Button>
                    </div>
                    <CardDescription>Adjust the text and background colors using the sliders or HEX input.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-[1fr_auto_1fr] items-start gap-8">
                    <ColorControlGroup hsl={textHsl} setHsl={setTextHsl} title="Text Color" />
                     <div className="flex h-full items-center justify-center pt-8">
                        <Button onClick={handleSwap} size="icon" variant="outline" aria-label="Swap Colors">
                            <ArrowRightLeft />
                        </Button>
                    </div>
                    <ColorControlGroup hsl={bgHsl} setHsl={setBgHsl} title="Background Color" />
                </CardContent>
            </Card>
        </div>
    )
}
