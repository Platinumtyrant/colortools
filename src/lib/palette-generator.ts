
import { colord, extend } from 'colord';
import mixPlugin from 'colord/plugins/mix';
import chroma from 'chroma-js';
import { getTints, getShades } from './colors';

extend([mixPlugin]);

export type GenerationType = 'analogous' | 'triadic' | 'complementary' | 'tints' | 'shades';

interface GenerationOptions {
    baseColor: string;
    numColors: number;
    type: GenerationType;
}

export function generatePaletteFromLibrary(options: GenerationOptions): string[] {
    const { baseColor, numColors, type } = options;

    if (!chroma.valid(baseColor)) {
        throw new Error("Invalid base color provided.");
    }

    switch (type) {
        case 'analogous': {
            const baseHsl = colord(baseColor).toHsl();
            const firstAnalogous = colord({ ...baseHsl, h: (baseHsl.h - 30 + 360) % 360 }).toHex();
            const secondAnalogous = colord({ ...baseHsl, h: (baseHsl.h + 30) % 360 }).toHex();
            return chroma.scale([firstAnalogous, baseColor, secondAnalogous]).mode('lch').colors(numColors);
        }
        case 'triadic': {
            const baseHsl = colord(baseColor).toHsl();
            const secondColor = colord({ ...baseHsl, h: (baseHsl.h + 120) % 360 }).toHex();
            const thirdColor = colord({ ...baseHsl, h: (baseHsl.h + 240) % 360 }).toHex();
            return chroma.scale([baseColor, secondColor, thirdColor].sort((a,b) => colord(a).toHsl().h - colord(b).toHsl().h)).mode('lch').colors(numColors);
        }
        case 'complementary': {
            const baseHsl = colord(baseColor).toHsl();
            const complement = colord({ ...baseHsl, h: (baseHsl.h + 180) % 360 }).toHex();
            return chroma.scale([baseColor, complement]).mode('lch').colors(numColors);
        }
        case 'tints': {
            return getTints(baseColor, numColors);
        }
        case 'shades': {
            return getShades(baseColor, numColors);
        }
        default:
            // Fallback to a default scale if type is unrecognized
            return chroma.scale(['#fafa6e','#2A4858']).mode('lch').colors(numColors);
    }
}
