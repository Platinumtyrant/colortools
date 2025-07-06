
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
        return Array.from({ length: numColors }, () => getRandomColor());
    }

    if (type === 'tints') {
        return getTints(baseColor, numColors);
    }
    if (type === 'shades') {
        return getShades(baseColor, numColors);
    }

    const baseLCH = chroma(baseColor).lch();
    const l = baseLCH[0];
    const c = baseLCH[1];
    const h = isNaN(baseLCH[2]) ? 0 : baseLCH[2];

    const colors: string[] = [];
    
    // Helper function to create subtle variations around a main color
    const createVariations = (baseHue: number, count: number) => {
        const variations: string[] = [];
        for (let i = 0; i < count; i++) {
            // Create small variations in Lightness and Chroma
            const l_var = l + (Math.random() - 0.5) * 15; // lightness variation +/- 7.5
            const c_var = c + (Math.random() - 0.5) * 10; // chroma variation +/- 5
            const h_var = baseHue + (Math.random() - 0.5) * 10; // hue variation +/- 5
            variations.push(
                chroma.lch(
                    Math.max(10, Math.min(95, l_var)), 
                    Math.max(0, c_var), 
                    (h_var + 360) % 360
                ).hex()
            );
        }
        return variations;
    };
    
    switch (type) {
        case 'analogous': {
            const angleRange = 60;
            const angleStep = numColors > 1 ? angleRange / (numColors - 1) : 0;
            for (let i = 0; i < numColors; i++) {
                const hueOffset = -(angleRange / 2) + i * angleStep;
                const newHue = (h + hueOffset + 360) % 360;
                 const lightnessVariation = Math.sin((i / (numColors -1)) * Math.PI) * 10;
                const newLightness = Math.max(10, Math.min(95, l + lightnessVariation));

                colors.push(chroma.lch(newLightness, c, newHue).hex());
            }
            break;
        }

        case 'complementary': {
            const baseCount = Math.ceil(numColors / 2);
            const complementCount = numColors - baseCount;
            const complementHue = (h + 180) % 360;
            
            colors.push(...createVariations(h, baseCount));
            colors.push(...createVariations(complementHue, complementCount));
            break;
        }

        case 'triadic': {
            const hue2 = (h + 120) % 360;
            const hue3 = (h + 240) % 360;

            const counts = [0, 0, 0];
            for (let i = 0; i < numColors; i++) {
                counts[i % 3]++;
            }

            colors.push(...createVariations(h, counts[0]));
            colors.push(...createVariations(hue2, counts[1]));
            colors.push(...createVariations(hue3, counts[2]));
            break;
        }
    }

    return colors.slice(0, numColors);
}
