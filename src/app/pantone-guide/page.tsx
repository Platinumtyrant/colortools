
import React from 'react';
import { getPantoneCategories } from '@/lib/palette-parser';
import { PantoneGuideClientPage } from '@/components/pantone/PantoneGuideClientPage';

export default async function PantoneGuidePage() {
    // The pantoneCategories are now fetched on the server at build time
    // and passed as a prop to the client component.
    const pantoneCategories = await getPantoneCategories();
    return (
        <PantoneGuideClientPage pantoneCategories={pantoneCategories} />
    );
}
