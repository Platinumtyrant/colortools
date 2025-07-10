
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

export interface AllDescriptiveNamesResult {
    primary: { name: string; source: string };
    all: { source: string; name: string }[];
}

export const useAllDescriptiveColorNames = (hexColor: string): AllDescriptiveNamesResult => {
    const colorLookup = usePantone();
    const allNames: { source: string; name: string }[] = [];

    if (!colord(hexColor).isValid()) {
        const invalidResult = { name: "Invalid Color", source: 'HEX' };
        return { primary: invalidResult, all: [invalidResult] };
    }

    const lowerHex = colord(hexColor).toHex().toLowerCase();

    // 1. Pantone & USAF Lookup
    if (colorLookup && colorLookup.has(lowerHex)) {
        const entry = colorLookup.get(lowerHex)!;
        allNames.push({ source: entry.source, name: entry.name });
    }

    // 2. Namer (NTC & Basic)
    try {
        const names = namer(lowerHex);
        const ntcName = names.ntc[0]?.name;
        if (ntcName) {
            allNames.push({ source: 'NTC', name: capitalize(ntcName) });
        }
        const basicName = names.basic[0]?.name;
        if (basicName) {
            allNames.push({ source: 'Basic', name: capitalize(basicName) });
        }
    } catch (e) {
        console.error("Error getting color name from color-namer:", e);
    }

    // 3. Colord
    const colordName = colord(lowerHex).toName({ closest: true });
    if (colordName) {
        allNames.push({ source: 'Colord', name: capitalize(colordName) });
    }
    
    // Deduplicate names, giving priority to earlier sources
    const uniqueNames = allNames.reduce((acc, current) => {
        if (!acc.find(item => item.name.toLowerCase() === current.name.toLowerCase())) {
            acc.push(current);
        }
        return acc;
    }, [] as { source: string; name: string }[]);


    if (uniqueNames.length > 0) {
        return { primary: uniqueNames[0], all: uniqueNames };
    }

    const hexResult = { name: lowerHex.toUpperCase(), source: 'HEX' };
    return { primary: hexResult, all: [hexResult] };
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
      const saved = savedJSON ? JSON.parse(savedJSON) : [];

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
      const saved: string[] = savedJSON ? JSON.parse(savedJSON) : [];
    
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
