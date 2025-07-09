
"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import type { ColorLookupEntry } from '@/lib/pantone-colors';

type ColorLookup = Map<string, ColorLookupEntry>;

const PantoneContext = createContext<ColorLookup | null>(null);

export const PantoneProvider = ({ children, lookup }: { children: ReactNode; lookup: ColorLookup }) => {
  return (
    <PantoneContext.Provider value={lookup}>
      {children}
    </PantoneContext.Provider>
  );
};

export const usePantone = (): ColorLookup | null => {
  return useContext(PantoneContext);
};
