"use client";

import { ColorBox } from "./ColorBox";
import { cn } from "@/lib/utils";

interface ColorListProps {
  colors: string[];
  title: string;
  onSetActiveColor: (color: string) => void;
  isMainPalette?: boolean;
  onRemove?: (color: string) => void;
  onCopySuccess: (message: string) => void;
  onAdd?: (color: string) => void;
  gridClassName?: string;
}

export const ColorList = ({ colors, title, onSetActiveColor, isMainPalette = false, onRemove, onCopySuccess, onAdd, gridClassName }: ColorListProps) => {
  const defaultGridClasses = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4";
  
  return (
    <section className="mb-8">
      {title && <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>}
      <div className={cn(defaultGridClasses, gridClassName)}>
        {colors.map((color, index) => (
          <ColorBox
            key={index}
            color={color}
            onSetActiveColor={onSetActiveColor}
            isMainPalette={isMainPalette}
            onRemove={onRemove}
            onCopySuccess={onCopySuccess}
            onAdd={onAdd}
          />
        ))}
      </div>
    </section>
  );
};
