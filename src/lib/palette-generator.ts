
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

            const analogousPalette: string[] = [];
            const angleStep = 60 / (numColors > 1 ? numColors - 1 : 1); // Total 60 degree arc

            for (let i = 0; i < numColors; i++) {
                const hueOffset = (i * angleStep) - 30; // Center the arc around the base hue
                const newHue = (h + hueOffset + 360) % 360;
                
                // Add subtle variations to saturation and lightness to avoid a flat look
                // This creates a gentle "arc" in lightness and saturation as well
                const position = i / (numColors - 1 || 1); // 0 to 1
                const lightnessFactor = 1.0 - 0.15 * Math.sin(position * Math.PI); // Peak lightness in middle
                const saturationFactor = 0.85 + 0.15 * Math.sin(position * Math.PI); // Peak saturation at ends

                const newLightness = Math.max(0.05, Math.min(0.95, l * lightnessFactor));
                const newSaturation = Math.max(0.1, Math.min(1.0, s * saturationFactor));

                analogousPalette.push(chroma.hsl(newHue, newSaturation, newLightness).hex());
            }

            initialPalette = analogousPalette;
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
            initialPalette = chroma.scale(fullScale).mode('oklch').colors(numColors);
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
            initialPalette = chroma.scale(fullScale).mode('oklch').colors(numColors);
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
            initialPalette = chroma.scale(colorsToScale).mode('oklch').colors(numColors);
            break;
    }

    return initialPalette;
}
