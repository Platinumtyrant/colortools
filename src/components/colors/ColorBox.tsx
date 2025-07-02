"use client";

import { colord } from "colord";

interface ColorBoxProps {
  color: string;
  showValues?: boolean;
  onSetActiveColor?: (color: string) => void;
  isMainPalette?: boolean;
  onRemove?: (color: string) => void;
  onCopySuccess: (message: string) => void;
}

export const ColorBox = ({ color, showValues = true, onSetActiveColor, isMainPalette = false, onRemove, onCopySuccess }: ColorBoxProps) => {
  const hex = colord(color).toHex();
  const rgb = colord(color).toRgb();
  const hsl = colord(color).toHsl();

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      if (onCopySuccess) {
        onCopySuccess(`${type} copied: ${text}`);
      }
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  return (
    <div
      className="relative flex flex-col rounded-md overflow-hidden shadow-xl transition-all duration-300 w-full h-auto aspect-[3/4] group"
      style={{ backgroundColor: hex }}
    >
      <div className="flex-1 min-h-[120px] flex items-center justify-center relative">
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={() => {
            if (onSetActiveColor) {
              onSetActiveColor(hex);
            } else {
              handleCopy(hex, 'HEX');
            }
          }}
          title={onSetActiveColor ? `Set as active color: ${hex}` : `Click to copy HEX: ${hex}`}
        ></div>
        {isMainPalette && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(color);
            }}
            className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove color"
          >
            X
          </button>
        )}
      </div>
      {showValues && (
        <div className="bg-[#1b1b1b] p-2 text-white text-sm flex flex-col justify-around h-28">
          <div className="flex justify-between items-center cursor-pointer py-1" onClick={() => handleCopy(hex, 'HEX')}>
            <span className="text-gray-400 w-1/3 flex-shrink-0">HEX:</span>
            <span className="font-semibold flex-1 text-left break-all">{hex}</span>
          </div>
          <div className="flex justify-between items-center cursor-pointer py-1" onClick={() => handleCopy(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'RGB')}>
            <span className="text-gray-400 w-1/3 flex-shrink-0">RGB:</span>
            <span className="font-semibold flex-1 text-left break-all">{`${rgb.r}, ${rgb.g}, ${rgb.b}`}</span>
          </div>
          <div className="flex justify-between items-center cursor-pointer py-1" onClick={() => handleCopy(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 'HSL')}>
            <span className="text-gray-400 w-1/3 flex-shrink-0">HSL:</span>
            <span className="font-semibold flex-1 text-left break-all">{`${hsl.h}, ${hsl.s}%, ${hsl.l}%`}</span>
          </div>
        </div>
      )}
    </div>
  );
};
