
import fs from 'fs/promises';
import path from 'path';
import chroma from 'chroma-js';

export interface PrebuiltPalette {
  name: string;
  colors: string[];
}

export interface CategorizedPalette extends PrebuiltPalette {
  category: string;
}

// Function to determine the primary color category of a palette
const categorizePalette = (colors: string[]): string => {
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
  try {
    const filePath = path.join(process.cwd(), 'palettes.txt');
    const htmlContent = await fs.readFile(filePath, 'utf-8');

    const allPalettes: CategorizedPalette[] = [];
    const paletteChunks = htmlContent.split('<h3>').slice(1);

    for (const chunk of paletteChunks) {
      const paletteNameMatch = chunk.match(/(.*?)<\/h3>/);
      const paletteName = paletteNameMatch ? paletteNameMatch[1].trim() : 'Unnamed Palette';
      
      const colorMatches = [...chunk.matchAll(/(?:style="background-color:(#[0-9a-fA-F]{6});"|>(#[0-9a-fA-F]{6})<\/div>)/gi)];
      
      const colors = colorMatches.map(match => (match[1] || match[2]).toUpperCase()).filter(c => c);

      if (colors.length > 1) {
           allPalettes.push({
             name: paletteName,
             colors,
             category: categorizePalette(colors),
           });
      }
    }

    // Sort the entire list by color category
    const categoryOrder = ['Red', 'Orange', 'Yellow', 'Green', 'Cyan', 'Blue', 'Purple', 'Monochrome', 'Multicolor'];
    allPalettes.sort((a, b) => {
        const indexA = categoryOrder.indexOf(a.category);
        const indexB = categoryOrder.indexOf(b.category);
        if (indexA === indexB) return 0;
        return indexA - indexB;
    });

    return allPalettes;
  } catch (error) {
    console.error("Failed to parse palettes.txt:", error);
    return [];
  }
};
