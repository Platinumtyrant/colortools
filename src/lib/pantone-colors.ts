
import fs from 'fs';
import path from 'path';

export interface PantoneColor {
  name: string;
  hex: string;
  cmyk: string;
}

const sortPantoneNumerically = (a: PantoneColor, b: PantoneColor): number => {
  const regex = /(\d+(\.\d+)?)/g;
  
  const numStrA = (a.name.match(regex) || []).join('');
  const numStrB = (b.name.match(regex) || []).join('');

  const numA = numStrA ? parseFloat(numStrA) : -1;
  const numB = numStrB ? parseFloat(numStrB) : -1;
  
  if (numA !== -1 && numB !== -1) {
      if (numA !== numB) {
          return numA - numB;
      }
  }

  return a.name.localeCompare(b.name, undefined, { numeric: true });
};


function parsePantoneFile(): Record<string, PantoneColor[]> {
    const filePath = path.join(process.cwd(), 'pantone.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    const categories: Record<string, PantoneColor[]> = {
        process: [],
        yellowOrange: [],
        orangeRed: [],
        pinkPurple: [],
        blueViolet: [],
        cyanGreen: [],
        yellowGreen: [],
        grayBrown: [],
    };

    let currentCategory: string | null = null;
    let currentColor: Partial<PantoneColor> = {};

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
            if (currentColor.name && currentColor.hex && currentColor.cmyk) {
                if (currentCategory) categories[currentCategory].push(currentColor as PantoneColor);
                currentColor = {};
            }
            continue;
        }

        if (trimmedLine.startsWith('PANTONE')) {
             if (currentColor.name && currentColor.hex && currentColor.cmyk) {
                if (currentCategory) categories[currentCategory].push(currentColor as PantoneColor);
            }
            currentColor = { name: trimmedLine };
        } else if (trimmedLine.startsWith('#')) {
            currentColor.hex = trimmedLine;
        } else if (trimmedLine.startsWith('C:')) {
            currentColor.cmyk = trimmedLine;
        } else { // It's a category header
            const lowerLine = trimmedLine.toLowerCase();
            if (lowerLine.includes('yellows and oranges')) currentCategory = 'yellowOrange';
            else if (lowerLine.includes('oranges and reds')) currentCategory = 'orangeRed';
            else if (lowerLine.includes('pinks and purples')) currentCategory = 'pinkPurple';
            else if (lowerLine.includes('blues and violets')) currentCategory = 'blueViolet';
            else if (lowerLine.includes('cyans and greens')) currentCategory = 'cyanGreen';
            else if (lowerLine.includes('yellow/greens')) currentCategory = 'yellowGreen';
            else if (lowerLine.includes('grays') || lowerLine.includes('browns')) currentCategory = 'grayBrown';
            else if (lowerLine.includes('panetone pro')) currentCategory = 'process';
        }
    }
     if (currentColor.name && currentColor.hex && currentColor.cmyk) {
        if (currentCategory) categories[currentCategory].push(currentColor as PantoneColor);
    }
    
    // The first 4 are the process colors
    const allColors = [...categories.process, ...categories.yellowOrange, ...categories.orangeRed, ...categories.pinkPurple, ...categories.blueViolet, ...categories.cyanGreen, ...categories.yellowGreen, ...categories.grayBrown];
    const proColors = allColors.filter(c => c.name.includes('PANTONE Pro.'));
    if(proColors.length > 0) categories.process = proColors;


    for (const key in categories) {
        categories[key].sort(sortPantoneNumerically);
    }
    
    return categories;
}

const parsedColors = parsePantoneFile();

export const pantoneProColors = parsedColors.process;
export const yellowAndOrangeColors = parsedColors.yellowOrange;
export const orangeAndRedColors = parsedColors.orangeRed;
export const pinkAndPurpleColors = parsedColors.pinkPurple;
export const blueAndVioletColors = parsedColors.blueViolet;
export const cyanAndGreenColors = parsedColors.cyanGreen;
export const yellowAndGreenColors = parsedColors.yellowGreen;
export const grayAndBrownColors = parsedColors.grayBrown;
