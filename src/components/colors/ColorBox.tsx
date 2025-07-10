
"use client";

import React from "react";
import { colord, extend } from "colord";
import namesPlugin from "colord/plugins/names";
import cmykPlugin from "colord/plugins/cmyk";
import lchPlugin from 'colord/plugins/lch';
import labPlugin from 'colord/plugins/lab';
import { useAllDescriptiveColorNames } from "@/lib/colors";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2, Library, Palette as PaletteIcon, Copy, MousePointerClick, Lock, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { cn } from "@/lib/utils";
import { buttonVariants } from "../ui/button";


extend([namesPlugin, cmykPlugin, lchPlugin, labPlugin]);

interface ColorBoxProps {
  color: string;
  name?: string;
  info?: string;
  variant?: 'default' | 'compact';
  popoverActions?: React.ReactNode;
  onAddToLibrary?: () => void;
  onRemoveFromLibrary?: () => void;
  onAddToPalette?: () => void;
  onRemoveFromPalette?: () => void;
  onLockToggle?: () => void;
  onSetActiveColor?: () => void;
  isLocked?: boolean;
}


const DetailRow = ({ label, value, onCopy }: { label: string, value: string, onCopy: () => void }) => (
    <div 
        className="grid grid-cols-[minmax(50px,max-content)_1fr] items-center gap-x-4 cursor-pointer p-1 -m-1 hover:bg-muted rounded-sm"
        onClick={onCopy}
    >
        <span className="text-muted-foreground whitespace-nowrap">{label}</span>
        <span className="font-mono font-semibold text-right truncate">{value}</span> 
    </div>
);


export const ColorDetails = ({ color }: { color: string }) => {
    const { toast } = useToast();
    const colorInstance = colord(color);
    
    const handleCopy = (textToCopy: string, type: string) => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            toast({ title: `${type} copied!`, description: textToCopy });
        });
    };
    
    const hex = colorInstance.toHex().toUpperCase();
    const rgb = colorInstance.toRgbString();
    const hsl = colorInstance.toHslString();
    const cmykObj = colorInstance.toCmyk();
    const cmyk = `cmyk(${cmykObj.c}, ${cmykObj.m}, ${cmykObj.y}, ${cmykObj.k})`;
    const lchObj = colorInstance.toLch();
    const lch = `lch(${lchObj.l.toFixed(0)}, ${lchObj.c.toFixed(0)}, ${lchObj.h.toFixed(0)})`;


    return (
        <div className="space-y-1 text-sm">
             <DetailRow label="HEX" value={hex} onCopy={() => handleCopy(hex, 'HEX')} />
             <DetailRow label="RGB" value={rgb} onCopy={() => handleCopy(rgb, 'RGB')} />
             <DetailRow label="HSL" value={hsl} onCopy={() => handleCopy(hsl, 'HSL')} />
             <DetailRow label="CMYK" value={cmyk} onCopy={() => handleCopy(cmyk, 'CMYK')} />
             <DetailRow label="LCH" value={lch} onCopy={() => handleCopy(lch, 'LCH')} />
        </div>
    );
};

const ActionIcon = ({ children, onClick, title, variant='ghost', className }: { 
    children: React.ReactNode, 
    onClick: (e: React.MouseEvent | React.KeyboardEvent) => void, 
    title: string,
    variant?: 'ghost' | 'destructive',
    className?: string
}) => {
    const finalClassName = variant === 'destructive' 
        ? "bg-rose-500/50 hover:bg-rose-500/80 text-white" 
        : "bg-black/20 hover:bg-black/40 text-white";

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div 
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); onClick(e); }}
                    onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); onClick(e); }}}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'icon'}), "h-7 w-7", finalClassName, className)}
                >
                    {children}
                </div>
            </TooltipTrigger>
            <TooltipContent><p>{title}</p></TooltipContent>
        </Tooltip>
    );
};


