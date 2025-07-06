
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
        throw new Error("Invalid base color provided.");
    }

    const baseHsl = chroma(baseColor).hsl();
    const h = isNaN(baseHsl[0]) ? 0 : baseHsl[0];
    const s = baseHsl[1];
    const l = baseHsl[2];

    if (type === 'tints') {
        return getTints(baseColor, numColors);
    }
    if (type === 'shades') {
        return getShades(baseColor, numColors);
    }

    let anchorHues: number[] = [h];
    if (type === 'analogous') {
        const palette: string[] = [];
        const angleRange = 60; // Total range for analogous colors
        for (let i = 0; i < numColors; i++) {
            const position = numColors > 1 ? i / (numColors - 1) : 0.5;
            const hueOffset = (position - 0.5) * angleRange; // from -30 to +30
            const newHue = (h + hueOffset + 360) % 360;

            const lightnessVariation = 0.1 * Math.sin(position * Math.PI); // small arc
            const newLightness = Math.max(0.1, Math.min(0.9, l + lightnessVariation));
            const newSaturation = Math.max(0.2, Math.min(1.0, s));

            palette.push(chroma.hsl(newHue, newSaturation, newLightness).hex());
        }
        return palette;
    }
    
    if (type === 'complementary') {
        anchorHues.push((h + 180) % 360);
    }
    if (type === 'triadic') {
        anchorHues.push((h + 120) % 360);
        anchorHues.push((h + 240) % 360);
    }

    const finalPalette: string[] = [];
    const colorsPerAnchor = Math.ceil(numColors / anchorHues.length);

    anchorHues.forEach(anchorHue => {
        if (finalPalette.length >= numColors) return;

        finalPalette.push(chroma.hsl(anchorHue, s, l).hex());

        for (let i = 1; i < colorsPerAnchor; i++) {
            if (finalPalette.length >= numColors) break;
            
            const lightnessOffset = (i % 2 === 0 ? -1 : 1) * 0.05 * Math.ceil(i / 2);
            const saturationOffset = -0.05 * i;
            
            const newLightness = Math.max(0.1, Math.min(0.9, l + lightnessOffset));
            const newSaturation = Math.max(0.2, Math.min(1.0, s + saturationOffset));

            finalPalette.push(chroma.hsl(anchorHue, newSaturation, newLightness).hex());
        }
    });
    
    const sortedPalette = finalPalette.slice(0, numColors).sort((a,b) => {
        const hA = chroma(a).hsl()[0];
        const hB = chroma(b).hsl()[0];
        if (isNaN(hA) || isNaN(hB)) return 0;
        return hA - hB;
    });

    return sortedPalette;
}
