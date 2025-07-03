"use client";

// Based on various academic sources for color vision deficiency simulation.

function hexToRgb(hex: string): { r: number, g: number, b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
    const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
    const toHex = (c: number) => ("0" + clamp(c).toString(16)).slice(-2);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const matrices = {
    protan: [ // Protanopia
        [0.567, 0.433, 0],
        [0.558, 0.442, 0],
        [0,     0.242, 0.758]
    ],
    deutan: [ // Deuteranopia
        [0.625, 0.375, 0],
        [0.7,   0.3,   0],
        [0,     0.3,   0.7]
    ],
    tritan: [ // Tritanopia
        [0.95, 0.05,  0],
        [0,    0.433, 0.567],
        [0,    0.475, 0.525]
    ]
};

function applyMatrix(rgb: { r: number, g: number, b: number }, matrix: number[][]): { r: number, g: number, b: number } {
    const r = rgb.r * matrix[0][0] + rgb.g * matrix[0][1] + rgb.b * matrix[0][2];
    const g = rgb.r * matrix[1][0] + rgb.g * matrix[1][1] + rgb.b * matrix[1][2];
    const b = rgb.r * matrix[2][0] + rgb.g * matrix[2][1] + rgb.b * matrix[2][2];
    return { r, g, b };
}

export type SimulationType = 'normal' | 'protan' | 'deutan' | 'tritan';

export function simulate(hex: string, type: SimulationType): string {
  if (!hex || typeof hex !== 'string') return '#000000';
  if (type === 'normal') return hex;
  
  try {
    const matrix = matrices[type as keyof typeof matrices];
    if (!matrix) return hex;

    const rgb = hexToRgb(hex);
    const simulatedRgb = applyMatrix(rgb, matrix);
    return rgbToHex(simulatedRgb.r, simulatedRgb.g, simulatedRgb.b);
  } catch (e) {
    console.error(`Failed to simulate color ${hex} for type ${type}`, e);
    return '#000000'; // Return a fallback color
  }
}
