import { colord, extend, type HslColor } from 'colord';
import hwbPlugin from 'colord/plugins/hwb';
import labPlugin from 'colord/plugins/lab';
import lchPlugin from 'colord/plugins/lch';
import a11yPlugin from 'colord/plugins/a11y';
import mixPlugin from 'colord/plugins/mix';
import namesPlugin from 'colord/plugins/names';

extend([hwbPlugin, labPlugin, lchPlugin, a11yPlugin, mixPlugin, namesPlugin]);

export const getComplementary = (color: string) => {
  const hsl = colord(color).toHsl();
  const complementaryH = (hsl.h + 180) % 360;
  return [
    colord({ h: hsl.h, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: complementaryH, s: hsl.s, l: hsl.l } as HslColor).toHex(),
  ];
};

export const getAnalogous = (color: string) => {
  const hsl = colord(color).toHsl();
  const colors: string[] = [];
  for (let i = -60; i <= 60; i += 30) {
    colors.push(colord({ h: (hsl.h + i + 360) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex());
  }
  return colors.sort((a, b) => colord(a).toHsl().h - colord(b).toHsl().h);
};

export const getSplitComplementary = (color: string) => {
  const hsl = colord(color).toHsl();
  const complementaryH = (hsl.h + 180) % 360;
  return [
    colord({ h: hsl.h, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: (complementaryH - 30 + 360) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: (complementaryH + 30) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex(),
  ].sort((a, b) => colord(a).toHsl().h - colord(b).toHsl().h);
};

export const getTriadic = (color: string) => {
  const hsl = colord(color).toHsl();
  return [
    colord({ h: hsl.h, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: (hsl.h + 120) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: (hsl.h + 240) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex(),
  ].sort((a, b) => colord(a).toHsl().h - colord(b).toHsl().h);
};

export const getSquare = (color: string) => {
  const hsl = colord(color).toHsl();
  return [
    colord({ h: hsl.h, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: (hsl.h + 90) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: (hsl.h + 270) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex(),
  ].sort((a, b) => colord(a).toHsl().h - colord(b).toHsl().h);
};

export const getRectangular = (color: string) => {
  const hsl = colord(color).toHsl();
  return [
    colord({ h: hsl.h, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: (hsl.h + 30) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex(),
    colord({ h: (hsl.h + 210) % 360, s: hsl.s, l: hsl.l } as HslColor).toHex(),
  ].sort((a, b) => colord(a).toHsl().h - colord(b).toHsl().h);
};

export const getTints = (color: string, steps = 5) => {
  const tints: string[] = [];
  if (steps <= 1) {
    return [colord(color).toHex()];
  }
  for (let i = 0; i < steps; i++) {
    tints.push(colord(color).lighten(i / (steps - 1)).toHex());
  }
  return [...new Set(tints)];
};

export const getShades = (color: string, steps = 5) => {
  const shades: string[] = [];
  if (steps <= 1) {
    return [colord(color).toHex()];
  }
  for (let i = 0; i < steps; i++) {
    shades.push(colord(color).darken(i / (steps - 1)).toHex());
  }
  return [...new Set(shades)];
};

export const getTones = (color: string, steps = 5) => {
  const tones: string[] = [];
  if (steps <= 1) {
    return [colord(color).toHex()];
  }
  for (let i = 0; i < steps; i++) {
    tones.push(colord(color).mix('gray', i / (steps - 1)).toHex());
  }
  return [...new Set(tones)];
};

export const swatches = {
  green: ['#bedb39', '#a8c545', '#bdd684', '#95ab63', '#a9cf54', '#96ca2d', '#b5e655', '#bdf271', '#8bc34a', '#588f27', '#689f38', '#91c46c', '#beeb9f', '#b1ff91', '#33691e', '#96ed89', '#43a047', '#66bb6a', '#2e7d32', '#45bf55', '#79bd8f', '#168039', '#67cc8e', '#468966', '#289976', '#1f8a70', '#1bbc9b', '#00a388', '#00796b', '#26a69a', '#009688', '#04756f', '#287d7d'],
  blue: ['#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5', '#2196f3', '#1976d2', '#1565c0', '#0d47a1', '#82b1ff', '#448aff', '#2979ff', '#2962ff'],
  red: ['#ffebee', '#ffcdd2', '#ef9a9a', '#e57373', '#ef5350', '#f44336', '#e53935', '#d32f2f', '#c62828', '#b71c1c', '#ff8a80', '#ff5252', '#ff1744', '#d50000'],
  orange: ['#fff3e0', '#ffe0b2', '#ffcc80', '#ffb74d', '#ffa726', '#ff9800', '#fb8c00', '#f57c00', '#ef6c00', '#e65100', '#ffd180', '#ffab40', '#ff9100', '#ff6d00'],
  purple: ['#f3e5f5', '#e1bee7', '#ce93d8', '#ba68c8', '#ab47bc', '#9c27b0', '#8e24aa', '#7b1fa2', '#6a1b9a', '#4a148c', '#ea80fc', '#e040fb', '#d500f9', '#aa00ff'],
  yellow: ['#fffde7', '#fff9c4', '#fff59d', '#fff176', '#ffee58', '#ffeb3b', '#fdd835', '#fbc02d', '#f9a825', '#f57f17', '#ffff8d', '#ffff00', '#ffea00', '#ffd600'],
  gray: ['#f5f5f5', '#eeeeee', '#e0e0e0', '#bdbdbd', '#9e9e9e', '#757575', '#616161', '#424242', '#212121', '#fafafa', '#f0f0f0', '#e8e8e8', '#dcdcdc', '#d4d4d4', '#c8c8c8', '#a0a0a0', '#808080', '#606060', '#404040', '#202020', '#000000'],
};
