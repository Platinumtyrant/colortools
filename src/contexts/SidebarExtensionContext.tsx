
"use client";

import React, { createContext, useContext, ReactNode } from 'react';

type PantoneLookup = Map<string, string>;

const PantoneContext = createContext<PantoneLookup | null>(null);

export const PantoneProvider = ({ children, lookup }: { children: ReactNode; lookup: PantoneLookup }) => {
  return (
    <PantoneContext.Provider value={lookup}>
      {children}
    </PantoneContext.Provider>
  );
};

export const usePantone = (): PantoneLookup | null => {
  return useContext(PantoneContext);
};
