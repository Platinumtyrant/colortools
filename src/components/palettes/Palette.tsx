
"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { PaletteColor } from '@/lib/palette-generator';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Lock, Unlock, Trash2, Copy, Plus, MousePointerClick } from 'lucide-react';
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
}

export const Palette = ({ 
    palette, 
    editingColorId,
    onLockToggle, 
    onRemoveColor, 
    onAddColor, 
    onSetActiveColor, 
    actions 
}: InteractivePaletteProps) => {
  const { toast } = useToast();

  const handleCopyColor = (color: string) => {
      navigator.clipboard.writeText(color).then(() => {
          toast({
              title: "Color Copied!",
              description: `${color} has been copied to your clipboard.`
          });
      });
  };
  
  const numCols = 4;
  const width = `${100 / numCols}%`;

  return (
    <Card className="bg-card/50 overflow-hidden flex flex-col">
      <CardHeader className="p-4 border-b">
        {actions}
      </CardHeader>
      <CardContent className="p-0 flex flex-col flex-grow min-w-0">
        <div className="flex flex-wrap flex-grow min-w-0">
          <AnimatePresence>
            {palette.map((color, index) => {
              const isActive = editingColorId === color.id;
              return (
                <motion.div
                  key={color.id}
                  layout="position"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="relative min-w-0 flex p-2"
                  style={{ width }}
                >
                   <div className={cn("absolute inset-2 rounded-lg ring-2 ring-offset-2 ring-offset-background transition-all", isActive ? "ring-primary" : "ring-transparent")} />
                   <ColorBox
                        color={color.hex}
                        variant="compact"
                        onActionClick={(e) => { e.stopPropagation(); onLockToggle(color.id); }}
                        actionIcon={color.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        actionTitle={color.locked ? "Unlock" : "Lock"}
                        popoverActions={(
                             <div className="flex gap-2 mt-4">
                                <Button 
                                    variant="outline" 
                                    className="w-full" 
                                    onClick={(e) => { e.stopPropagation(); onSetActiveColor(color.id, color.hex); }}
                                >
                                    <MousePointerClick className="mr-2 h-4 w-4" />
                                    Set as Active
                                </Button>
                                <Button 
                                    size="icon" 
                                    variant="outline" 
                                    onClick={(e) => { e.stopPropagation(); handleCopyColor(color.hex); }}
                                    title="Copy Hex"
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button 
                                    size="icon" 
                                    variant="destructive" 
                                    onClick={(e) => { e.stopPropagation(); onRemoveColor(color.id); }}
                                    title="Remove Color"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                        )}
                    />

                  {index < palette.length && (
                      <div className="absolute top-0 bottom-0 -right-2 w-4 z-10 group/add flex items-center justify-center">
                          <Button
                              size="icon"
                              className="z-10 h-6 w-6 rounded-full opacity-0 group-hover/add:opacity-100 transition-opacity bg-black/30 text-white backdrop-blur-sm hover:bg-black/50"
                              onClick={(e) => { e.stopPropagation(); onAddColor(index + 1); }}
                              title="Add color between"
                          >
                              <Plus className="h-3 w-3" />
                          </Button>
                      </div>
                  )}
                </motion.div>
              )}
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};
