
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
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2, Library, Palette as PaletteIcon, Copy, MousePointerClick, Lock, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";


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
    const allDescriptiveNames = useAllDescriptiveColorNames(color);

    const primary = name 
        ? { name, source: 'Pantone' } 
        : allDescriptiveNames.primary;
        
    const allNames = name 
        ? [
            { source: 'Pantone', name },
            ...allDescriptiveNames.all.filter(n => n.name.toLowerCase() !== name.toLowerCase())
          ]
        : allDescriptiveNames.all;
        
    const { toast } = useToast();
    
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent the popover from opening
        const hex = colord(color).toHex().toUpperCase();
        navigator.clipboard.writeText(hex).then(() => {
            toast({ title: "Copied!", description: `${hex} copied to clipboard.` });
        });
    };

    if (variant === 'default') {
        return (
             <Card className="overflow-hidden shadow-sm group w-full h-full flex flex-col cursor-pointer">
                <div className="relative h-60 w-full" style={{ backgroundColor: color }}>
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                        <TooltipProvider>
                            {onAddToLibrary && (
                                <Tooltip><TooltipTrigger asChild>
                                    <Button size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onAddToLibrary(); }}>
                                        <Library className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger><TooltipContent><p>Save to Library</p></TooltipContent></Tooltip>
                            )}
                            {onRemoveFromLibrary && (
                                <Tooltip><TooltipTrigger asChild>
                                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onRemoveFromLibrary(); }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger><TooltipContent><p>Remove from Library</p></TooltipContent></Tooltip>
                            )}
                        </TooltipProvider>
                    </div>
                </div>
                <CardContent className="p-4 flex-grow flex flex-col justify-start">
                    <div className="text-center mb-4">
                        <p className="font-semibold text-lg" title={primary.name}>{primary.name}</p>
                        <p className="text-xs text-muted-foreground">{primary.source}</p>
                    </div>

                    <div className="space-y-4">
                        <ColorDetails color={color} />
                        {allNames.length > 1 && (
                            <>
                                <Separator className="my-4" />
                                <div className="space-y-1 text-sm">
                                    <h4 className="font-medium text-xs text-muted-foreground mb-2">OTHER NAMES</h4>
                                    {allNames.slice(1).map((nameObj) => (
                                        <div key={nameObj.source} className="grid grid-cols-2 items-center gap-x-2 text-xs">
                                            <span className="text-muted-foreground whitespace-nowrap">{nameObj.source}</span>
                                            <span className="font-medium text-right truncate">{nameObj.name}</span> 
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
                <div className="group/container flex flex-col h-full w-full cursor-pointer bg-card text-card-foreground shadow-sm overflow-hidden rounded-md">
                    <div
                        className="relative h-9 w-full rounded-b-md"
                        style={{ backgroundColor: color }}
                    >
                        <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 transform flex-row gap-1 opacity-0 transition-opacity group-hover/container:opacity-100">
                             <TooltipProvider delayDuration={200}>
                                {onSetActiveColor && (
                                     <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7 bg-black/20 hover:bg-black/40 text-white" onClick={(e) => { e.stopPropagation(); onSetActiveColor(); }}><MousePointerClick className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Set as Active Color</p></TooltipContent></Tooltip>
                                )}
                                {onLockToggle && (
                                     <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7 bg-black/20 hover:bg-black/40 text-white" onClick={(e) => { e.stopPropagation(); onLockToggle(); }}>{isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}</Button></TooltipTrigger><TooltipContent><p>{isLocked ? "Unlock Color" : "Lock Color"}</p></TooltipContent></Tooltip>
                                )}
                                 <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7 bg-black/20 hover:bg-black/40 text-white" onClick={handleCopy}><Copy className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Copy HEX</p></TooltipContent></Tooltip>
                                {onAddToLibrary && (
                                     <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7 bg-black/20 hover:bg-black/40 text-white" onClick={(e) => { e.stopPropagation(); onAddToLibrary(); }}><Library className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Save to Library</p></TooltipContent></Tooltip>
                                )}
                                {onRemoveFromLibrary && (
                                     <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7 bg-rose-500/50 hover:bg-rose-500/80 text-white" onClick={(e) => { e.stopPropagation(); onRemoveFromLibrary(); }}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Remove from Library</p></TooltipContent></Tooltip>
                                )}
                                {onAddToPalette && (
                                     <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7 bg-black/20 hover:bg-black/40 text-white" onClick={(e) => { e.stopPropagation(); onAddToPalette(); }}><PaletteIcon className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Add to Current Palette</p></TooltipContent></Tooltip>
                                )}
                                {onRemoveFromPalette && (
                                     <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7 bg-rose-500/50 hover:bg-rose-500/80 text-white" onClick={(e) => { e.stopPropagation(); onRemoveFromPalette(); }}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Remove from Palette</p></TooltipContent></Tooltip>
                                )}
                            </TooltipProvider>
                        </div>
                    </div>
                    <div className="p-2 flex-grow">
                        <div className="flex items-center justify-between">
                            <p className="font-semibold text-xs truncate" title={primary.name}>{primary.name}</p>
                            {primary.source === 'Pantone' && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-auto border-primary/50 text-primary/80 shrink-0">PANTONE</Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{color.toUpperCase()}</p>
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <div className="h-24 w-full rounded-t-md" style={{backgroundColor: color}} />
                <div className="p-3">
                    <p className="font-semibold text-base text-center mb-2" title={primary.name}>{primary.name}</p>
                    <ColorDetails color={color} />
                     {allNames.length > 1 && (
                        <>
                            <Separator className="my-3"/>
                            <div className="space-y-1 text-sm">
                                <h4 className="font-medium text-xs text-muted-foreground mb-2">OTHER NAMES</h4>
                                {allNames.slice(1).map((nameObj) => (
                                    <div key={nameObj.source} className="grid grid-cols-2 items-center gap-x-2 text-xs">
                                        <span className="text-muted-foreground whitespace-nowrap">{nameObj.source}</span>
                                        <span className="font-medium text-right truncate">{nameObj.name}</span> 
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
