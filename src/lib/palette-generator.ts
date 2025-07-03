
import chroma from 'chroma-js';
import { getTints, getShades } from './colors';
import { simulate, type SimulationType } from './colorblind';

export type GenerationType = 'analogous' | 'triadic' | 'complementary' | 'tints' | 'shades';

interface GenerationOptions {
    numColors: number;
    type: GenerationType;
    lockedColors?: string[];
    colorblindSafe?: boolean;
}

export function getRandomColor(): string {
  return chroma.random().hex();
}

/**
 * Iterates through a palette and adjusts colors to meet a minimum contrast
 * ratio under various colorblindness simulations.
 */
function adjustForColorblindSafety(palette: string[]): string[] {
  if (palette.length < 2) {
    return palette;
  }
  const adjustedPalette = [...palette];
  const simulationTypes: SimulationType[] = ['protan', 'deutan', 'tritan'];
  const minContrast = 1.2;

  for (let i = 0; i < adjustedPalette.length - 1; i++) {
    let attempts = 0;
    const maxAttempts = 30; // Safety break to prevent infinite loops

    while (attempts < maxAttempts) {
      let isPairSafe = true;
      // Check the color pair against all simulation types
      for (const type of simulationTypes) {
        const simColor1 = simulate(adjustedPalette[i], type);
        const simColor2 = simulate(adjustedPalette[i + 1], type);
        if (chroma.contrast(simColor1, simColor2) < minContrast) {
          isPairSafe = false;
          break; // This simulation type failed, no need to check others for this attempt
        }
      }

      if (isPairSafe) {
        break; // The pair is safe across all simulations, move to the next pair
      }
      
      // The pair is not safe, so adjust color i+1's lightness
      const colorToAdjust = chroma(adjustedPalette[i + 1]);
      const lightness1 = chroma(adjustedPalette[i]).get('lch.l');
      const lightness2 = colorToAdjust.get('lch.l');
      
      // Move lightness away from the other color's lightness to increase contrast
      const lightnessDelta = 2;
      const newLightness = (lightness2 > lightness1) ? lightness2 + lightnessDelta : lightness2 - lightnessDelta;

      adjustedPalette[i + 1] = colorToAdjust.set('lch.l', Math.max(0, Math.min(100, newLightness))).hex();
      
      attempts++;
    }
  }
  return adjustedPalette;
}


export function generatePalette(options: GenerationOptions): string[] {
    const { numColors, type, lockedColors, colorblindSafe } = options;

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
    
    if (colorblindSafe) {
        return adjustForColorblindSafety(initialPalette);
    }

    return initialPalette;
}
