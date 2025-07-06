
import chroma from 'chroma-js';
import { getTints, getShades } from './colors';
import { simulate, type SimulationType } from './colorblind';

export type GenerationType = 'analogous' | 'triadic' | 'complementary' | 'tints' | 'shades';

export interface PaletteColor {
  id: number;
  hex: string;
  locked: boolean;
}

interface GenerationOptions {
    numColors: number;
    type: GenerationType;
    lockedColors?: string[];
}

export function getRandomColor(): string {
  return chroma.random().hex();
}

export function adjustForColorblindSafety(palette: PaletteColor[]): PaletteColor[] {
  if (palette.length < 2) {
    return palette;
  }
  const adjustedPalette = palette.map(p => ({ ...p }));
  const simulationTypes: SimulationType[] = ['protan', 'deutan', 'tritan', 'deuteranomaly'];
  const minContrast = 1.1; // A very low threshold to prevent visually similar colors
  const maxPasses = 10;
  const adjustmentStep = 2; // A smaller step for more subtle adjustments

  for (let pass = 0; pass < maxPasses; pass++) {
    let adjustmentsMade = false;

    // Forward pass
    for (let i = 0; i < adjustedPalette.length - 1; i++) {
        const color1 = adjustedPalette[i];
        const color2 = adjustedPalette[i + 1];

        if (color2.locked) continue;

        let isUnsafe = false;
        for (const type of simulationTypes) {
            const sim1 = simulate(color1.hex, type);
            const sim2 = simulate(color2.hex, type);
            if (chroma.contrast(sim1, sim2) < minContrast) {
                isUnsafe = true;
                break;
            }
        }

        if (isUnsafe) {
            adjustmentsMade = true;
            const lch2 = chroma(color2.hex).lch();
            let lightness2 = lch2[0];
            
            // Adjust lightness away from the middle (50) to increase contrast
            lightness2 += (lightness2 > 50 ? adjustmentStep : -adjustmentStep);
            adjustedPalette[i + 1].hex = chroma.lch(Math.max(0, Math.min(100, lightness2)), lch2[1], lch2[2]).hex();
        }
    }
    if (!adjustmentsMade) {
      break;
    }
  }

  return adjustedPalette;
}


export function generatePalette(options: GenerationOptions): string[] {
    const { numColors, type, lockedColors } = options;
    const baseColor = (lockedColors && lockedColors.length > 0) ? lockedColors[0] : getRandomColor();

    if (!chroma.valid(baseColor)) {
        console.error("Invalid base color provided to generatePalette:", baseColor);
        // Fallback to a default random palette
        return Array.from({ length: numColors }, () => getRandomColor());
    }
    
    // Tints and shades have their own dedicated, robust logic which works well.
    if (type === 'tints') {
        return getTints(baseColor, numColors);
    }
    if (type === 'shades') {
        return getShades(baseColor, numColors);
    }

    // For harmonies, we will use the LCH color space for perceptually uniform manipulations.
    const baseLCH = chroma(baseColor).lch();
    const h = isNaN(baseLCH[2]) ? 0 : baseLCH[2];
    const c = baseLCH[1];
    const l = baseLCH[0];

    let colors: string[] = [];
    
    switch (type) {
        case 'analogous': {
            // Generate colors in a 60-degree arc around the base hue.
            // This direct calculation avoids bunching colors together.
            const angleRange = 60;
            for (let i = 0; i < numColors; i++) {
                const position = numColors > 1 ? i / (numColors - 1) : 0.5;
                const hueOffset = (position - 0.5) * angleRange;
                const newHue = (h + hueOffset + 360) % 360;
                
                // Introduce subtle, non-linear lightness variation for a more organic feel.
                const lightnessVariation = Math.sin(position * Math.PI) * 10;
                const newLightness = Math.max(10, Math.min(95, l + lightnessVariation));
                
                colors.push(chroma.lch(newLightness, c, newHue).hex());
            }
            break;
        }

        case 'complementary': {
            // Create a scale between the base color and its complement.
            const complement = chroma.lch(l, c, (h + 180) % 360).hex();
            // Using chroma.scale creates an even distribution of colors between the two points.
            colors = chroma.scale([baseColor, complement]).mode('lch').colors(numColors);
            break;
        }

        case 'triadic': {
            // Create a scale that cycles through all three triadic points.
            const p2 = chroma.lch(l, c, (h + 120) % 360).hex();
            const p3 = chroma.lch(l, c, (h + 240) % 360).hex();
            // We generate numColors + 1 and slice to avoid repeating the first color at the end.
            const scale = chroma.scale([baseColor, p2, p3, baseColor]).mode('lch').colors(numColors + 1);
            colors = scale.slice(0, numColors);
            break;
        }
    }

    return colors;
}
