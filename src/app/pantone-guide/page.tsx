
import React from 'react';
import { getPantonePmsCategories, getPantoneFhiCategories } from '@/lib/palette-parser';
import { PantoneGuideClientPage } from '@/components/pantone/PantoneGuideClientPage';

export default function PantoneGuidePage() {
    const pmsCategories = getPantonePmsCategories();
    const fhiCategories = getPantoneFhiCategories();
    
    return (
        <PantoneGuideClientPage 
            pmsCategories={pmsCategories}
            fhiCategories={fhiCategories}
        />
    );
}
