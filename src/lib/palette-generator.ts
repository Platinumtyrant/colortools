
import chroma from 'chroma-js';
import { getTints, getShades } from './colors';
import { simulate, type SimulationType } from './colorblind';

export type GenerationType = 'analogous' | 'triadic' | 'complementary' | 'tints' | 'shades' | 'monochromatic' | 'shorter' | 'longer';

export interface PaletteColor {
  id: number;
  hex: string;
  locked: boolean;
}

interface GenerationOptions {
    numColors: number;
    type: GenerationType;
    baseColors: string[];
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
    const { numColors, type, baseColors } = options;
    if (numColors <= 0) return [];
    
    const baseColor = (baseColors && baseColors.length > 0) ? baseColors[0] : getRandomColor();

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
    if (type === 'monochromatic') {
        return chroma.scale([
            chroma(baseColor).darken(2),
            baseColor,
            chroma(baseColor).brighten(2)
        ]).mode('lch').colors(numColors);
    }

    const baseLCH = chroma(baseColor).lch();
    const l = baseLCH[0];
    const c = baseLCH[1];
    const h = isNaN(baseLCH[2]) ? 0 : baseLCH[2];

    const colors: string[] = [];

    // Helper function to create subtle variations around a main anchor hue
    const createVariations = (baseHue: number, count: number) => {
        if (count <= 0) return [];
        const variations: string[] = [];
        for (let i = 0; i < count; i++) {
            // Create small variations in Lightness and Chroma for a more organic feel
            // The first color (i=0) is closer to the original, subsequent ones vary more.
            const l_var = l + (Math.random() - 0.5) * (15 + i * 5);
            const c_var = c + (Math.random() - 0.5) * (10 + i * 5);
            const h_var = baseHue + (Math.random() - 0.5) * (10 + i * 2.5);
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
        case 'analogous':
        case 'shorter':
        case 'longer': {
            let angleRange = 60; // default for analogous
            if (type === 'shorter') angleRange = 40;
            if (type === 'longer') angleRange = 120;

            const angleStep = numColors > 1 ? angleRange / (numColors - 1) : 0;
            for (let i = 0; i < numColors; i++) {
                const hueOffset = -(angleRange / 2) + i * angleStep;
                const newHue = (h + hueOffset + 360) % 360;
                // Add some subtle variation in lightness and chroma for a more organic feel
                 const lightnessVariation = (Math.sin((i / (numColors > 1 ? numColors - 1 : 1)) * Math.PI) * 10);
                const newLightness = l + (i % 2 === 0 ? lightnessVariation : -lightnessVariation);
                const newChroma = c * (0.9 + Math.random() * 0.2); // Vary chroma by +/- 10%

                colors.push(chroma.lch(
                    Math.max(10, Math.min(95, newLightness)), 
                    Math.max(0, newChroma), 
                    newHue
                ).hex());
            }
            break;
        }

       case 'complementary':
        case 'triadic': {
            const anchors = type === 'complementary' 
                ? [h, (h + 180) % 360] 
                : [h, (h + 120) % 360, (h + 240) % 360];

            const colorsPerAnchor = Array(anchors.length).fill(0);
            for (let i = 0; i < numColors; i++) {
                colorsPerAnchor[i % anchors.length]++;
            }

            anchors.forEach((anchorHue, index) => {
                colors.push(...createVariations(anchorHue, colorsPerAnchor[index]));
            });
            break;
        }
        
        default:
             // Fallback to analogous if type is unknown
            for (let i = 0; i < numColors; i++) {
                colors.push(chroma(baseColor).set('hsl.h', `+${i * 10}`).hex());
            }
            break;
    }
    
    // Sort colors by hue to maintain a logical visual order
    return colors.slice(0, numColors).sort((a, b) => {
        const h1 = chroma(a).lch()[2];
        const h2 = chroma(b).lch()[2];
        if (isNaN(h1) || isNaN(h2)) return 0;
        return h1-h2;
    });
}
