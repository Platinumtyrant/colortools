
"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { PaletteColor } from '@/lib/palette-generator';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ColorBox } from '@/components/colors/ColorBox';
import { cn } from '@/lib/utils';

interface InteractivePaletteProps {
  palette: PaletteColor[];
  editingColorId: number | null;
  onLockToggle: (id: number) => void;
  onRemoveColor: (id: number) => void;
  onAddColor: (index: number) => void;
  onSetActiveColor: (id: number, hex: string) => void;
  actions: React.ReactNode;
  onToggleLibrary: (hex: string) => void;
  libraryHexes: Set<string>;
}

export const Palette = ({ 
    palette, 
    editingColorId,
    onLockToggle, 
    onRemoveColor, 
    onAddColor, 
    onSetActiveColor, 
    actions,
    onToggleLibrary,
    libraryHexes,
}: InteractivePaletteProps) => {
  const { toast } = useToast();

  return (
    <Card className="bg-card/50 overflow-hidden flex flex-col">
      <CardHeader className="p-4 border-b">
        {actions}
      </CardHeader>
      <CardContent className="p-4 flex flex-col flex-grow min-w-0 h-96 overflow-y-auto">
        <div className="flex flex-wrap gap-x-4 gap-y-6 content-start">
          <AnimatePresence>
            {palette.map((color, index) => {
              const isActive = editingColorId === color.id;
              const isInLibrary = libraryHexes.has(color.hex);
              return (
                <div key={color.id} className="relative group/container">
                    <motion.div
                        layout="position"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="w-40"
                    >
                        <div className={cn("absolute inset-0 rounded-lg ring-2 ring-offset-2 ring-offset-background transition-all pointer-events-none", isActive ? "ring-primary" : "ring-transparent")} />
                         <ColorBox
                            color={color.hex}
                            variant="compact"
                            onRemoveFromPalette={() => onRemoveColor(color.id)}
                            onAddToLibrary={!isInLibrary ? () => onToggleLibrary(color.hex) : undefined}
                            onRemoveFromLibrary={isInLibrary ? () => onToggleLibrary(color.hex) : undefined}
                            onLockToggle={() => onLockToggle(color.id)}
                            onSetActiveColor={() => onSetActiveColor(color.id, color.hex)}
                            isLocked={color.locked}
                        />
                    </motion.div>

                    <div className="absolute top-1/2 left-full -translate-y-1/2 -translate-x-1/2 ml-2 z-10">
                        <Button
                            size="icon"
                            className="z-10 h-6 w-6 rounded-full opacity-0 group-hover/container:opacity-100 transition-opacity bg-background border shadow-md hover:bg-muted"
                            onClick={(e) => { e.stopPropagation(); onAddColor(index + 1); }}
                            title="Add color after"
                        >
                            <Plus className="h-3 w-3 text-muted-foreground" />
                        </Button>
                    </div>
                </div>
              )}
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};
