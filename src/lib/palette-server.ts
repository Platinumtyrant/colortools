import chroma from 'chroma-js';
import fs from 'fs';
import path from 'path';
import type { PrebuiltPalette, CategorizedPalette } from './palette-parser';

const brandKeywords = [
    'gucci', 'discord', 'windows', 'material design', 'bootstrap', 'cyberpunk', 'miku', 'trello', 'spotify', 'facebook', 
    'instagram', 'twitch', 'joomla', 'netflix', 'microsoft', 'apple', 'bmw', 'amazon', 'fedex', 
    'google', 'telegram', 'steam', 'valorant', 'rolex', 'samsung', 'logitech', 'figma', 
    'whatsapp', 'vs code', 'visual studio', 'typescript', 'javascript', 'php', 'java', 
    'shell', 'dr. pepper', 'reese\'s', 'dunkin', 'red bull', 'm&m', 'coca-cola', 'pepsi', 
    'snapchat', 'youtube', 'illustrator', 'us dollar',
    'rubik\'s cube', 'tetris', 'harry potter', 'washington commanders', 'blender', 'flat ui',
    'chrome music lab', 'linktree website branding'
];

const flagKeywords = [
    'flag', 'india', 'ukraine', 'germany', 'japan', 'russia', 'france', 'uk ', 'united kingdom', 
    'brazil', 'mexico', 'bangladesh', 'american flag'
];

const usafKeywords = ['usaf'];
const pastelKeywords = [
    'pastel', 'starry colors', 'modern payment card', 'anime style', 'home interior decor',
    'pastel rainbow expanded'
];


// Function to determine the primary color category of a palette
const categorizePalette = (colors: string[], name: string): string => {
  const lowerCaseName = name.toLowerCase();

  // Specific keyword-based categorization
  if (usafKeywords.some(keyword => lowerCaseName.includes(keyword))) {
      return 'USAF';
  }
  if (pastelKeywords.some(keyword => lowerCaseName.includes(keyword))) {
      return 'Pastels';
  }
  if (flagKeywords.some(keyword => lowerCaseName.includes(keyword))) {
      return 'Flags';
  }
  if (brandKeywords.some(keyword => lowerCaseName.includes(keyword))) {
    return 'Brands';
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
