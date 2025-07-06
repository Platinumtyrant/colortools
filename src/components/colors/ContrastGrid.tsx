
"use client";

import React from 'react';
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from '../ui/separator';

extend([a11yPlugin]);

interface ContrastGridProps {
  colors: string[];
}

const ContrastCell = ({ fg, bg }: { fg: string, bg: string }) => {
  if (fg === bg) {
    return (
      <div className="w-7 h-7 flex items-center justify-center bg-muted/50 rounded-sm">
        <div className="w-full h-px bg-border -rotate-45" />
      </div>
    );
  }

  const contrast = colord(fg).contrast(bg);
  const aa_normal = contrast >= 4.5;
  const aa_large = contrast >= 3;

  let bgColor = 'bg-red-500/10 dark:bg-red-900/30';
  let textColor = 'text-red-600 dark:text-red-400';
  
  if (aa_large) {
      bgColor = 'bg-yellow-500/10 dark:bg-yellow-800/30';
      textColor = 'text-yellow-600 dark:text-yellow-400';
  }
  if (aa_normal) {
      bgColor = 'bg-green-500/10 dark:bg-green-900/30';
      textColor = 'text-green-600 dark:text-green-400';
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("w-7 h-7 flex items-center justify-center rounded-sm text-xs font-mono font-medium", bgColor, textColor)}>
            {contrast.toFixed(1)}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs text-muted-foreground">Contrast: <span className="font-bold text-foreground">{contrast.toFixed(2)}</span></p>
          <p className="text-xs text-muted-foreground">Text on Background</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: fg }}></div>
            <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: bg }}></div>
          </div>
          <Separator className="my-2" />
          <div className="text-xs space-y-1">
            <p className={cn(aa_normal ? "text-green-500" : "text-red-500")}>AA Normal: {aa_normal ? 'Pass' : 'Fail'}</p>
            <p className={cn(aa_large ? "text-green-500" : "text-red-500")}>AA Large: {aa_large ? 'Pass' : 'Fail'}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const ContrastGrid = ({ colors }: ContrastGridProps) => {
  if (colors.length < 2) return null;

  return (
    <div className="space-y-2">
       <div className="text-sm font-medium">Contrast Grid</div>
       <div className="text-xs text-muted-foreground">Text color (vertical) on background color (horizontal).</div>
      <div className="flex gap-1">
        <div className="w-7 shrink-0" />
        <div className="flex gap-1">
          {colors.map((color, index) => (
            <div key={index} className="w-7 h-7 rounded-full border" style={{ backgroundColor: color }} />
          ))}
        </div>
      </div>
      {colors.map((fgColor, fgIndex) => (
        <div key={fgIndex} className="flex gap-1 items-center">
          <div className="w-7 h-7 rounded-full border shrink-0" style={{ backgroundColor: fgColor }} />
          <div className="flex gap-1">
            {colors.map((bgColor, bgIndex) => (
              <ContrastCell key={`${fgIndex}-${bgIndex}`} fg={fgColor} bg={bgColor} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
