
import fs from 'fs/promises';
import path from 'path';
import chroma from 'chroma-js';
import type { PantoneCategory, PantoneColor } from './pantone-colors';
import { sortPantoneNumerically, createPantoneLookup } from './pantone-colors';


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
    'rubik\'s cube', 'tetris', 'harry potter', 'washington commanders', 'blender', 'flat ui'
];

const flagKeywords = [
    'flag', 'india', 'ukraine', 'germany', 'japan', 'russia', 'france', 'uk ', 'united kingdom', 
    'brazil', 'mexico', 'bangladesh'
];


// Function to determine the primary color category of a palette
const categorizePalette = (colors: string[], name: string): string => {
  const lowerCaseName = name.toLowerCase();

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

  if (avgHue >= 330 || avgHue < 20) return 'Red';
  if (avgHue < 45) return 'Orange';
  if (avgHue < 70) return 'Yellow';
  if (avgHue < 160) return 'Green';
  if (avgHue < 200) return 'Cyan';
  if (avgHue < 260) return 'Blue';
  if (avgHue < 330) return 'Purple';

  return 'Multicolor';
};


// This function is cached by Next.js during the build process on the server.
export const getPrebuiltPalettes = async (): Promise<CategorizedPalette[]> => {
  const filePath = path.join(process.cwd(), 'palettes.txt');
  try {
    const htmlContent = await fs.readFile(filePath, 'utf-8');

    const excludedKeywords = [
        'pantone 19-1664', 'parking app', 'luxiem', 'backrooms', 
        'butt ghost dick penis', 'bts palette', 'neutral colors for room',
        'ios', 'linktree', 'kpmg', 'xkcd', 'materialize'
    ];
    const allPalettes: CategorizedPalette[] = [];
    const paletteChunks = htmlContent.split('<h3>').slice(1);

    for (const chunk of paletteChunks) {
      const paletteNameMatch = chunk.match(/(.*?)<\/h3>/);
      let paletteName = paletteNameMatch ? paletteNameMatch[1].trim() : 'Unnamed Palette';
      
      const colorMatches = [...chunk.matchAll(/style="background-color:(#[0-9a-fA-F]{6});?/gi)];
      
      const colors = colorMatches.map(match => match[1].toUpperCase());
      const uniqueColors = [...new Set(colors)];

      const lowerCaseName = paletteName.toLowerCase();
      const shouldExclude = excludedKeywords.some(keyword => lowerCaseName.includes(keyword));

      if (uniqueColors.length > 1 && !shouldExclude) {
           // Remove hex codes and related clutter from names
           paletteName = paletteName
               .replace(/\| Hex code:? #[\dA-F]{6}/gi, '')
               .replace(/#[\dA-F]{6}/gi, '')
               .replace(/hex color$/i, '')
               .replace(/color$/i, '')
               .trim();

           allPalettes.push({
             name: paletteName,
             colors: uniqueColors,
             category: categorizePalette(uniqueColors, paletteName),
           });
      }
    }

    // Sort the entire list by color category
    const categoryOrder = ['Red', 'Orange', 'Yellow', 'Green', 'Cyan', 'Blue', 'Purple', 'Monochrome', 'Multicolor', 'Brands', 'Flags'];
    allPalettes.sort((a, b) => {
        const indexA = categoryOrder.indexOf(a.category);
        const indexB = categoryOrder.indexOf(b.category);
        if (indexA === indexB) return 0;
        return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
    });

    return allPalettes;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
        // This is not a critical error. It just means the user hasn't provided a palettes.txt file.
        // We can safely return an empty array and the Inspiration page will show an empty state.
        console.log(`Note: 'palettes.txt' not found. Inspiration page will be empty. This is expected.`);
    } else {
        // For other errors, it's better to log them.
        console.error("Failed to read or parse palettes.txt:", error);
    }
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

export async function getPantoneCategories(): Promise<PantoneCategory[]> {
    const filePath = path.join(process.cwd(), 'pantone.txt');
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const lines = fileContent.split('\n');

        const allColors: PantoneColor[] = [];
        const colorRegex = /^(.*?),\s*(#[\dA-F]{6}),\s*\((.*?)\)/i;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            const match = trimmedLine.match(colorRegex);
            if (match) {
                const [, name, hex, cmykValues] = match;
                allColors.push({
                  name: name.trim(),
                  hex: hex.trim().toUpperCase(),
                  cmyk: `(${cmykValues})`
                });
            }
        }
        
        if (allColors.length === 0) return [];
        
        const categories: Record<string, PantoneColor[]> = {};
        for (const color of allColors) {
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

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log("Note: 'pantone.txt' not found. Pantone guide will be empty.");
        } else {
            console.error("Failed to read or parse pantone.txt:", error);
        }
        return [];
    }
}


export async function getPantoneLookup(): Promise<Map<string, string>> {
    const categories = await getPantoneCategories();
    return createPantoneLookup(categories);
}
