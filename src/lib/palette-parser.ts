

import chroma from 'chroma-js';
import type { PantoneCategory, PantoneColor, ColorLookupEntry } from './pantone-colors';
import { sortPantoneNumerically } from './pantone-colors';
import { pantonePmsColors } from './data/pantone-pms';
import { pantoneFhiColors } from './data/pantone-fhi';
import { usafColors } from './data/usaf-colors';
import { colord } from 'colord';


export interface PrebuiltPalette {
  name: string;
  colors: string[];
}

export interface CategorizedPalette extends PrebuiltPalette {
  category: string;
}

const categorizeColorByHue = (hex: string): string => {
  if (!chroma.valid(hex)) return 'Monochrome';
  const [h, s, l] = chroma(hex).hsl();
  if (isNaN(h) || s < 0.1 || l < 0.05 || l > 0.95) return 'Monochrome';

  if (h >= 340 || h < 20) return 'Red';
  if (h < 50) return 'Orange';
  if (h < 70) return 'Yellow';
  if (h < 160) return 'Green';
  if (h < 200) return 'Cyan';
  if (h < 260) return 'Blue';
  return 'Purple';
};

const categorizeColors = (colors: PantoneColor[]): PantoneCategory[] => {
    if (colors.length === 0) return [];
        
    const categories: Record<string, PantoneColor[]> = {};
    for (const color of colors) {
        const categoryName = categorizeColorByHue(color.hex);
        if (!categories[categoryName]) {
            categories[categoryName] = [];
        }
        categories[categoryName].push(color);
    }

    const categoryOrder = ['Red', 'Orange', 'Yellow', 'Green', 'Cyan', 'Blue', 'Purple', 'Monochrome'];
    
    return categoryOrder
        .map(name => {
            if (!categories[name]) return null;
            return {
                name,
                colors: categories[name].sort(sortPantoneNumerically)
            };
        })
        .filter((c): c is PantoneCategory => c !== null);
}

export function getPantonePmsCategories(): PantoneCategory[] {
    return categorizeColors(pantonePmsColors);
}

export function getPantoneFhiCategories(): PantoneCategory[] {
    return categorizeColors(pantoneFhiColors);
}

export function getCombinedPantoneLookup(): Map<string, ColorLookupEntry> {
    const pmsCategories = getPantonePmsCategories();
    const fhiCategories = getPantoneFhiCategories();
    const lookup = new Map<string, ColorLookupEntry>();

    const addToLookup = (categories: PantoneCategory[], source: string) => {
        for (const category of categories) {
            for (const color of category.colors) {
                const hexKey = colord(color.hex).toHex(); // normalize
                if (!lookup.has(hexKey)) {
                    lookup.set(hexKey, { name: color.name, source });
                }
            }
        }
    };
    
    addToLookup(pmsCategories, 'Pantone');
    addToLookup(fhiCategories, 'Pantone');

    for (const color of usafColors) {
        const hexKey = colord(color.hex).toHex();
        if (!lookup.has(hexKey)) {
            lookup.set(hexKey, { name: color.name, source: 'USAF' });
        }
    }

    return lookup;
}

    
