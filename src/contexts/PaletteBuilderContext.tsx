
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { PaletteColor, GenerationType } from '@/lib/palette-generator';

interface LoadedPaletteInfo {
  colors: string[];
  name: string;
  id: number | null;
}

interface PaletteBuilderContextType {
  mainColor: string;
  setMainColor: (color: string) => void;
  palette: PaletteColor[];
  setPalette: React.Dispatch<React.SetStateAction<PaletteColor[]>>;
  generationType: GenerationType;
  setGenerationType: (type: GenerationType) => void;
  isHarmonyLocked: boolean;
  setIsHarmonyLocked: (locked: boolean) => void;
  paletteToLoad: LoadedPaletteInfo | null;
  loadPalette: (info: LoadedPaletteInfo) => void;
  clearPaletteToLoad: () => void;
}

const PaletteBuilderContext = createContext<PaletteBuilderContextType | undefined>(undefined);

export const PaletteBuilderProvider = ({ children }: { children: ReactNode }) => {
  const [mainColor, setMainColor] = useState('#FF9800');
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [generationType, setGenerationType] = useState<GenerationType>('analogous');
  const [isHarmonyLocked, setIsHarmonyLocked] = useState(false);
  const [paletteToLoad, setPaletteToLoad] = useState<LoadedPaletteInfo | null>(null);

  const loadPalette = (info: LoadedPaletteInfo) => {
    setPaletteToLoad(info);
  };
  
  const clearPaletteToLoad = () => {
    setPaletteToLoad(null);
  }

  const value = {
    mainColor,
    setMainColor,
    palette,
    setPalette,
    generationType,
    setGenerationType,
    isHarmonyLocked,
    setIsHarmonyLocked,
    paletteToLoad,
    loadPalette,
    clearPaletteToLoad,
  };

  return (
    <PaletteBuilderContext.Provider value={value}>
      {children}
    </PaletteBuilderContext.Provider>
  );
};

export const usePaletteBuilder = () => {
  const context = useContext(PaletteBuilderContext);
  if (context === undefined) {
    throw new Error('usePaletteBuilder must be used within a PaletteBuilderProvider');
  }
  return context;
};
