
"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { PaletteColor } from '@/lib/palette-generator';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ColorPickerClient from '@/components/colors/ColorPickerClient';
import type { ColorResult } from 'react-color';
import { Lock, Unlock, Trash2, Copy, Plus, MousePointerClick } from 'lucide-react';
import chroma from 'chroma-js';
import { motion, AnimatePresence } from 'framer-motion';

interface InteractivePaletteProps {
  palette: PaletteColor[];
  onColorChange: (id: number, newHex: string) => void;
  onLockToggle: (id: number) => void;
  onRemoveColor: (id: number) => void;
  onAddColor: (index: number) => void;
  onSetActiveColor: (hex: string) => void;
  actions: React.ReactNode;
}

export const Palette = ({ palette, onColorChange, onLockToggle, onRemoveColor, onAddColor, onSetActiveColor, actions }: InteractivePaletteProps) => {
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
              const textColor = chroma(color.hex).luminance() > 0.4 ? 'black' : 'white';
              
              return (
                <motion.div
                  key={color.id}
                  layout="position"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="relative min-w-0 flex"
                  style={{ width }}
                >
                  <div 
                      className="flex-1 min-w-0 flex flex-col justify-center items-center p-2 sm:p-4 transition-colors duration-300 group cursor-pointer"
                      style={{ backgroundColor: color.hex, color: textColor }}
                  >
                    <div className="flex flex-col items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant="ghost"
                                className="font-mono text-sm sm:text-base font-semibold py-1 px-2 rounded-md bg-black/20 hover:bg-black/40"
                                style={{ color: textColor }}
                                onClick={(e) => e.stopPropagation()}
                                >
                                    {color.hex.toUpperCase()}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-0" onClick={(e) => e.stopPropagation()}>
                                <ColorPickerClient
                                    color={color.hex}
                                    onChange={(c: ColorResult) => onColorChange(color.id, c.hex)}
                                />
                                <div className="p-2">
                                  <Button 
                                      variant="outline" 
                                      className="w-full mt-2" 
                                      onClick={(e) => { e.stopPropagation(); onSetActiveColor(color.hex); }}
                                  >
                                      <MousePointerClick className="mr-2 h-4 w-4" />
                                      Set as Active Color
                                  </Button>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 bg-black/20 hover:bg-black/40 text-white"
                                onClick={(e) => { e.stopPropagation(); onLockToggle(color.id); }}
                                title={color.locked ? "Unlock color" : "Lock color"}
                            >
                                {color.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                            </Button>
                            <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 bg-black/20 hover:bg-black/40 text-white"
                                onClick={(e) => { e.stopPropagation(); handleCopyColor(color.hex); }}
                                title="Copy Hex"
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 bg-black/20 hover:bg-black/40 text-white"
                                onClick={(e) => { e.stopPropagation(); onRemoveColor(color.id); }}
                                title="Remove Color"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                  </div>

                  {index < palette.length && (
                      <div className="absolute top-0 bottom-0 -right-4 w-8 z-10 group/add flex items-center justify-center">
                          <Button
                              size="icon"
                              className="z-10 h-8 w-8 rounded-full opacity-0 group-hover/add:opacity-100 transition-opacity bg-black/30 text-white backdrop-blur-sm hover:bg-black/50"
                              onClick={(e) => { e.stopPropagation(); onAddColor(index + 1); }}
                              title="Add color between"
                          >
                              <Plus className="h-4 w-4" />
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
