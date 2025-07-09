
import chroma from 'chroma-js';
import type { PantoneCategory, PantoneColor, ColorLookupEntry } from './pantone-colors';
import { sortPantoneNumerically } from './pantone-colors';
import { pantonePmsColors } from './data/pantone-pms';
import { pantoneFhiColors } from './data/pantone-fhi';
import { usafColors } from './data/usaf-colors';
import { colord } from 'colord';
import fs from 'fs';
import path from 'path';


export interface PrebuiltPalette {
  name: string;
  colors: string[];
}

export interface CategorizedPalette extends PrebuiltPalette {
  category: string;
}

const brandKeywords = [
    'gucci', 'discord', 'windows', 'material design', 'bootstrap', 'cyberpunk', 'miku', 'trello', 'spotify', 'facebook', 
    'instagram', 'twitch', 'joomla', 'netflix', 'microsoft', 'apple', 'bmw', 'amazon', 'fedex', 
    'google', 'telegram', 'steam', 'valorant', 'rolex', 'samsung', 'logitech', 'figma', 
    'whatsapp', 'vs code', 'visual studio', 'typescript', 'javascript', 'php', 'java', 
    'shell', 'dr. pepper', 'reese\'s', 'dunkin', 'red bull', 'm&m', 'coca-cola', 'pepsi', 
    'snapchat', 'youtube', 'illustrator', 'us dollar',
    'rubik\'s cube', 'tetris', 'harry potter', 'washington commanders', 'blender', 'flat ui',
    'chrome music lab'
];

const flagKeywords = [
    'flag', 'india', 'ukraine', 'germany', 'japan', 'russia', 'france', 'uk ', 'united kingdom', 
    'brazil', 'mexico', 'bangladesh'
];

const usafKeywords = ['usaf'];
const pastelKeywords = ['pastel'];


// Function to determine the primary color category of a palette
const categorizePalette = (colors: string[], name: string): string => {
  const lowerCaseName = name.toLowerCase();

  for (const keyword of usafKeywords) {
    if (lowerCaseName.includes(keyword)) {
      return 'USAF';
    }
  }

  for (const keyword of pastelKeywords) {
    if (lowerCaseName.includes(keyword)) {
      return 'Pastels';
    }
  }

  // Specific keywords to force into 'Brands' category
  const brandForcedKeywords = ['material design', 'bootstrap', 'rubik\'s cube', 'tetris', 'harry potter', 'washington commanders', 'blender', 'flat ui', 'chrome music lab'];
  if (brandForcedKeywords.some(keyword => lowerCaseName.includes(keyword))) {
    return 'Brands';
  }

  for (const keyword of flagKeywords) {
    if (lowerCaseName.includes(keyword)) {
      return 'Flags';
    }
  }
  
  for (const keyword of brandKeywords) {
    if (lowerCaseName.includes(keyword)) {
      return 'Brands';
    }
  }

  if (colors.length === 0) return 'Monochrome';

  const hues: number[] = [];
  let saturationSum = 0;
  let lightnessSum = 0;
  let validColors = 0;

  colors.forEach(hex => {
    try {
      if (chroma.valid(hex)) {
        const [h, s, l] = chroma(hex).hsl();
        if (!isNaN(h)) {
          hues.push(h);
        }
        saturationSum += s;
        lightnessSum += l;
        validColors++;
      }
    } catch (e) {
      // Ignore invalid colors
    }
  });

  if (validColors === 0) return 'Monochrome';

  const avgSaturation = saturationSum / validColors;
  const avgLightness = lightnessSum / validColors;

  // Monochrome check (low saturation or very dark/light)
  if (avgSaturation < 0.1 || avgLightness < 0.1 || avgLightness > 0.95) {
    return 'Monochrome';
  }
  
  if (hues.length === 0) return 'Monochrome';

  // Check for multicolor
  const hueRange = Math.max(...hues) - Math.min(...hues);
  if (hueRange > 180) { // If hues span more than half the color wheel
      const stdDev = Math.sqrt(hues.map(x => Math.pow(x - (hues.reduce((a, b) => a + b) / hues.length), 2)).reduce((a, b) => a + b) / hues.length);
      if (stdDev > 60) {
        return 'Multicolor';
      }
  }

  // Determine dominant hue
  const avgHue = hues.reduce((sum, h) => sum + h, 0) / hues.length;

  if (avgHue >= 340 || avgHue < 20) return 'Red';
  if (avgHue < 50) return 'Orange';
  if (avgHue < 70) return 'Yellow';
  if (avgHue < 160) return 'Green';
  if (avgHue < 200) return 'Cyan';
  if (avgHue < 260) return 'Blue';
  return 'Purple';
};


export const getPrebuiltPalettes = async (): Promise<CategorizedPalette[]> => {
    try {
        const filePath = path.join(process.cwd(), 'src', 'lib', 'data', 'palettes.json');
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContents);

        if (!Array.isArray(data)) {
            console.error("palettes.json is not an array of palettes");
            return [];
        }

        const allPalettes: CategorizedPalette[] = data.map((p: PrebuiltPalette) => ({
            ...p,
            category: categorizePalette(p.colors, p.name)
        }));

        return allPalettes;
    } catch (error) {
        console.error("Error reading or parsing palettes.json:", error);
        return [];
    }
};

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

    