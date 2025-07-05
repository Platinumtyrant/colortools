"use client";

import React, { ReactNode } from 'react';

// This context is no longer used.
// The sidebar logic is now handled directly within the Palette Builder page.
export const SidebarExtensionProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const useSidebarExtension = () => {
  return {
    extension: null,
    setExtension: (node: ReactNode | null) => {},
  };
};
