
"use client";

import { protan, deutan, tritan } from 'color-blind';

export type SimulationType = 'normal' | 'protan' | 'deutan' | 'tritan';

export function simulate(hex: string, type: SimulationType): string {
  if (!hex || typeof hex !== 'string') return '#000000';
  try {
    switch (type) {
      case 'protan':
        return protan(hex);
      case 'deutan':
        return deutan(hex);
      case 'tritan':
        return tritan(hex);
      case 'normal':
      default:
        return hex;
    }
  } catch (e) {
    console.error(`Failed to simulate color ${hex} for type ${type}`, e);
    return '#000000'; // Return a fallback color
  }
}
