
import fs from 'fs';
import path from 'path';

export interface PantoneColor {
  name: string;
  hex: string;
  cmyk: string;
}

export interface PantoneCategory {
    name: string;
    colors: PantoneColor[];
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

function parsePantoneFile(): PantoneCategory[] {
    const filePath = path.join(process.cwd(), 'pantone.txt');
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n');

        const categories: Record<string, PantoneColor[]> = {};
        const categoryOrder: string[] = [];
        let currentCategoryName: string | null = null;
        let currentColor: Partial<PantoneColor> = {};

        const saveCurrentColor = () => {
            if (currentCategoryName && currentColor.name && currentColor.hex && currentColor.cmyk) {
                categories[currentCategoryName].push(currentColor as PantoneColor);
            }
            currentColor = {};
        };
        
        const isHeader = (line: string) => /^[A-Za-z\d\s\/&,]+$/.test(line) && line.toUpperCase() !== line && !line.startsWith("PANTONE");

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            if (isHeader(trimmedLine)) {
                saveCurrentColor(); // Save the last color of the previous category
                currentCategoryName = trimmedLine;
                if (!categories[currentCategoryName]) {
                    categories[currentCategoryName] = [];
                    categoryOrder.push(currentCategoryName);
                }
            } else if (trimmedLine.startsWith('PANTONE')) {
                saveCurrentColor();
                currentColor.name = trimmedLine;
            } else if (trimmedLine.startsWith('#')) {
                currentColor.hex = trimmedLine;
            } else if (trimmedLine.startsWith('C:')) {
                currentColor.cmyk = trimmedLine;
            }
        }
        saveCurrentColor(); // Save the very last color

        return categoryOrder.map(name => ({
            name: name,
            colors: categories[name].sort(sortPantoneNumerically)
        })).filter(category => category.colors.length > 0);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log("Note: 'pantone.txt' not found. Pantone guide will be empty.");
        } else {
            console.error("Failed to read or parse pantone.txt:", error);
        }
        return [];
    }
}

function createPantoneLookup(categories: PantoneCategory[]): Map<string, string> {
    const lookup = new Map<string, string>();
    for (const category of categories) {
        for (const color of category.colors) {
            const hexKey = color.hex.toLowerCase();
            if (!lookup.has(hexKey)) {
                lookup.set(hexKey, color.name);
            }
        }
    }
    return lookup;
}

export const pantoneCategories = parsePantoneFile();
export const pantoneLookup = createPantoneLookup(pantoneCategories);
