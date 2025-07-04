import chroma from 'chroma-js';

const HUE_TOLERANCE = 25; // Generous tolerance in degrees

function getHueDistance(h1: number, h2: number): number {
    const diff = Math.abs(h1 - h2);
    return Math.min(diff, 360 - diff);
}

export function analyzePalette(hexColors: string[]): string {
    if (!hexColors || hexColors.length < 2) return 'Custom';

    // Get all hues, filter out grays (where hue is NaN)
    const hues = hexColors.map(hex => chroma(hex).hsl()[0]).filter(h => !isNaN(h));

    // If less than 2 colors have a hue, we can't determine a scheme beyond monochromatic
    if (hues.length < 2) {
        const allHues = hexColors.map(hex => chroma(hex).hsl()[0]);
        // Group all hues (including NaN) to see how many distinct ones there are
        const uniqueSourceHues = new Set(allHues.map(h => isNaN(h) ? 'gray' : Math.round(h / 15) * 15));
        // If it's just one color and its shades/tints (plus grays), it's monochromatic
        if (uniqueSourceHues.size <= 2) { 
            return 'Monochromatic';
        }
        return 'Custom';
    }

    const sortedHues = [...new Set(hues.map(h => Math.round(h / 10) * 10))].sort((a,b) => a-b);
    if(sortedHues.length < 2) return 'Monochromatic';

    // Triadic check (for exactly 3 hue groups)
    if (sortedHues.length === 3) {
        const d1 = getHueDistance(sortedHues[0], sortedHues[1]);
        const d2 = getHueDistance(sortedHues[1], sortedHues[2]);
        const d3 = getHueDistance(sortedHues[2], sortedHues[0]);
        if ( [d1, d2, d3].every(d => Math.abs(d - 120) < HUE_TOLERANCE + 10) ) { // more tolerance for triadic
            return 'Triadic';
        }
    }

    const hueRange = getHueDistance(sortedHues[0], sortedHues[sortedHues.length - 1]);
    
    // Analogous check
    if (hueRange <= 60 + HUE_TOLERANCE) {
        return 'Analogous';
    }

    // Complementary check
    // Look for any pair of hues that are opposites
    for (let i = 0; i < sortedHues.length; i++) {
        for (let j = i + 1; j < sortedHues.length; j++) {
            if (Math.abs(getHueDistance(sortedHues[i], sortedHues[j]) - 180) < HUE_TOLERANCE) {
                return 'Complementary';
            }
        }
    }

    return 'Custom';
}
