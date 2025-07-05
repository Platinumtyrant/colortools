
import fs from 'fs/promises';
import path from 'path';

export interface PrebuiltPalette {
  name: string;
  colors: string[];
}

export interface PaletteGroup {
  imageName: string;
  palettes: PrebuiltPalette[];
}

// This function is cached by Next.js during the build process on the server.
export const getPrebuiltPalettes = async (): Promise<PaletteGroup[]> => {
  try {
    const filePath = path.join(process.cwd(), 'palettes.txt');
    const htmlContent = await fs.readFile(filePath, 'utf-8');

    const paletteGroups: PaletteGroup[] = [];
    const layerSections = htmlContent.split('<h2>').slice(1);

    for (const section of layerSections) {
      const imageNameMatch = section.match(/(.*?) Palettes<\/h2>/);
      const imageName = imageNameMatch ? imageNameMatch[1].trim() : 'Unknown Image';

      const palettes: PrebuiltPalette[] = [];
      const paletteChunks = section.split('<h3>').slice(1);

      for (const chunk of paletteChunks) {
        const paletteNameMatch = chunk.match(/(.*?)<\/h3>/);
        const paletteName = paletteNameMatch ? paletteNameMatch[1].trim() : 'Unnamed Palette';
        
        // Match only the HEX code from the style attribute or the text content
        const colorMatches = [...chunk.matchAll(/(?:style="background-color:(#[0-9a-fA-F]{6});"|>(#[0-9a-fA-F]{6})<\/div>)/gi)];
        
        const colors = colorMatches.map(match => (match[1] || match[2]).toUpperCase()).filter(c => c);

        if (colors.length > 1) { // Per user request, ignore single-color palettes
             palettes.push({ name: paletteName, colors });
        }
      }

      if (palettes.length > 0) {
        paletteGroups.push({ imageName, palettes });
      }
    }
    return paletteGroups;
  } catch (error) {
    console.error("Failed to parse palettes.txt:", error);
    return [];
  }
};
