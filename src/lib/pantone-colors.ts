
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
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    const categories: Record<string, PantoneColor[]> = {};
    const categoryOrder: string[] = [];

    let currentCategoryName = 'Process Colors';
    categories[currentCategoryName] = [];
    categoryOrder.push(currentCategoryName);

    let currentColor: Partial<PantoneColor> = {};

    const isHeader = (line: string) => /^[A-Za-z\/& ]+$/.test(line) && line.toUpperCase() !== line && !line.startsWith("PANTONE");

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // This is a header if it's mixed case and doesn't start with PANTONE
        if (isHeader(trimmedLine)) {
            if (currentColor.name && currentColor.hex && currentColor.cmyk) {
                if (categories[currentCategoryName]) {
                    categories[currentCategoryName].push(currentColor as PantoneColor);
                }
                currentColor = {};
            }
            currentCategoryName = trimmedLine;
            if (!categories[currentCategoryName]) {
                categories[currentCategoryName] = [];
                categoryOrder.push(currentCategoryName);
            }
        } else if (trimmedLine.startsWith('PANTONE')) {
            if (currentColor.name && currentColor.hex && currentColor.cmyk) {
                if (categories[currentCategoryName]) {
                    categories[currentCategoryName].push(currentColor as PantoneColor);
                }
            }
            currentColor = { name: trimmedLine };
        } else if (trimmedLine.startsWith('#')) {
            currentColor.hex = trimmedLine;
        } else if (trimmedLine.startsWith('C:')) {
            currentColor.cmyk = trimmedLine;
        }
    }
    if (currentColor.name && currentColor.hex && currentColor.cmyk) {
         if (categories[currentCategoryName]) {
            categories[currentCategoryName].push(currentColor as PantoneColor);
         }
    }
    
    // The file contains duplicate headers; this ensures we merge the colors.
    const uniqueCategoryOrder = [...new Set(categoryOrder)];

    return uniqueCategoryOrder.map(name => ({
        name: name,
        colors: categories[name].sort(sortPantoneNumerically)
    })).filter(category => category.colors.length > 0);
}

export const pantoneCategories = parsePantoneFile();
