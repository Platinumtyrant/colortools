
"use client";

import { colord, extend, type HslColor } from 'colord';
import hwbPlugin from 'colord/plugins/hwb';
import labPlugin from 'colord/plugins/lab';
import lchPlugin from 'colord/plugins/lch';
import a11yPlugin from 'colord/plugins/a11y';
import mixPlugin from 'colord/plugins/mix';
import namesPlugin from 'colord/plugins/names';
import chroma from 'chroma-js';
import namer from 'color-namer';
import { usePantone } from '@/contexts/SidebarExtensionContext';

extend([hwbPlugin, labPlugin, lchPlugin, a11yPlugin, mixPlugin, namesPlugin]);

const capitalize = (str: string) => {
    if (!str) return '';
    return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export interface DescriptiveNameResult {
    name: string;
    source: 'pantone' | 'ntc' | 'basic' | 'colord' | 'hex';
}

export const useDescriptiveColorName = (hexColor: string): DescriptiveNameResult => {
    const pantoneLookup = usePantone();

    if (!colord(hexColor).isValid()) return { name: "Invalid Color", source: 'hex' };
    const lowerHex = colord(hexColor).toHex().toLowerCase();

    if (pantoneLookup && pantoneLookup.has(lowerHex)) {
        return { name: pantoneLookup.get(lowerHex)!, source: 'pantone' };
    }
    
    try {
        const names = namer(lowerHex);
        const ntcName = names.ntc[0]?.name;
        if (ntcName) {
            return { name: capitalize(ntcName), source: 'ntc' };
        }
        const basicName = names.basic[0]?.name;
        if (basicName) {
            return { name: capitalize(basicName), source: 'basic' };
        }
    } catch (e) {
        console.error("Error getting color name from color-namer:", e);
    }

    const colordName = colord(lowerHex).toName({ closest: true });
    if (colordName) {
        return { name: capitalize(colordName), source: 'colord' };
    }

    return { name: lowerHex.toUpperCase(), source: 'hex' };
};


export const getComplementary = (color: string) => {
  const hsl = colord(color).toHsl();
  const complementaryH = (hsl.h + 180) % 360;
  return [
    colord({ h: hsl.h, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: complementaryH, s: hsl.s, l: hsl.l } as HslColor).toHex(),
  ];
};

export const getAnalogous = (color: string) => {
  const hsl = colord(color).toHsl();
  const colors: string[] = [];
  for (let i = -30; i <= 30; i += 30) {
    if (i === 0) continue;
    colors.push(colord({ h: (hsl.h + i + 360) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex());
  }
  return [colord(color).toHex(), ...colors].sort((a, b) => colord(a).toHsl().h - colord(b).toHsl().h);
};

export const getSplitComplementary = (color: string) => {
  const hsl = colord(color).toHsl();
  const complementaryH = (hsl.h + 180) % 360;
  return [
    colord({ h: hsl.h, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: (complementaryH - 30 + 360) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: (complementaryH + 30) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex(),
  ].sort((a, b) => colord(a).toHsl().h - colord(b).toHsl().h);
};

export const getTriadic = (color: string) => {
  const hsl = colord(color).toHsl();
  return [
    colord({ h: hsl.h, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: (hsl.h + 120) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: (hsl.h + 240) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex(),
  ].sort((a, b) => colord(a).toHsl().h - colord(b).toHsl().h);
};

export const getSquare = (color: string) => {
  const hsl = colord(color).toHsl();
  return [
    colord({ h: hsl.h, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: (hsl.h + 90) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: (hsl.h + 270) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex(),
  ].sort((a, b) => colord(a).toHsl().h - colord(b).toHsl().h);
};

export const getRectangular = (color: string) => {
  const hsl = colord(color).toHsl();
  return [
    colord({ h: hsl.h, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: (hsl.h + 60) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: (hsl.h + 240) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex(),
  ].sort((a, b) => colord(a).toHsl().h - colord(b).toHsl().h);
};

export const getTints = (color: string, steps = 5) => {
  if (steps <= 1) {
    return [chroma(color).hex()];
  }
  const tints: string[] = [];
  for (let i = 0; i < steps; i++) {
    tints.push(chroma.mix(color, 'white', i / (steps - 1)).hex());
  }
  return tints;
};

export const getShades = (color: string, steps = 5) => {
  if (steps <= 1) {
    return [chroma(color).hex()];
  }
  const shades: string[] = [];
  for (let i = 0; i < steps; i++) {
    shades.push(chroma.mix(color, 'black', i / (steps - 1)).hex());
  }
  return shades;
};

export const getTones = (color: string, steps = 5) => {
  if (steps <= 1) {
    return [chroma(color).hex()];
  }
  const tones: string[] = [];
  for (let i = 0; i < steps; i++) {
    tones.push(chroma.mix(color, 'gray', i / (steps - 1)).hex());
  }
  return tones;
};

export const saveColorToLibrary = (color: string): { success: boolean; message: string } => {
  if (typeof window === 'undefined') {
    return { success: false, message: 'Cannot save on server.' };
  }
  try {
    const key = 'saved_individual_colors';
    const savedJSON = localStorage.getItem(key);
    let saved: string[] = savedJSON ? JSON.parse(savedJSON) : [];

    const normalizedColor = colord(color).toHex();

    if (saved.some(c => colord(c).toHex() === normalizedColor)) {
      return { success: false, message: 'Color is already in your library.' };
    }
    saved.push(normalizedColor);
    localStorage.setItem(key, JSON.stringify(saved));
    return { success: true, message: 'Color saved!' };
  } catch (e) {
    console.error('Could not save color:', e);
    return { success: false, message: 'There was an error saving the color.' };
  }
};

export const removeColorFromLibrary = (color: string): { success: boolean; message: string } => {
  if (typeof window === 'undefined') {
    return { success: false, message: 'Cannot remove on server.' };
  }
  try {
    const key = 'saved_individual_colors';
    const savedJSON = localStorage.getItem(key);
    let saved: string[] = savedJSON ? JSON.parse(savedJSON) : [];
    
    const normalizedColor = colord(color).toHex();
    const newSaved = saved.filter(c => colord(c).toHex() !== normalizedColor);

    if (saved.length === newSaved.length) {
      return { success: false, message: 'Color not found in library.' };
    }

    localStorage.setItem(key, JSON.stringify(newSaved));
    return { success: true, message: 'Color removed from library!' };
  } catch (e) {
    console.error('Could not remove color:', e);
    return { success: false, message: 'There was an error removing the color.' };
  }
};

const greenAnchors = ['#dcfce7', '#4ade80', '#16a34a', '#14532d'];
const blueAnchors = ['#dbeafe', '#60a5fa', '#2563eb', '#1e3a8a'];
const redAnchors = ['#fee2e2', '#f87171', '#dc2626', '#7f1d1d'];
const orangeAnchors = ['#ffedd5', '#fb923c', '#ea580c', '#7c2d12'];
const purpleAnchors = ['#f5d0fe', '#c084fc', '#9333ea', '#581c87'];
const yellowAnchors = ['#fefce8', '#facc15', '#ca8a04', '#713f12'];
const grayAnchors = ['#f8fafc', '#9ca3af', '#4b5563', '#111827'];

export const swatches = {
  green: chroma.scale(greenAnchors).mode('lch').colors(60),
  blue: chroma.scale(blueAnchors).mode('lch').colors(60),
  red: chroma.scale(redAnchors).mode('lch').colors(60),
  orange: chroma.scale(orangeAnchors).mode('lch').colors(60),
  purple: chroma.scale(purpleAnchors).mode('lch').colors(60),
  yellow: chroma.scale(yellowAnchors).mode('lch').colors(60),
  gray: chroma.scale(grayAnchors).mode('lch').colors(60),
};
