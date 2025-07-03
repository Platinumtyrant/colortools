
"use client";

import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { PaletteColor } from '@/app/palette-generator/page';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { Lock, Unlock, Trash2, Copy, Plus } from 'lucide-react';
import chroma from 'chroma-js';
import { motion, AnimatePresence } from 'framer-motion';

interface InteractivePaletteProps {
  palette: PaletteColor[];
  onColorChange: (id: number, newHex: string) => void;
  onLockToggle: (id: number) => void;
  onRemoveColor: (id: number) => void;
  onAddColor: (index: number) => void;
  actions: React.ReactNode;
}

export const Palette = ({ palette, onColorChange, onLockToggle, onRemoveColor, onAddColor, actions }: InteractivePaletteProps) => {
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
    <Card className="bg-card/50 overflow-hidden h-full flex flex-col">
      <CardContent className="p-0 flex flex-col flex-grow min-w-0">
        <div className="flex flex-grow min-w-0">
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
                  className="relative flex-1 min-w-0 flex"
                >
                  <div 
                      className="flex-1 min-w-0 flex flex-col justify-between p-2 sm:p-4 transition-colors duration-300 group"
                      style={{ backgroundColor: color.hex, color: textColor }}
                  >
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 bg-black/20 hover:bg-black/40 text-white"
                              onClick={() => onLockToggle(color.id)}
                              title={color.locked ? "Unlock color" : "Lock color"}
                          >
                              {color.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </Button>
                          <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 bg-black/20 hover:bg-black/40 text-white"
                              onClick={() => onRemoveColor(color.id)}
                              title="Remove Color"
                          >
                              <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                      
                      <div className="text-center flex items-center justify-center gap-1">
                          <Popover>
                              <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="font-mono text-sm sm:text-base font-semibold py-1 px-2 rounded-md bg-black/20 hover:bg-black/40"
                                    style={{ color: textColor }}
                                  >
                                      {color.hex.toUpperCase()}
                                  </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 border-0">
                                  <HexColorPicker color={color.hex} onChange={(newHex) => onColorChange(color.id, newHex)} />
                                  <div className="p-2 border-t border-border bg-background">
                                      <HexColorInput prefixed color={color.hex} onChange={(newHex) => onColorChange(color.id, newHex)} className="w-full p-2 rounded-md bg-muted text-center font-mono uppercase" />
                                  </div>
                              </PopoverContent>
                          </Popover>

                          <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ color: textColor }}
                              onClick={() => handleCopyColor(color.hex)}
                              title="Copy Hex"
                          >
                              <Copy className="h-4 w-4" />
                          </Button>
                      </div>
                  </div>

                  {index < palette.length - 1 && palette.length < 10 && (
                      <div className="absolute top-0 bottom-0 -right-4 w-8 z-10 group/add flex items-center justify-center">
                          <Button
                              variant="outline"
                              size="icon"
                              className="z-10 h-8 w-8 rounded-full opacity-0 group-hover/add:opacity-100 transition-opacity bg-background/50 backdrop-blur-sm hover:bg-background/80"
                              onClick={() => onAddColor(index + 1)}
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
      <CardFooter className="justify-end gap-2 p-4 pt-4 border-t">
        {actions}
      </CardFooter>
    </Card>
  );
};
