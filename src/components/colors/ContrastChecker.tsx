"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { colord, extend, type HslColor } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import { HexColorInput } from 'react-colorful';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

extend([a11yPlugin]);

const ColorEditor = ({ hsl, setHsl, title }: { hsl: HslColor, setHsl: (hsl: HslColor) => void, title: string }) => {
    const color = useMemo(() => colord(hsl).toHex(), [hsl]);
    const c = colord(color);
    const uiTextColor = useMemo(() => (c.isDark() ? '#FFFFFF' : '#000000'), [c]);

    const handleHslChange = useCallback((key: 'h' | 's' | 'l', value: number) => {
        setHsl({ ...hsl, [key]: value });
    }, [hsl, setHsl]);

    const handleHexChange = useCallback((newHex: string) => {
        if (colord(newHex).isValid()) {
            const newColor = colord(newHex);
            const newHsl = newColor.toHsl();
            
            // For grayscale colors, preserve the hue from the state
            // This allows changing hue for black/white/gray and seeing the effect
            // once saturation/lightness is moved away from the extremes.
            if (newHsl.s === 0 || newHsl.l === 0 || newHsl.l === 100) {
                setHsl({ h: hsl.h, s: newHsl.s, l: newHsl.l, a: newHsl.a });
            } else {
                setHsl(newHsl);
            }
        }
    }, [hsl, setHsl]);


    return (
        <div className="flex-1 p-6 md:p-8 transition-colors duration-200 w-full" style={{ backgroundColor: color }}>
            <div className="space-y-6 max-w-xs mx-auto">
                <h2 className="text-3xl font-bold text-center" style={{ color: uiTextColor }}>{title}</h2>
                <div className="flex flex-col gap-2">
                    <Label style={{ color: uiTextColor }}>HEX</Label>
                    <HexColorInput
                        color={color}
                        onChange={handleHexChange}
                        className="w-full p-2 rounded-md bg-white/20 border border-black/20 text-center font-mono text-lg uppercase focus:outline-none focus:ring-2 focus:ring-primary"
                        style={{ color: uiTextColor }}
                        prefixed
                    />
                </div>
                <div className="space-y-2">
                    <Label style={{ color: uiTextColor }}>Hue</Label>
                    <Slider value={[hsl.h]} onValueChange={([v]) => handleHslChange('h', v)} max={360} step={1} />
                </div>
                <div className="space-y-2">
                    <Label style={{ color: uiTextColor }}>Saturation</Label>
                    <Slider value={[hsl.s]} onValueChange={([v]) => handleHslChange('s', v)} max={100} step={1} />
                </div>
                <div className="space-y-2">
                    <Label style={{ color: uiTextColor }}>Lightness</Label>
                    <Slider value={[hsl.l]} onValueChange={([v]) => handleHslChange('l', v)} max={100} step={1} />
                </div>
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

    return (
        <div className="flex flex-col items-center gap-8 w-full">
            <Card className="w-full max-w-6xl p-0 overflow-hidden">
                <div className="relative flex flex-col md:flex-row w-full items-stretch min-h-[400px]">
                    <ColorEditor hsl={textHsl} setHsl={setTextHsl} title="Text Color" />
                    
                    <div className="order-first md:order-none my-4 md:my-0 h-16 md:h-auto md:absolute left-1/2 top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-10 flex flex-col items-center justify-center gap-2">
                        <div className="bg-card text-card-foreground p-4 rounded-lg shadow-2xl text-center border border-border">
                            <p className="text-4xl font-bold">{contrastRatio.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">Contrast Ratio</p>
                        </div>
                        <Button onClick={handleSwap} size="icon" variant="secondary" aria-label="Swap Colors">
                            <ArrowRightLeft />
                        </Button>
                    </div>

                    <ColorEditor hsl={bgHsl} setHsl={setBgHsl} title="Background Color" />
                </div>
            </Card>

            <Card className="w-full max-w-6xl">
                <CardHeader>
                    <CardTitle>WCAG Conformance</CardTitle>
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
        </div>
    )
}
