"use client";

import { colord } from "colord";
import { getDescriptiveColorName } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ColorBoxProps {
  color: string;
  onSetActiveColor?: (color: string) => void;
  isMainPalette?: boolean;
  onRemove?: (color: string) => void;
  onCopySuccess: (message: string) => void;
  onAdd?: (color: string) => void;
}

export const ColorBox = ({ color, onSetActiveColor, isMainPalette, onRemove, onCopySuccess, onAdd }: ColorBoxProps) => {
  const hex = colord(color).toHex();
  const rgb = colord(color).toRgb();
  const hsl = colord(color).toHsl();
  const name = getDescriptiveColorName(hex);

  const handleCopy = (e: React.MouseEvent, text: string, type: string) => {
    e.stopPropagation(); // Prevent popover from closing if we click inside
    navigator.clipboard.writeText(text).then(() => {
      if (onCopySuccess) {
        onCopySuccess(`${type} copied: ${text}`);
      }
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          onClick={() => {
            if (onSetActiveColor) {
              onSetActiveColor(color);
            }
          }}
          className="relative w-full aspect-[3/2] cursor-pointer group/card rounded-lg overflow-hidden shadow-md"
          style={{ backgroundColor: hex }}
          title="Click for details"
        >
          {onAdd && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if(onAdd) onAdd(color);
              }}
              className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center text-xs opacity-0 group-hover/card:opacity-100 transition-opacity z-10 shadow-lg hover:bg-primary/90 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              title="Add to palette"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
          {isMainPalette && onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if(onRemove) onRemove(color);
              }}
              className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover/card:opacity-100 transition-opacity"
              title="Remove color"
            >
              X
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="font-medium leading-none capitalize">{name}</h4>
            <p className="text-sm text-muted-foreground">
              Click a value to copy it.
            </p>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center cursor-pointer p-1 -m-1 hover:bg-muted rounded-sm" onClick={(e) => handleCopy(e, hex, 'HEX')}>
              <span className="text-muted-foreground">HEX</span>
              <span className="font-mono font-semibold text-right break-all">{hex}</span>
            </div>
            <div className="flex justify-between items-center cursor-pointer p-1 -m-1 hover:bg-muted rounded-sm" onClick={(e) => handleCopy(e, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'RGB')}>
              <span className="text-muted-foreground">RGB</span>
              <span className="font-mono font-semibold text-right break-all">{`${rgb.r}, ${rgb.g}, ${rgb.b}`}</span>
            </div>
            <div className="flex justify-between items-center cursor-pointer p-1 -m-1 hover:bg-muted rounded-sm" onClick={(e) => handleCopy(e, `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 'HSL')}>
              <span className="text-muted-foreground">HSL</span>
              <span className="font-mono font-semibold text-right break-all">{`${hsl.h}, ${hsl.s}%, ${hsl.l}%`}</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
