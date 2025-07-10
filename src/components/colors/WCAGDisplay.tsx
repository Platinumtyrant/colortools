"use client";

import React, { useMemo } from 'react';
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

extend([a11yPlugin]);

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

interface WCAGDisplayProps {
    textColor: string;
    bgColor: string;
}

export const WCAGDisplay = ({ textColor, bgColor }: WCAGDisplayProps) => {
    const contrastRatio = useMemo(() => {
        if (!colord(textColor).isValid() || !colord(bgColor).isValid()) return 0;
        return colord(textColor).contrast(bgColor);
    }, [textColor, bgColor]);

    const results = useMemo(() => {
        if (!colord(textColor).isValid() || !colord(bgColor).isValid()) {
            return { aa: { normal: false, large: false }, aaa: { normal: false, large: false } };
        };
        return {
            aa: {
                normal: colord(textColor).isReadable(bgColor, { level: 'AA', size: 'normal' }),
                large: colord(textColor).isReadable(bgColor, { level: 'AA', size: 'large' }),
            },
            aaa: {
                normal: colord(textColor).isReadable(bgColor, { level: 'AAA', size: 'normal' }),
                large: colord(textColor).isReadable(bgColor, { level: 'AAA', size: 'large' }),
            }
        }
    }, [textColor, bgColor]);

    return (
        <div className="bg-muted/50 p-4 rounded-lg flex flex-col justify-center">
            <div className='flex justify-between items-center mb-4'>
                <div className="font-semibold text-sm">WCAG Compliance</div>
                <div className="bg-background text-foreground p-2 rounded-lg text-center border">
                    <p className="text-lg font-bold">{contrastRatio.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Ratio</p>
                </div>
            </div>
            <TooltipProvider>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="font-bold text-muted-foreground"></div>
                    <div className="font-bold text-muted-foreground">Normal Text</div>
                    <div className="font-bold text-muted-foreground">Large Text</div>
                    
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="font-bold flex items-center justify-center gap-1 cursor-help underline decoration-dotted decoration-from-font">
                                AA
                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="max-w-xs">Level AA requires a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text. This is the standard for most web content.</p>
                        </TooltipContent>
                    </Tooltip>

                    <ResultBadge passed={results.aa.normal} text={results.aa.normal ? "Pass" : "Fail"} />
                    <ResultBadge passed={results.aa.large} text={results.aa.large ? "Pass" : "Fail"} />
                    
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <div className="font-bold flex items-center justify-center gap-1 cursor-help underline decoration-dotted decoration-from-font">
                                AAA
                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="max-w-xs">Level AAA requires a contrast ratio of at least 7:1 for normal text and 4.5:1 for large text. This is an enhanced standard for accessibility.</p>
                        </TooltipContent>
                    </Tooltip>

                    <ResultBadge passed={results.aaa.normal} text={results.aaa.normal ? "Pass" : "Fail"} />
                    <ResultBadge passed={results.aaa.large} text={results.aaa.large ? "Pass" : "Fail"} />
                </div>
            </TooltipProvider>
        </div>
    );
};
