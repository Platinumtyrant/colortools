"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface SidebarExtensionContextProps {
  extension: ReactNode | null;
  setExtension: (node: ReactNode | null) => void;
}

const SidebarExtensionContext = createContext<SidebarExtensionContextProps | undefined>(undefined);

export const SidebarExtensionProvider = ({ children }: { children: React.ReactNode }) => {
  const [extension, setExtension] = useState<ReactNode | null>(null);

  return (
    <SidebarExtensionContext.Provider value={{ extension, setExtension }}>
      {children}
    </SidebarExtensionContext.Provider>
  );
};

export const useSidebarExtension = () => {
  const context = useContext(SidebarExtensionContext);
  if (!context) {
    throw new Error('useSidebarExtension must be used within a SidebarExtensionProvider');
  }
  return context;
};
