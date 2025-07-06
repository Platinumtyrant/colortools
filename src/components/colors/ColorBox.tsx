
"use client";

import React from "react";
import { colord, extend } from "colord";
import namesPlugin from "colord/plugins/names";
import cmykPlugin from "colord/plugins/cmyk";
import lchPlugin from "colord/plugins/lch";
import labPlugin from "colord/plugins/lab";
import { getDescriptiveColorName, saveColorToLibrary } from "@/lib/colors";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

extend([namesPlugin, cmykPlugin, lchPlugin, labPlugin]);

interface ColorBoxProps {
  color: string;
  name?: string;
  info?: string;
  onActionClick?: (e: React.MouseEvent) => void;
  actionIcon?: React.ReactNode;
  actionTitle?: string;
  showDetails?: boolean;
}

export const ColorBox = React.memo(({ 
    color, 
    name, 
    info,
    onActionClick,
    actionIcon,
    actionTitle = "Save color",
    showDetails = false 
}: ColorBoxProps) => {
  const { toast } = useToast();
  
  const descriptiveName = name || getDescriptiveColorName(color);
  const colorInstance = colord(color);
  
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

  const handleCopy = (textToCopy: string, type: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
        toast({ title: `${type} copied!`, description: textToCopy });
    });
  };

  return (
    <Card className="overflow-hidden shadow-sm group w-full">
      <div 
        className="relative h-24 w-full cursor-pointer" 
        style={{ backgroundColor: color }}
        onClick={() => handleCopy(color.toUpperCase(), 'HEX')}
      >
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" className="h-8 w-8" onClick={finalActionClick} title={actionTitle}>
            {finalActionIcon}
          </Button>
        </div>
      </div>
      <CardContent className="p-3 space-y-2">
        <div>
            <p className="font-semibold text-sm truncate" title={descriptiveName}>{descriptiveName}</p>
            <p className="text-xs text-muted-foreground font-mono">{info || color.toUpperCase()}</p>
        </div>
        {showDetails && (
            <div className="space-y-1 text-sm border-t pt-2">
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
            </div>
        )}
      </CardContent>
    </Card>
  );
});

ColorBox.displayName = 'ColorBox';