const ColorBoxInner = ({
    color,
    name,
    info,
    variant = 'compact',
    popoverActions,
    onAddToLibrary,
    onRemoveFromLibrary,
    onAddToPalette,
    onRemoveFromPalette,
    onLockToggle,
    onSetActiveColor,
    isLocked,
}: ColorBoxProps) => {

    if (!color || !colord(color).isValid()) {
      return (
        <div className="w-40 h-[72px] rounded-md border border-destructive bg-destructive/10 flex items-center justify-center p-2">
            <p className="text-xs text-center text-destructive">Invalid color data provided.</p>
        </div>
      )
    }

    const allDescriptiveColorNames = useAllDescriptiveColorNames(color);

    const primary = name 
        ? { name, source: 'USAF' }
        : allDescriptiveColorNames.primary;
        
    const allNames = name 
        ? [
            { source: 'USAF', name },
            ...allDescriptiveColorNames.all.filter(n => n.name.toLowerCase() !== name.toLowerCase())
          ]
        : allDescriptiveColorNames.all;
        
    const { toast } = useToast();
    
    const handleCopy = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation(); // Prevent the popover from opening
        const hex = colord(color).toHex().toUpperCase();
        navigator.clipboard.writeText(hex).then(() => {
            toast({ title: "Copied!", description: `${hex} copied to clipboard.` });
        });
    };

    if (variant === 'default') {
        return (
             <Card className="overflow-hidden shadow-sm group w-full h-full flex flex-col cursor-pointer">
                <div className="relative w-full aspect-[2.35/1]" style={{ backgroundColor: color }}>
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                        <TooltipProvider>
                            {onAddToLibrary && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div role="button" tabIndex={0} onClick={(e) => {e.stopPropagation(); onAddToLibrary()}} onKeyDown={(e) => {if(e.key === 'Enter' || e.key === ' ') onAddToLibrary()}} className={cn(buttonVariants({size: 'icon'}), "h-8 w-8")}>
                                      <Library className="h-4 w-4" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Save to Library</p></TooltipContent>
                                </Tooltip>
                            )}
                            {onRemoveFromLibrary && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div role="button" tabIndex={0} onClick={(e) => {e.stopPropagation(); onRemoveFromLibrary()}} onKeyDown={(e) => {if(e.key === 'Enter' || e.key === ' ') onRemoveFromLibrary()}} className={cn(buttonVariants({size: 'icon', variant: 'destructive'}), "h-8 w-8")}>
                                      <Trash2 className="h-4 w-4" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Remove from Library</p></TooltipContent>
                                </Tooltip>
                            )}
                        </TooltipProvider>
                    </div>
                </div>
                <CardContent className="p-4 flex-grow flex flex-col justify-start">
                    <div className="space-y-4">
                        <ColorDetails color={color} />
                        {allNames.length > 0 && (
                            <>
                                <Separator className="my-4" />
                                <div className="space-y-1 text-sm">
                                    <h4 className="font-medium text-xs text-muted-foreground mb-2 uppercase tracking-wider">Descriptive Names</h4>
                                    {allNames.map((nameObj) => (
                                        <div key={nameObj.name} className="flex justify-between items-baseline gap-x-2 text-xs">
                                            <span className="font-medium truncate" title={nameObj.name}>{nameObj.name}</span>
                                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-auto border-primary/50 text-primary/80 shrink-0">{nameObj.source}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="group/container flex flex-col h-full w-full cursor-pointer text-card-foreground overflow-hidden rounded-md text-left"
                >
                    <div
                        className="relative h-9 w-full rounded-b-md"
                        style={{ backgroundColor: color }}
                    >
                        <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 transform flex-row gap-1 opacity-0 transition-opacity group-hover/container:opacity-100">
                             <TooltipProvider delayDuration={200}>
                                {onSetActiveColor && <ActionIcon onClick={() => onSetActiveColor()} title="Set as Active Color"><MousePointerClick className="h-4 w-4" /></ActionIcon>}
                                {onLockToggle && <ActionIcon onClick={() => onLockToggle()} title={isLocked ? "Unlock Color" : "Lock Color"}>{isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}</ActionIcon>}
                                <ActionIcon onClick={handleCopy} title="Copy HEX"><Copy className="h-4 w-4" /></ActionIcon>
                                {onAddToLibrary && <ActionIcon onClick={() => onAddToLibrary()} title="Save to Library"><Library className="h-4 w-4" /></ActionIcon>}
                                {onRemoveFromLibrary && <ActionIcon onClick={() => onRemoveFromLibrary()} title="Remove from Library" variant="destructive"><Trash2 className="h-4 w-4" /></ActionIcon>}
                                {onAddToPalette && <ActionIcon onClick={() => onAddToPalette()} title="Add to Current Palette"><PaletteIcon className="h-4 w-4" /></ActionIcon>}
                                {onRemoveFromPalette && <ActionIcon onClick={() => onRemoveFromPalette()} title="Remove from Palette" variant="destructive"><Trash2 className="h-4 w-4" /></ActionIcon>}
                            </TooltipProvider>
                        </div>
                    </div>
                    <div className="p-2 flex-grow">
                        <div className="flex items-center gap-2">
                             {primary.source === 'Pantone' && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-auto border-primary/50 text-primary/80 shrink-0">PANTONE</Badge>
                            )}
                             {primary.source === 'USAF' && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-auto border-green-600/50 bg-green-500/10 text-green-700 dark:border-green-400/50 dark:text-green-400/80 shrink-0">USAF</Badge>
                            )}
                            <p className="font-semibold text-xs truncate" title={primary.name}>{primary.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{color.toUpperCase()}</p>
                        {info && <p className="text-xs text-muted-foreground font-mono truncate">{info}</p>}
                    </div>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <div className="h-24 w-full rounded-t-md" style={{backgroundColor: color}} />
                <div className="p-3">
                    <p className="font-semibold text-base text-center mb-2" title={primary.name}>{primary.name}</p>
                    <ColorDetails color={color} />
                     {allNames.length > 0 && (
                        <>
                            <Separator className="my-3"/>
                            <div className="space-y-1 text-sm">
                                <h4 className="font-medium text-xs text-muted-foreground mb-2 uppercase tracking-wider">Descriptive Names</h4>
                                {allNames.map((nameObj) => (
                                    <div key={nameObj.name} className="flex justify-between items-baseline gap-x-2 text-xs">
                                        <span className="font-medium truncate" title={nameObj.name}>{nameObj.name}</span>
                                        <span className="text-muted-foreground whitespace-nowrap shrink-0">{nameObj.source}</span> 
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                    {popoverActions && (
                        <>
                            <Separator className="my-3"/>
                            {popoverActions}
                        </>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export const ColorBox = React.memo(ColorBoxInner);
ColorBox.displayName = 'ColorBox';

    
