
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

/**
 * Iterates through a palette and adjusts colors to meet a minimum contrast
 * ratio under various colorblindness simulations, respecting locked colors.
 */
export function adjustForColorblindSafety(palette: PaletteColor[]): PaletteColor[] {
  if (palette.length < 2) {
    return palette;
  }
  let adjustedPalette = palette.map(p => ({ ...p })); // Deep copy to avoid mutation
  const simulationTypes: SimulationType[] = ['protan', 'deutan', 'tritan', 'deuteranomaly'];
  const minContrast = 1.5;
  const maxPasses = 15;
  const adjustmentStep = 5; // Adjust lightness by 5 on a 0-100 scale

  for (let pass = 0; pass < maxPasses; pass++) {
    let wasAdjusted = false;
    for (let i = 0; i < adjustedPalette.length - 1; i++) {
      let isPairSafe = true;
      for (const type of simulationTypes) {
        const simColor1 = simulate(adjustedPalette[i].hex, type);
        const simColor2 = simulate(adjustedPalette[i + 1].hex, type);
        if (chroma.contrast(simColor1, simColor2) < minContrast) {
          isPairSafe = false;
          break;
        }
      }

      if (!isPairSafe) {
        wasAdjusted = true;
        const color1 = chroma(adjustedPalette[i].hex);
        const color2 = chroma(adjustedPalette[i + 1].hex);
        const l1 = color1.get('lch.l');
        const l2 = color2.get('lch.l');
        
        // Try to adjust the second color if it's not locked.
        if (!adjustedPalette[i + 1].locked) {
            const newL = l1 > l2 ? l2 - adjustmentStep : l2 + adjustmentStep;
            adjustedPalette[i + 1].hex = color2.set('lch.l', Math.max(0, Math.min(100, newL))).hex();
        } 
        // Else if the first color is not locked, adjust it.
        else if (!adjustedPalette[i].locked) {
            const newL = l2 > l1 ? l1 - adjustmentStep : l1 + adjustmentStep;
            adjustedPalette[i].hex = color1.set('lch.l', Math.max(0, Math.min(100, newL))).hex();
        }
        // If both are locked, we skip and cannot make an adjustment for this pair.
      }
    }
    if (!wasAdjusted) {
      break; 
    }
  }
  return adjustedPalette;
}


export function generatePalette(options: GenerationOptions): string[] {
    const { numColors, type, lockedColors } = options;

    const colorsToScale = (lockedColors && lockedColors.length > 0) ? lockedColors : [getRandomColor()];
    
    if (colorsToScale.some(c => !chroma.valid(c))) {
        throw new Error("Invalid base color provided.");
    }
    
    let initialPalette: string[];

    const sortbyHue = (a: string, b: string) => {
        const hA = chroma(a).hsl()[0];
        const hB = chroma(b).hsl()[0];
        return (isNaN(hA) ? 0 : hA) - (isNaN(hB) ? 0 : hB);
    };

    switch (type) {
        case 'analogous': {
            const base = colorsToScale[0];
            const baseHsl = chroma(base).hsl();
            const h = isNaN(baseHsl[0]) ? 0 : baseHsl[0];
            const s = baseHsl[1];
            const l = baseHsl[2];

            const firstAnalogous = chroma.hsl((h - 30 + 360) % 360, s, l).hex();
            const secondAnalogous = chroma.hsl((h + 30) % 360, s, l).hex();
            const fullScale = [...colorsToScale, firstAnalogous, secondAnalogous].sort(sortbyHue);
            initialPalette = chroma.scale(fullScale).mode('lch').colors(numColors);
            break;
        }
        case 'triadic': {
            const base = colorsToScale[0];
            const baseHsl = chroma(base).hsl();
            const h = isNaN(baseHsl[0]) ? 0 : baseHsl[0];
            const s = baseHsl[1];
            const l = baseHsl[2];

            const secondColor = chroma.hsl((h + 120) % 360, s, l).hex();
            const thirdColor = chroma.hsl((h + 240) % 360, s, l).hex();
            const fullScale = [...colorsToScale, secondColor, thirdColor].sort(sortbyHue);
            initialPalette = chroma.scale(fullScale).mode('lch').colors(numColors);
            break;
        }
        case 'complementary': {
            const base = colorsToScale[0];
            const baseHsl = chroma(base).hsl();
            const h = isNaN(baseHsl[0]) ? 0 : baseHsl[0];
            const s = baseHsl[1];
            const l = baseHsl[2];

            const complement = chroma.hsl((h + 180) % 360, s, l).hex();
            const fullScale = [...colorsToScale, complement].sort(sortbyHue);
            initialPalette = chroma.scale(fullScale).mode('lch').colors(numColors);
            break;
        }
        case 'tints': {
            initialPalette = getTints(colorsToScale[0], numColors);
            break;
        }
        case 'shades': {
            initialPalette = getShades(colorsToScale[0], numColors);
            break;
        }
        default:
            initialPalette = chroma.scale(colorsToScale).mode('lch').colors(numColors);
            break;
    }

    return initialPalette;
}
