
"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { PaletteColor } from '@/lib/palette-generator';
import { Button } from '@/components/ui/button';
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
  
  return (
    <Card className="bg-card/50 overflow-hidden flex flex-col h-full">
      <CardHeader className="p-4 border-b">
        {actions}
      </CardHeader>
      <CardContent className="p-4 flex flex-col flex-grow min-w-0">
        <div className="flex flex-wrap gap-x-4 gap-y-6 content-start">
          <AnimatePresence>
            {palette.map((color, index) => {
              const isActive = editingColorId === color.id;
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
                            onActionClick={(e) => { e.stopPropagation(); onRemoveColor(color.id); }}
                            actionIcon={<Trash2 className="h-4 w-4" />}
                            actionTitle="Remove Color"
                            popoverActions={(
                                <div className="flex flex-col gap-2 mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={(e) => { e.stopPropagation(); onLockToggle(color.id) }}
                                    >
                                        {color.locked ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                                        {color.locked ? 'Unlock' : 'Lock'}
                                    </Button>
                                    <div className="flex gap-2">
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
                                    </div>
                                </div>
                            )}
                        />
                    </motion.div>

                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 z-10">
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
