
"use client";

import React from "react";
import { colord, extend } from "colord";
import namesPlugin from "colord/plugins/names";
import cmykPlugin from "colord/plugins/cmyk";
import lchPlugin from 'colord/plugins/lch';
import labPlugin from 'colord/plugins/lab';
import { useDescriptiveColorName } from "@/lib/colors";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "../ui/separator";

extend([namesPlugin, cmykPlugin, lchPlugin, labPlugin]);

interface ColorBoxProps {
  color: string;
  name?: string;
  info?: string;
  onActionClick?: (e: React.MouseEvent) => void;
  actionIcon?: React.ReactNode;
  actionTitle?: string;
  variant?: 'default' | 'compact';
  popoverActions?: React.ReactNode;
}

const DetailRow = ({ label, value, onCopy }: { label: string, value: string, onCopy: () => void }) => (
    <div 
        className="grid grid-cols-[minmax(50px,max-content)_1fr] items-center gap-x-4 cursor-pointer p-1 -m-1 hover:bg-muted rounded-sm"
        onClick={onCopy}
    >
        <span className="text-muted-foreground whitespace-nowrap">{label}</span>
        <span className="font-mono font-semibold text-right break-all">{value}</span> 
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
    const cmyk = colorInstance.toCmykString();
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
    onActionClick,
    actionIcon,
    actionTitle = "Default Action",
    variant = 'compact',
    popoverActions
}: ColorBoxProps) => {
    const { name: descriptiveName, source } = name ? { name, source: 'pantone' } : useDescriptiveColorName(color);
    
    if (variant === 'default') {
        return (
             <Card className="overflow-hidden shadow-sm group w-full h-full flex flex-col cursor-pointer">
                <div className="relative h-80 w-full" style={{ backgroundColor: color }}>
                    {onActionClick && (
                        <div className="absolute top-2 right-2 flex gap-1">
                            <Button size="icon" className="h-8 w-8" onClick={onActionClick} title={actionTitle}>
                                {actionIcon}
                            </Button>
                        </div>
                    )}
                </div>
                <CardContent className="p-4 flex-grow flex flex-col justify-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <p className="font-semibold text-lg text-center" title={descriptiveName}>{descriptiveName}</p>
                        {source === 'pantone' && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5 h-auto border-primary/50 text-primary/80 shrink-0">PANTONE</Badge>
                        )}
                    </div>
                    <ColorDetails color={color} />
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Card className="overflow-hidden shadow-sm group w-full cursor-pointer h-full">
                    <div
                        className="relative h-20 w-full"
                        style={{ backgroundColor: color }}
                    >
                         {onActionClick && (
                             <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" className="h-7 w-7 bg-black/20 hover:bg-black/40 text-white" onClick={onActionClick} title={actionTitle}>
                                    {actionIcon || <Plus className="h-4 w-4" />}
                                </Button>
                            </div>
                         )}
                    </div>
                    <CardContent className="p-2">
                        <div className="flex items-center justify-between">
                            <p className="font-semibold text-xs truncate" title={descriptiveName}>{descriptiveName}</p>
                            {source === 'pantone' && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-auto border-primary/50 text-primary/80 shrink-0">PANTONE</Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{info || color.toUpperCase()}</p>
                    </CardContent>
                </Card>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0">
                <div className="h-24 w-full rounded-t-md" style={{backgroundColor: color}} />
                <div className="p-3">
                    <p className="font-semibold text-base text-center mb-2" title={descriptiveName}>{descriptiveName}</p>
                    <ColorDetails color={color} />
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
