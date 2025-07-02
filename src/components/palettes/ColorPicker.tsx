"use client";

import { useRef, type ChangeEvent } from 'react';
import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  color: string;
  setColor: (color: string) => void;
  disabled?: boolean;
}

export const ColorPicker = ({ color, setColor, disabled }: ColorPickerProps) => {
  const colorInputRef = useRef<HTMLInputElement>(null);

  const handleColorInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
  };

  const isValidHex = (hex: string) => /^#[0-9A-F]{6}$/i.test(hex);

  return (
    <div className="flex items-center gap-4">
      <div
        className="h-12 w-12 cursor-pointer rounded-md border-2 border-border transition-all hover:scale-110"
        style={{ backgroundColor: isValidHex(color) ? color : "#FFFFFF" }}
        onClick={() => colorInputRef.current?.click()}
        aria-label="Pick a color"
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => e.key === 'Enter' && colorInputRef.current?.click()}
      />
      <input
        ref={colorInputRef}
        type="color"
        value={color}
        onChange={handleColorInputChange}
        className="absolute w-0 h-0 opacity-0"
        disabled={disabled}
      />
      <Input
        type="text"
        value={color.toUpperCase()}
        onChange={handleColorInputChange}
        className="font-mono text-lg w-40"
        disabled={disabled}
        aria-label="Hex color code"
      />
    </div>
  );
};
