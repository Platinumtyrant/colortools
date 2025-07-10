
import React from 'react';
import { getPantonePmsCategories, getPantoneFhiCategories } from '@/lib/palette-parser';
import { PantoneGuideClientPage } from '@/components/pantone/PantoneGuideClientPage';
import type { PantoneColor } from '@/lib/pantone-colors';

export default function PantoneGuidePage() {
    const pmsCategories = getPantonePmsCategories();
    const fhiCategories = getPantoneFhiCategories();

    const pmsColors: PantoneColor[] = pmsCategories.flatMap(c => c.colors);
    const fhiColors: PantoneColor[] = fhiCategories.flatMap(c => c.colors);
    
    return (
        <PantoneGuideClientPage 
            pmsColors={pmsColors}
            fhiColors={fhiColors}
        />
    );
}
