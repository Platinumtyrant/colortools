
"use client";

import React, { useState } from "react";
import { colord, extend } from "colord";
import namesPlugin from "colord/plugins/names";
import cmykPlugin from "colord/plugins/cmyk";
import lchPlugin from "colord/plugins/lch";
import labPlugin from "colord/plugins/lab";
import { getDescriptiveColorName, saveColorToLibrary } from "@/lib/colors";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Info, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

extend([namesPlugin, cmykPlugin, lchPlugin, labPlugin]);

interface ColorBoxProps {
  color: string;
  name?: string;
  info?: string;
  onActionClick?: (e: React.MouseEvent) => void;
  actionIcon?: React.ReactNode;
  actionTitle?: string;
  variant?: 'default' | 'compact';
}

const ColorDetails = ({ color }: { color: string }) => {
    const { toast } = useToast();
    const colorInstance = colord(color);
    const descriptiveName = getDescriptiveColorName(color);

    const handleCopy = (textToCopy: string, type: string) => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            toast({ title: `${type} copied!`, description: textToCopy });
        });
    };

    return (
        <div className="space-y-1 text-sm p-4">
            <h4 className="font-bold text-center mb-2">{descriptiveName}</h4>
             <div className="flex justify-between items-center cursor-pointer p-1 -m-1 hover:bg-muted rounded-sm" onClick={() => handleCopy(colorInstance.toHex().toUpperCase(), 'HEX')}>
                <span className="text-muted-foreground">HEX</span>
                <span className="font-mono font-semibold">{colorInstance.toHex().toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center cursor-pointer p-1 -m-1 hover:bg-muted rounded-sm" onClick={() => handleCopy(colorInstance.toRgbString(), 'RGB')}>
                <span className="text-muted-foreground">RGB</span>
                <span className="font-mono font-semibold">{colorInstance.toRgbString()}</span>
            </div>
            <div className="flex justify-between items-center cursor-pointer p-1 -m-1 hover:bg-muted rounded-sm" onClick={() => handleCopy(colorInstance.toHslString(), 'HSL')}>
                <span className="text-muted-foreground">HSL</span>
                <span className="font-mono font-semibold">{colorInstance.toHslString()}</span>
            </div>
             <div className="flex justify-between items-center cursor-pointer p-1 -m-1 hover:bg-muted rounded-sm" onClick={() => handleCopy(colorInstance.toCmykString(), 'CMYK')}>
                <span className="text-muted-foreground">CMYK</span>
                <span className="font-mono font-semibold">{colorInstance.toCmykString()}</span>
            </div>
             <div className="flex justify-between items-center cursor-pointer p-1 -m-1 hover:bg-muted rounded-sm" onClick={() => handleCopy(`lch(${colord(color).toLch().l}, ${colord(color).toLch().c}, ${colord(color).toLch().h})`, 'LCH')}>
                <span className="text-muted-foreground">LCH</span>
                <span className="font-mono font-semibold">{`lch(${colord(color).toLch().l.toFixed(0)}, ${colord(color).toLch().c.toFixed(0)}, ${colord(color).toLch().h.toFixed(0)})`}</span>
            </div>
        </div>
    );
};

export const ColorBox = React.memo(({
    color,
    name,
    info,
    onActionClick,
    actionIcon,
    actionTitle = "Save color",
    variant = 'compact'
}: ColorBoxProps) => {
    const { toast } = useToast();
    const [isFlipped, setIsFlipped] = useState(false);
    
    const descriptiveName = name || getDescriptiveColorName(color);
    
    const handleSaveDefault = (e: React.MouseEvent) => {
        e.stopPropagation();
        const result = saveColorToLibrary(color);
        toast({
            title: result.message,
            variant: result.success ? 'default' : 'destructive',
        });
    };

    const finalActionClick = onActionClick || handleSaveDefault;
    const finalActionIcon = actionIcon || <Plus className="h-4 w-4" />;

    const handleCopyHex = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(color.toUpperCase()).then(() => {
            toast({ title: 'HEX copied!', description: color.toUpperCase() });
        });
    };
    
    if (variant === 'default') {
        // Full-size, flippable card
        return (
            <div className="perspective w-full max-w-xs h-[280px]">
                <motion.div
                    className="relative w-full h-full preserve-3d"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Front of the card */}
                    <div className="absolute w-full h-full backface-hidden">
                         <Card className="overflow-hidden shadow-sm group w-full h-full flex flex-col">
                            <div className="relative h-40 w-full" style={{ backgroundColor: color }}>
                                 <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" className="h-8 w-8" onClick={finalActionClick} title={actionTitle}>
                                        {finalActionIcon}
                                    </Button>
                                    <Button size="icon" className="h-8 w-8" onClick={() => setIsFlipped(true)} title="Show Details">
                                        <Info className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardContent className="p-3 flex-grow flex flex-col justify-center cursor-pointer" onClick={handleCopyHex}>
                                <p className="font-semibold text-lg truncate" title={descriptiveName}>{descriptiveName}</p>
                                <p className="text-sm text-muted-foreground font-mono">{info || color.toUpperCase()}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Back of the card */}
                    <div className="absolute w-full h-full backface-hidden rotate-y-180">
                       <Card className="w-full h-full flex flex-col">
                             <div className="flex-grow">
                                <ColorDetails color={color} />
                            </div>
                            <div className="p-4 pt-0">
                                 <Button variant="outline" size="sm" onClick={() => setIsFlipped(false)} className="w-full">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Color
                                </Button>
                            </div>
                        </Card>
                    </div>
                </motion.div>
            </div>
        );
    }
    
    // Compact variant
    return (
        <Card className="overflow-hidden shadow-sm group w-full">
            <div
                className="relative h-20 w-full cursor-pointer"
                style={{ backgroundColor: color }}
                onClick={handleCopyHex}
            >
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button size="icon" variant="ghost" className="h-7 w-7 bg-black/20 hover:bg-black/40 text-white" onClick={finalActionClick} title={actionTitle}>
                        {finalActionIcon}
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                             <Button size="icon" variant="ghost" className="h-7 w-7 bg-black/20 hover:bg-black/40 text-white" onClick={(e) => e.stopPropagation()} title="Show Details">
                                <Info className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0">
                             <ColorDetails color={color} />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            <CardContent className="p-2 cursor-pointer" onClick={handleCopyHex}>
                <p className="font-semibold text-xs truncate" title={descriptiveName}>{descriptiveName}</p>
                <p className="text-xs text-muted-foreground font-mono">{info || color.toUpperCase()}</p>
            </CardContent>
        </Card>
    );
});

ColorBox.displayName = 'ColorBox';
