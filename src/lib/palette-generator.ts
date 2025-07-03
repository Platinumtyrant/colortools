
import { colord, extend } from 'colord';
import mixPlugin from 'colord/plugins/mix';
import chroma from 'chroma-js';
import { getTints, getShades } from './colors';

extend([mixPlugin]);

export type GenerationType = 'analogous' | 'triadic' | 'complementary' | 'tints' | 'shades';

interface GenerationOptions {
    numColors: number;
    type: GenerationType;
    lockedColors?: string[];
}

export function getRandomColor(): string {
  return chroma.random().hex();
}

export function generatePalette(options: GenerationOptions): string[] {
    const { numColors, type, lockedColors } = options;

    const colorsToScale = (lockedColors && lockedColors.length > 0) ? lockedColors : [getRandomColor()];
    
    if (colorsToScale.some(c => !chroma.valid(c))) {
        throw new Error("Invalid base color provided.");
    }
    
    switch (type) {
        case 'analogous': {
            const base = colorsToScale[0];
            const baseHsl = colord(base).toHsl();
            const firstAnalogous = colord({ ...baseHsl, h: (baseHsl.h - 30 + 360) % 360 }).toHex();
            const secondAnalogous = colord({ ...baseHsl, h: (baseHsl.h + 30) % 360 }).toHex();
            const fullScale = [...colorsToScale, firstAnalogous, secondAnalogous].sort((a,b) => colord(a).toHsl().h - colord(b).toHsl().h);
            return chroma.scale(fullScale).mode('lch').colors(numColors);
        }
        case 'triadic': {
            const base = colorsToScale[0];
            const baseHsl = colord(base).toHsl();
            const secondColor = colord({ ...baseHsl, h: (baseHsl.h + 120) % 360 }).toHex();
            const thirdColor = colord({ ...baseHsl, h: (baseHsl.h + 240) % 360 }).toHex();
            const fullScale = [...colorsToScale, secondColor, thirdColor].sort((a,b) => colord(a).toHsl().h - colord(b).toHsl().h);
            return chroma.scale(fullScale).mode('lch').colors(numColors);
        }
        case 'complementary': {
            const base = colorsToScale[0];
            const baseHsl = colord(base).toHsl();
            const complement = colord({ ...baseHsl, h: (baseHsl.h + 180) % 360 }).toHex();
            const fullScale = [...colorsToScale, complement].sort((a,b) => colord(a).toHsl().h - colord(b).toHsl().h);
            return chroma.scale(fullScale).mode('lch').colors(numColors);
        }
        case 'tints': {
            return getTints(colorsToScale[0], numColors);
        }
        case 'shades': {
            return getShades(colorsToScale[0], numColors);
        }
        default:
            return chroma.scale(colorsToScale).mode('lch').colors(numColors);
    }
}
