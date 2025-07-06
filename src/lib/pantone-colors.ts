

export interface PantoneColor {
  name: string;
  hex: string;
  cmyk: string;
}

export interface PantoneCategory {
    name: string;
    colors: PantoneColor[];
}

export const sortPantoneNumerically = (a: PantoneColor, b: PantoneColor): number => {
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

export function createPantoneLookup(categories: PantoneCategory[]): Map<string, string> {
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
