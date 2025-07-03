"use client";

import * as colorBlind from 'color-blind';

export type SimulationType = 'normal' | 'protan' | 'deutan' | 'tritan';

export function simulate(hex: string, type: SimulationType): string {
  if (!hex || typeof hex !== 'string') return '#000000';
  try {
    switch (type) {
      case 'protan':
        return colorBlind.protan(hex);
      case 'deutan':
        return colorBlind.deutan(hex);
      case 'tritan':
        return colorBlind.tritan(hex);
      case 'normal':
      default:
        return hex;
    }
  } catch (e) {
    console.error(`Failed to simulate color ${hex} for type ${type}`, e);
    return '#000000'; // Return a fallback color
  }
}
