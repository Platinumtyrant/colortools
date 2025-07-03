"use client";

import { useState } from "react";
import { colord } from "colord";
import { getDescriptiveColorName } from "@/lib/colors";
import { cn } from "@/lib/utils";

interface ColorBoxProps {
  color: string;
  onSetActiveColor?: (color: string) => void;
  isMainPalette?: boolean;
  onRemove?: (color: string) => void;
  onCopySuccess: (message: string) => void;
}

export const ColorBox = ({ color, onSetActiveColor, isMainPalette, onRemove, onCopySuccess }: ColorBoxProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const hex = colord(color).toHex();
  const rgb = colord(color).toRgb();
  const hsl = colord(color).toHsl();
  const name = getDescriptiveColorName(hex);

  const handleCopy = (e: React.MouseEvent, text: string, type: string) => {
    e.stopPropagation(); // Prevent the card from flipping back when copying text
    navigator.clipboard.writeText(text).then(() => {
      if (onCopySuccess) {
        onCopySuccess(`${type} copied: ${text}`);
      }
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const handleCardClick = () => {
    // For this test, clicking a card flips it.
    // The `onSetActiveColor` functionality can be re-integrated later if needed.
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="w-full h-64 perspective cursor-pointer group/card" onClick={handleCardClick} title="Click to flip">
      <div
        className={cn(
          "relative w-full h-full shadow-xl transition-transform duration-500 preserve-3d",
          isFlipped && "rotate-y-180"
        )}
      >
        {/* Front of the card */}
        <div
          className="absolute w-full h-full backface-hidden"
          style={{ backgroundColor: hex }}
        >
          {isMainPalette && onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent flipping when removing
                if(onRemove) onRemove(color);
              }}
              className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover/card:opacity-100 transition-opacity"
              title="Remove color"
            >
              X
            </button>
          )}
        </div>

        {/* Back of the card */}
        <div
          className="absolute w-full h-full bg-card backface-hidden rotate-y-180 p-3 text-white text-xs flex flex-col justify-center gap-1"
        >
            <h3 className="font-bold text-base capitalize mb-2">{name}</h3>
            <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center cursor-pointer p-1 hover:bg-white/10 rounded-sm" onClick={(e) => handleCopy(e, hex, 'HEX')}>
                    <span className="text-gray-400 flex-shrink-0 mr-2">HEX:</span>
                    <span className="font-mono font-semibold text-right break-all">{hex}</span>
                </div>
                <div className="flex justify-between items-center cursor-pointer p-1 hover:bg-white/10 rounded-sm" onClick={(e) => handleCopy(e, `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'RGB')}>
                    <span className="text-gray-400 flex-shrink-0 mr-2">RGB:</span>
                    <span className="font-mono font-semibold text-right break-all">{`${rgb.r}, ${rgb.g}, ${rgb.b}`}</span>
                </div>
                <div className="flex justify-between items-center cursor-pointer p-1 hover:bg-white/10 rounded-sm" onClick={(e) => handleCopy(e, `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 'HSL')}>
                    <span className="text-gray-400 flex-shrink-0 mr-2">HSL:</span>
                    <span className="font-mono font-semibold text-right break-all">{`${hsl.h}, ${hsl.s}%, ${hsl.l}%`}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
